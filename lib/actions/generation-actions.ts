"use server";

import { db } from "@/config/db";
import { StoryData, Users } from "@/config/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import Replicate from "replicate";
import { storage } from "@/config/firebaseConfig";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { LANGUAGE_MAPPINGS } from "@/lib/constants/languages";

// ================= CONFIGURATION =================
const CONFIG = {
  TIMEOUTS: {
    CLAUDE_GENERATION: 240000,         // 4 minutes
    IMAGE_GENERATION: 180000,          // 3 minutes
    IMAGE_CONVERSION: 60000,           // 1 minute
    FIREBASE_UPLOAD: 60000,            // 1 minute
    DATABASE_OPERATION: 30000,         // 30 seconds
    REQUEST_PARSING: 10000,            // 10 seconds
  },
  RATE_LIMITS: {
    MAX_REQUESTS_PER_WINDOW: 5,
    WINDOW_MS: 15 * 60 * 1000,         // 15 minutes
    MIN_REQUEST_INTERVAL: 3000,        // 3 seconds between requests
    CLEANUP_THRESHOLD: 1000,           // Clean up after 1000 entries
  },
  RETRIES: {
    CLAUDE_MAX: 3,
    IMAGE_MAX: 3,
    DATABASE_MAX: 3,
    FIREBASE_MAX: 3,
  },
  VALIDATION: {
    MAX_SUBJECT_LENGTH: 500,
    MIN_SUBJECT_LENGTH: 2,
    REQUIRED_CHAPTERS: 5,
    MAX_PROMPT_LENGTH: 10000,
  },
  LIMITS: {
    MAX_REQUEST_SIZE: 1024 * 1024,      // 1MB
    MAX_CONCURRENT_REQUESTS: 100,
  }
} as const;

// ================= VALIDATION SCHEMA =================
const StoryGenerationSchema = z.object({
  storySubject: z
    .string()
    .min(CONFIG.VALIDATION.MIN_SUBJECT_LENGTH, "Story subject must be at least 2 characters")
    .max(CONFIG.VALIDATION.MAX_SUBJECT_LENGTH, "Story subject too long"),
  storyType: z.string().min(1, "Story type is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  imageStyle: z.string().min(1, "Image style is required"),
  language1: z.string().min(1, "Known language is required"),
  language2: z.string().min(1, "Target language is required"),
  genre: z.string().min(1, "Genre is required"),
});

export type StoryGenerationState = {
  success: boolean;
  message: string;
  storyId?: string;
  errors?: Record<string, string[]>;
};

// ================= ENVIRONMENT VALIDATION =================
interface ValidatedEnvironment {
  REPLICATE_API_KEY: string;
  NODE_ENV: string;
}

function validateEnvironment(): ValidatedEnvironment {
  const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
  const NODE_ENV = process.env.NODE_ENV || "development";
  
  if (!REPLICATE_API_KEY) {
    throw new Error("Missing required environment variable: REPLICATE_API_KEY");
  }
  if (REPLICATE_API_KEY.length < 10) {
    throw new Error("Invalid REPLICATE_API_KEY: too short");
  }
  
  return { REPLICATE_API_KEY, NODE_ENV };
}



// ================= ERROR HANDLING =================
class APIError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly retryable: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    status = 500,
    code = "INTERNAL_ERROR",
    details?: Record<string, any>,
    retryable = false
  ) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      retryable: this.retryable,
      timestamp: this.timestamp,
    };
  }
}

// ================= TIMEOUT WRAPPER =================
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new APIError(
          `Operation '${operationName}' timed out after ${timeoutMs}ms`,
          408,
          "TIMEOUT_ERROR",
          { timeoutMs, operationName },
          true
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// ================= RETRY MECHANISM =================
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  operationName: string,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const isRetryable = shouldRetry
        ? shouldRetry(error)
        : error.retryable ||
          (error.status >= 500) ||
          (error.code === "TIMEOUT_ERROR") ||
          (error.message?.includes("network") && !error.message?.includes("404"));
      
      const shouldStopRetrying =
        !isRetryable ||
        attempt >= maxRetries ||
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404 ||
        error.code === "VALIDATION_ERROR" ||
        error.code === "INVALID_REQUEST";
      
      if (shouldStopRetrying) {
        break;
      }
      
      await new Promise((res) => setTimeout(res, 300 * attempt));
    }
  }
  
  throw lastError;
}

// ================== RATE LIMITING ==================
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
  violations: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupRateLimit(): void {
  if (rateLimitStore.size <= CONFIG.RATE_LIMITS.CLEANUP_THRESHOLD) return;
  
  const now = Date.now();
  const cutoff = now - CONFIG.RATE_LIMITS.WINDOW_MS * 2;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(userId: string, ip?: string): {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
  resetTime?: number;
} {
  cleanupRateLimit();
  const now = Date.now();
  const key = userId || ip || "anonymous";
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMITS.WINDOW_MS,
      lastRequest: now,
      violations: entry?.violations || 0,
      blocked: false,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: CONFIG.RATE_LIMITS.MAX_REQUESTS_PER_WINDOW - 1,
      resetTime: newEntry.resetTime,
    };
  }
  
  const timeSinceLastRequest = now - entry.lastRequest;
  if (timeSinceLastRequest < CONFIG.RATE_LIMITS.MIN_REQUEST_INTERVAL) {
    entry.violations++;
    entry.blocked = true;
    return {
      allowed: false,
      retryAfter: Math.ceil(
        (CONFIG.RATE_LIMITS.MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000
      ),
      resetTime: entry.resetTime,
    };
  }
  
  if (entry.count >= CONFIG.RATE_LIMITS.MAX_REQUESTS_PER_WINDOW) {
    entry.blocked = true;
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  entry.lastRequest = now;
  entry.blocked = false;
  
  return {
    allowed: true,
    remaining: CONFIG.RATE_LIMITS.MAX_REQUESTS_PER_WINDOW - entry.count,
    resetTime: entry.resetTime,
  };
}

// ================== STORY PROMPT GENERATION ==================
function generateStoryPrompt(formData: any): string {
  const { storySubject, storyType, ageGroup, imageStyle, language1, language2, genre } = formData;
  const knownLang = LANGUAGE_MAPPINGS[language1] || language1;
  const targetLang = LANGUAGE_MAPPINGS[language2] || language2;
  
  const prompt = `You are an expert storyteller and language learning specialist. Create an educational bilingual story for language learners.

STORY SPECIFICATIONS:
- Subject: ${storySubject}
- Type: ${storyType}
- Genre: ${genre}
- Target Audience: ${ageGroup}
- Known Language: ${knownLang}
- Learning Language: ${targetLang}
- Visual Style: ${imageStyle}

STRUCTURE REQUIREMENTS:
- Create exactly ${CONFIG.VALIDATION.REQUIRED_CHAPTERS} chapters
- Each chapter should have 2-3 sentences per language
- Include educational vocabulary for language learning
- Ensure age-appropriate content
- Maintain engaging storytelling throughout

CRITICAL: Respond with ONLY valid JSON in this exact format (no markdown, no extra text):

{
  "bookTitle": {
    "${language1}": "Engaging title in ${knownLang}",
    "${language2}": "Same title translated to ${targetLang}"
  },
  "cover": {
    "imagePrompt": "Professional ${imageStyle} style book cover illustration depicting the main theme of '${storySubject}', suitable for ${ageGroup}, vibrant and engaging",
    "imageText": "Cover description for accessibility"
  },
  "chapters": [${Array.from({ length: CONFIG.VALIDATION.REQUIRED_CHAPTERS }, (_, i) => `
    {
      "chapterNumber": ${i + 1},
      "chapterTitle": {
        "${language1}": "Chapter ${i + 1} title in ${knownLang}",
        "${language2}": "Chapter ${i + 1} title in ${targetLang}"
      },
      "storyText": {
        "${language1}": "2-3 clear, engaging sentences in ${knownLang} for chapter ${i + 1}. Make it educational and appropriate for ${ageGroup}.",
        "${language2}": "2-3 clear, engaging sentences in ${targetLang} for chapter ${i + 1}. Make it educational and appropriate for ${ageGroup}."
      },
      "imagePrompt": "Detailed ${imageStyle} style illustration for chapter ${i + 1} scene, showing key story elements, colorful and engaging for ${ageGroup}",
      "imageText": "Accessibility description for chapter ${i + 1} image",
      "difficultWords": [
        {
          "word": "challenging vocabulary word from ${targetLang} text",
          "meaning": "simple explanation in ${knownLang}",
          "pronunciation": "phonetic guide if helpful"
        }
      ]
    }`).join(",")}
  ],
  "moralOfTheStory": {
    "moral": {
      "${language1}": "Positive, educational lesson or message in ${knownLang}",
      "${language2}": "Same positive, educational lesson or message in ${targetLang}"
    }
  }
}

IMPORTANT: Return only the JSON object above, with no additional formatting or text.`;

  if (prompt.length > CONFIG.VALIDATION.MAX_PROMPT_LENGTH) {
    throw new APIError(
      "Generated prompt too long",
      400,
      "PROMPT_TOO_LONG",
      { promptLength: prompt.length, maxLength: CONFIG.VALIDATION.MAX_PROMPT_LENGTH }
    );
  }
  
  return prompt;
}

// ================== STORY GENERATION WITH CLAUDE ==================
async function generateStoryWithClaude(
  prompt: string,
  replicateClient: Replicate,
  requestId: string
): Promise<string> {
  return executeWithRetry(
    async () => {
      const operation = async (): Promise<string> => {
        try {
          const output = await replicateClient.run("anthropic/claude-3.5-haiku", {
            input: {
              prompt,
              max_tokens: 8192,
              temperature: 0.7,
              top_p: 0.9,
              top_k: 50,
            },
          }) as string[];
          
          const storyText = Array.isArray(output) ? output.join("").trim() : String(output).trim();
          
          if (!storyText || storyText.length === 0) {
            throw new APIError(
              "Claude returned empty response",
              500,
              "EMPTY_CLAUDE_RESPONSE",
              { promptLength: prompt.length },
              true
            );
          }
          
          if (storyText.length < 100) {
            throw new APIError(
              "Claude response too short",
              500,
              "INSUFFICIENT_CONTENT",
              { responseLength: storyText.length },
              true
            );
          }
          
          return storyText;
        } catch (error: any) {
          if (error instanceof APIError) throw error;
          
          throw new APIError(
            `Claude generation failed: ${error.message}`,
            500,
            "CLAUDE_GENERATION_FAILED",
            { originalError: error.message },
            true
          );
        }
      };
      
      return withTimeout(operation(), CONFIG.TIMEOUTS.CLAUDE_GENERATION, `Claude story generation [${requestId}]`);
    },
    CONFIG.RETRIES.CLAUDE_MAX,
    `Claude generation for request ${requestId}`,
    (error) => error.retryable || error.status >= 500
  );
}

// ================== IMAGE GENERATION ==================
async function generateImage(
  prompt: string,
  replicateClient: Replicate,
  requestId: string
): Promise<string> {
  return executeWithRetry(
    async () => {
      const operation = async (): Promise<string> => {
        if (!prompt || prompt.trim().length === 0) {
          throw new APIError("Empty image prompt", 400, "EMPTY_IMAGE_PROMPT");
        }
        
        try {
          const output = await replicateClient.run("black-forest-labs/flux-dev-lora", {
            input: {
              prompt: prompt.trim(),
              aspect_ratio: "1:1",
              output_format: "webp",
              output_quality: 90,
              num_inference_steps: 4,
              guidance_scale: 7.5,
            },
          });
          
          let imageUrl: string | null = null;
          
          // Handle different possible response formats
          if (Array.isArray(output) && output.length > 0) {
            const firstItem = output[0];
            
            // Check if it's a ReadableStream with url() method
            if (firstItem && typeof firstItem.url === 'function') {
              try {
                const urlObject = firstItem.url();
                imageUrl = urlObject.href;
              } catch (urlError) {
                console.error(`[${requestId}] Error extracting URL from stream:`, urlError);
              }
            } 
            // Check if it's a direct string
            else if (typeof firstItem === "string") {
              imageUrl = firstItem;
            } 
            // Check if it's an object with URL properties
            else if (typeof firstItem === "object" && firstItem !== null) {
              imageUrl = firstItem.url || firstItem.image_url || firstItem.image || firstItem.output;
            }
          } else if (typeof output === "string") {
            imageUrl = output;
          } else if (typeof output === "object" && output !== null) {
            // Check if the main output has url() method
            if (typeof (output as any).url === 'function') {
              try {
                const urlObject = (output as any).url();
                imageUrl = urlObject.href;
              } catch (urlError) {
                console.error(`[${requestId}] Error extracting URL from main output:`, urlError);
              }
            } else {
              imageUrl = (output as any).url || (output as any).image_url || (output as any).image || (output as any).output;
            }
          }
          
          if (!imageUrl || typeof imageUrl !== "string") {
            throw new APIError(
              "Invalid image URL returned - could not extract URL",
              500,
              "INVALID_IMAGE_URL_RETURNED",
              { 
                outputType: typeof output,
                hasUrlMethod: output && Array.isArray(output) && output[0] && typeof output[0].url === 'function'
              },
              true
            );
          }
          
          if (!imageUrl.startsWith("http")) {
            console.error(`[${requestId}] Non-HTTP URL returned:`, imageUrl);
            throw new APIError(
              "Invalid image URL returned - not HTTP URL",
              500,
              "INVALID_IMAGE_URL_RETURNED",
              { receivedUrl: imageUrl.substring(0, 100) },
              true
            );
          }
          return imageUrl;
          
        } catch (error: any) {
          if (error instanceof APIError) throw error;
          
          throw new APIError(
            `Image generation failed: ${error.message}`,
            500,
            "IMAGE_GENERATION_FAILED",
            { originalError: error.message },
            true
          );
        }
      };
      
      return withTimeout(operation(), CONFIG.TIMEOUTS.IMAGE_GENERATION, `Image generation [${requestId}]`);
    },
    CONFIG.RETRIES.IMAGE_MAX,
    `Image generation for request ${requestId}`,
    (error) => error.retryable || error.status >= 500
  );
}

// ================== IMAGE CONVERSION TO BASE64 ==================
async function convertImageToBase64(url: string, requestId: string): Promise<string> {
  return executeWithRetry(
    async () => {
      const operation = async (): Promise<string> => {
        if (!url || !url.startsWith("http")) {
          throw new APIError("Invalid image URL provided", 400, "INVALID_IMAGE_URL");
        }
        
        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent": "StoryGenerator/3.0",
              "Accept": "image/*,*/*;q=0.8",
              "Cache-Control": "no-cache",
            },
          });
          
          if (!response.ok) {
            throw new APIError(
              `Failed to fetch image: HTTP ${response.status}`,
              response.status >= 500 ? response.status : 500,
              "IMAGE_FETCH_FAILED",
              { url: url.substring(0, 100), status: response.status },
              response.status >= 500
            );
          }
          
          const contentType = response.headers.get("content-type");
          if (!contentType?.startsWith("image/")) {
            throw new APIError("Invalid image content type", 400, "INVALID_CONTENT_TYPE", { contentType });
          }
          
          const arrayBuffer = await response.arrayBuffer();
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new APIError("Empty image response", 500, "EMPTY_IMAGE_RESPONSE", { url: url.substring(0, 100) }, true);
          }
          
          if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
            throw new APIError("Image too large", 400, "IMAGE_TOO_LARGE", { size: arrayBuffer.byteLength });
          }
          
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          if (!base64 || base64.length < 100) {
            throw new APIError("Invalid base64 image data", 500, "INVALID_BASE64_DATA", { dataLength: base64.length }, true);
          }
          
          return base64;
        } catch (error: any) {
          if (error instanceof APIError) throw error;
          
          throw new APIError(
            `Image conversion failed: ${error.message}`,
            500,
            "IMAGE_CONVERSION_FAILED",
            { originalError: error.message },
            true
          );
        }
      };
      
      return withTimeout(operation(), CONFIG.TIMEOUTS.IMAGE_CONVERSION, `Image conversion [${requestId}]`);
    },
    CONFIG.RETRIES.IMAGE_MAX,
    `Image conversion for request ${requestId}`,
    (error) => error.retryable || (error.status >= 500 && error.status !== 503)
  );
}

// ==============firebase upload========
async function uploadToFirebase(base64Image: string, requestId: string): Promise<string> {
  return executeWithRetry(
    async () => {
      const operation = async (): Promise<string> => {
        if (!base64Image || base64Image.length < 100) {
          throw new APIError("Invalid base64 image data for upload", 400, "INVALID_UPLOAD_DATA");
        }
        
        try {
          const timestamp = Date.now();
          const fileName = `images/${timestamp}-${requestId}.webp`; // Changed to .webp
          const imageRef = ref(storage, fileName);
          
          await uploadString(imageRef, base64Image, "base64", {
            contentType: "image/webp", // Add this for WebP files
          });
          
          const downloadURL = await getDownloadURL(imageRef);
          if (!downloadURL || !downloadURL.startsWith("http")) {
            throw new APIError("Failed to get valid Firebase download URL", 500, "INVALID_DOWNLOAD_URL", { fileName }, true);
          }
          
          return downloadURL;
        } catch (error: any) {
          if (error instanceof APIError) throw error;
          
          throw new APIError(
            `Firebase upload failed: ${error.message}`,
            500,
            "FIREBASE_UPLOAD_FAILED",
            { originalError: error.message },
            true
          );
        }
      };
      
      return withTimeout(operation(), CONFIG.TIMEOUTS.FIREBASE_UPLOAD, `Firebase upload [${requestId}]`);
    },
    CONFIG.RETRIES.FIREBASE_MAX,
    `Firebase upload for request ${requestId}`,
    (error) => !error.message?.includes("permission") && !error.message?.includes("quota")
  );
}
// ================== DATABASE OPERATIONS ==================
async function getUserWithValidation(userId: string, requestId: string) {
  return executeWithRetry(
    async () => {
      const operation = async () => {
        if (!userId || typeof userId !== "string") {
          throw new APIError("Invalid user ID", 400, "INVALID_USER_ID");
        }
        
        try {
          const userResult = await db
            .select()
            .from(Users)
            .where(eq(Users.clerkUserId, userId))
            .limit(1);
          
          if (!userResult || userResult.length === 0) {
            throw new APIError(
              "User not found. Please complete your onboarding first.",
              404,
              "USER_NOT_FOUND",
              { userId: userId.substring(0, 8) }
            );
          }
          
          const user = userResult[0];
          if (user.credits === null || user.credits === undefined || user.credits <= 0) {
            throw new APIError(
              "Insufficient credits. Please purchase more credits to continue.",
              403,
              "INSUFFICIENT_CREDITS",
              {
                currentCredits: user.credits,
                userId: userId.substring(0, 8),
              }
            );
          }
          
          return user;
        } catch (error: any) {
          if (error instanceof APIError) throw error;
          
          throw new APIError(
            `Database error during user validation: ${error.message}`,
            500,
            "DATABASE_ERROR",
            { originalError: error.message },
            true
          );
        }
      };
      
      return withTimeout(operation(), CONFIG.TIMEOUTS.DATABASE_OPERATION, `User validation [${requestId}]`);
    },
    CONFIG.RETRIES.DATABASE_MAX,
    `User validation for request ${requestId}`,
    (error) => error.code !== "USER_NOT_FOUND" && error.code !== "INSUFFICIENT_CREDITS"
  );
}

async function deductCreditAndSaveStory(
  userId: string,
  storyData: any,
  requestId: string
): Promise<{ storyId: string; creditsRemaining: number }> {
  return executeWithRetry(
    async () => {
      const operation = async (): Promise<{ storyId: string; creditsRemaining: number }> => {
        try {
          // Use proper database transaction
          return await db.transaction(async (tx) => {
            // Deduct credit within transaction
            const deductResult = await tx
              .update(Users)
              .set({
                credits: sql`${Users.credits} - 1`,
                updatedAt: new Date(),
              })
              .where(and(eq(Users.clerkUserId, userId), gt(Users.credits, 0)))
              .returning({ credits: Users.credits });
            
            if (!deductResult || deductResult.length === 0) {
              throw new APIError(
                "Insufficient credits. Please purchase more credits to continue.",
                403,
                "INSUFFICIENT_CREDITS_FOR_DEDUCT",
                { userId: userId.substring(0, 8) }
              );
            }
            
            const newBalance = deductResult[0].credits;
            
            // Save story within same transaction
            const storyResult = await tx
              .insert(StoryData)
              .values(storyData)
              .returning({ storyId: StoryData.storyId });
            
            if (!storyResult || storyResult.length === 0) {
              // Transaction will automatically rollback
              throw new APIError(
                "Failed to save story to database",
                500,
                "STORY_SAVE_FAILED",
                { userId: userId.substring(0, 8) }
              );
            }
            
            return {
              storyId: storyResult[0].storyId,
              creditsRemaining: newBalance,
            };
          });
        } catch (error: any) {
          if (error instanceof APIError) throw error;
          
          throw new APIError(
            `Database error during story save: ${error.message}`,
            500,
            "DATABASE_ERROR",
            { originalError: error.message },
            true
          );
        }
      };
      
      return withTimeout(operation(), CONFIG.TIMEOUTS.DATABASE_OPERATION, `Story save and credit deduction [${requestId}]`);
    },
    CONFIG.RETRIES.DATABASE_MAX,
    `Story save and credit deduction for request ${requestId}`,
    (error) => error.code !== "INSUFFICIENT_CREDITS_FOR_DEDUCT"
  );
}

// ================== STORY STRUCTURE VALIDATION ==================
interface BilingualText {
  [languageCode: string]: string;
}

interface DifficultWord {
  word: string;
  meaning: string;
  pronunciation?: string;
}

interface Chapter {
  chapterNumber: number;
  chapterTitle: BilingualText;
  storyText: BilingualText;
  imagePrompt: string;
  imageText: string;
  difficultWords: DifficultWord[];
}

interface StoryStructure {
  bookTitle: BilingualText;
  cover: {
    imagePrompt: string;
    imageText: string;
  };
  chapters: Chapter[];
  moralOfTheStory: {
    moral: BilingualText;
  };
}

function validateStoryStructure(story: any, requestId: string): StoryStructure {
  if (!story || typeof story !== "object") {
    throw new APIError("Invalid story format: not an object", 500, "INVALID_STORY_OBJECT", {
      storyType: typeof story,
    });
  }
  
  const requiredFields = ["bookTitle", "cover", "chapters", "moralOfTheStory"];
  const missingFields = requiredFields.filter((field) => !story[field]);
  if (missingFields.length > 0) {
    throw new APIError(
      `Story missing required fields: ${missingFields.join(", ")}`,
      500,
      "MISSING_STORY_FIELDS",
      { missingFields, requestId }
    );
  }
  
  if (!Array.isArray(story.chapters)) {
    throw new APIError(
      "Invalid chapters format: must be array",
      500,
      "INVALID_CHAPTERS_FORMAT",
      { chaptersType: typeof story.chapters, requestId }
    );
  }
  
  if (story.chapters.length !== CONFIG.VALIDATION.REQUIRED_CHAPTERS) {
    throw new APIError(
      `Invalid chapter count: expected ${CONFIG.VALIDATION.REQUIRED_CHAPTERS}, got ${story.chapters.length}`,
      500,
      "INVALID_CHAPTER_COUNT",
      {
        expected: CONFIG.VALIDATION.REQUIRED_CHAPTERS,
        actual: story.chapters.length,
        requestId,
      }
    );
  }
  
  if (!story.cover.imagePrompt || typeof story.cover.imagePrompt !== "string") {
    throw new APIError(
      "Cover missing or invalid image prompt",
      500,
      "MISSING_COVER_PROMPT",
      { requestId }
    );
  }
  
  story.chapters.forEach((chapter: any, index: number) => {
    const chapterNumber = index + 1;
    const requiredChapterFields = ["chapterTitle", "storyText", "imagePrompt"];
    const missingChapterFields = requiredChapterFields.filter((field) => !chapter[field]);
    if (missingChapterFields.length > 0) {
      throw new APIError(
        `Chapter ${chapterNumber} missing fields: ${missingChapterFields.join(", ")}`,
        500,
        "INVALID_CHAPTER_STRUCTURE",
        { chapterNumber, missingFields: missingChapterFields, requestId }
      );
    }
    
    if (typeof chapter.chapterTitle !== "object" || typeof chapter.storyText !== "object") {
      throw new APIError(
        `Chapter ${chapterNumber} must have bilingual content structure`,
        500,
        "INVALID_BILINGUAL_STRUCTURE",
        { chapterNumber, requestId }
      );
    }
    
    const titleKeys = Object.keys(chapter.chapterTitle);
    const textKeys = Object.keys(chapter.storyText);
    if (titleKeys.length < 2 || textKeys.length < 2) {
      throw new APIError(
        `Chapter ${chapterNumber} must have bilingual content`,
        500,
        "INSUFFICIENT_BILINGUAL_CONTENT",
        { chapterNumber, titleKeys: titleKeys.length, textKeys: textKeys.length, requestId }
      );
    }
  });
  
  return story as StoryStructure;
}

// ================== CORE STORY GENERATION LOGIC ==================
async function generateStoryCore(
  formData: any,
  userId: string,
  requestId: string
): Promise<{
  success: boolean;
  storyId?: string;
  creditsRemaining?: number;
  processingTime?: number;
  error?: string;
  code?: string;
  details?: any;
}> {
  const startTime = Date.now();
  let replicateClient: Replicate | null = null;

  try {
    // Environment validation
    const env = validateEnvironment();
    replicateClient = new Replicate({
      auth: env.REPLICATE_API_KEY,
      userAgent: "StoryGenerator/3.0",
    });

    console.log(`[${requestId}] User authenticated: ${userId.substring(0, 8)}...`);

    // Rate limiting
    const rateLimitResult = checkRateLimit(userId, "server-action");
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfter || 60;
      return {
        success: false,
        error: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
        code: "RATE_LIMITED",
        details: { retryAfter }
      };
    }

    // User validation (check credits but don't deduct yet)
    const user = await getUserWithValidation(userId, requestId);
    console.log(`[${requestId}] User validated with ${user.credits} credits`);

    // Generate story
    console.log(`[${requestId}] Starting Claude story generation`);
    const storyPrompt = generateStoryPrompt(formData);
    const rawStoryText = await generateStoryWithClaude(storyPrompt, replicateClient!, requestId);

    // Parse and validate story structure
    let story: StoryStructure;
    try {
      const cleanedText = rawStoryText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "")
        .trim();
      
      if (!cleanedText.startsWith("{") || !cleanedText.endsWith("}")) {
        throw new Error("Response doesn't contain valid JSON structure");
      }
      
      const parsedStory = JSON.parse(cleanedText);
      story = validateStoryStructure(parsedStory, requestId);
    } catch (parseError: any) {
      console.error(`[${requestId}] Story parsing/validation error:`, {
        error: parseError.message,
        rawTextPreview: rawStoryText.substring(0, 200),
      });
      throw new APIError(
        "Claude generated invalid story format. Please try again.",
        500,
        "STORY_PARSE_ERROR",
        {
          parseError: parseError.message,
          requestId,
          textLength: rawStoryText.length,
        }
      );
    }

    console.log(`[${requestId}] Story structure validated successfully`);

    // Generate and upload cover image
    console.log(`[${requestId}] Starting cover image generation`);
    const imagePrompt = `${story.cover.imagePrompt}. Professional ${formData.imageStyle} style, high quality, vibrant colors, no text overlay, suitable for ${formData.ageGroup}.`;
    const imageUrl = await generateImage(imagePrompt, replicateClient!, requestId);
    console.log(`[${requestId}] Cover image generated successfully`);

    const base64Image = await convertImageToBase64(imageUrl, requestId);
    const firebaseImageUrl = await uploadToFirebase(base64Image, requestId);
    console.log(`[${requestId}] Cover image uploaded to Firebase successfully`);

    // Prepare story data
    const storyId = uuidv4();
    const clerkUser = await currentUser();

    const storyData = {
      storyId,
      storySubject: formData.storySubject.trim(),
      storyType: formData.storyType.trim(),
      ageGroup: formData.ageGroup.trim(),
      imageStyle: formData.imageStyle.trim(),
      language1: formData.language1.trim(),
      language2: formData.language2.trim(),
      genre: formData.genre.trim(),
      output: story,
      coverImage: firebaseImageUrl,
      clerkUserId: userId,
      userEmail: user.userEmail || clerkUser?.primaryEmailAddress?.emailAddress || "",
      userName: user.userName || clerkUser?.fullName || "Anonymous",
      userImage: user.userImage || clerkUser?.imageUrl || "",
      createdAt: new Date(),
    };

    // Deduct credit and save story in one transaction
    const { storyId: savedStoryId, creditsRemaining } = await deductCreditAndSaveStory(
      userId,
      storyData,
      requestId
    );
    
    console.log(`[${requestId}] Story saved to database: ${savedStoryId}`);
    console.log(`[${requestId}] Credit deducted. Remaining: ${creditsRemaining}`);

    // Success response
    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] Story generation completed successfully`, {
      storyId: savedStoryId,
      processingTime,
      creditsRemaining,
    });

    return {
      success: true,
      storyId: savedStoryId,
      creditsRemaining,
      processingTime,
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Story generation failed`, {
      message: error.message,
      code: error.code,
      status: error.status,
      processingTime,
    });

    const code = error instanceof APIError ? error.code : "INTERNAL_ERROR";

    return {
      success: false,
      error: error.message || "Story generation failed unexpectedly",
      code,
      processingTime,
      details: error.details,
    };
  }
}

// ================== PUBLIC SERVER ACTIONS ==================

// Main story generation action
export async function generateStoryAction(
  prevState: StoryGenerationState,
  formData: FormData
): Promise<StoryGenerationState> {
  const startTime = Date.now();
  const requestId = uuidv4().slice(0, 8);
  
  console.log("Story generation action started");

  try {
    // Authentication
    const { userId } = await auth();
    if (!userId) {
      console.error("User not authenticated");
      return {
        success: false,
        message: "Please sign in to create stories.",
      };
    }

    // Form data extraction
    const rawFormData = {
      storySubject: formData.get("storySubject") as string,
      storyType: formData.get("storyType") as string,
      ageGroup: formData.get("ageGroup") as string,
      imageStyle: formData.get("imageStyle") as string,
      language1: formData.get("language1") as string,
      language2: formData.get("language2") as string,
      genre: formData.get("genre") as string,
    };

    console.log("Form data extracted:", {
      storySubject: rawFormData.storySubject?.substring(0, 50) + "...",
      storyType: rawFormData.storyType,
      ageGroup: rawFormData.ageGroup,
      imageStyle: rawFormData.imageStyle,
      language1: rawFormData.language1,
      language2: rawFormData.language2,
      genre: rawFormData.genre,
    });

    // Validation
    const validationResult = StoryGenerationSchema.safeParse(rawFormData);

    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((error) => {
        const field = error.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      });

      console.error("Validation failed:", fieldErrors);
      return {
        success: false,
        message: "Please fix the errors and try again.",
        errors: fieldErrors,
      };
    }

    const validatedData = validationResult.data;

    // Additional validation for different languages
    if (validatedData.language1 === validatedData.language2) {
      console.error("Same languages selected");
      return {
        success: false,
        message: "Please select different languages for learning.",
        errors: {
          language2: ["Target language must be different from known language"],
        },
      };
    }

    console.log("Validation passed");

    // Generate story using core logic
    const result = await generateStoryCore(validatedData, userId, requestId);

    if (!result.success) {
      // Handle specific error codes
      switch (result.code) {
        case "INSUFFICIENT_CREDITS":
        case "INSUFFICIENT_CREDITS_FOR_DEDUCT":
          return {
            success: false,
            message: "You don't have enough credits to create a story. Please purchase more credits.",
          };

        case "RATE_LIMITED":
          const retryAfter = result.details?.retryAfter || 60;
          return {
            success: false,
            message: `You're creating stories too quickly. Please wait ${retryAfter} seconds and try again.`,
          };

        case "TIMEOUT_ERROR":
        case "CLAUDE_GENERATION_FAILED":
        case "IMAGE_GENERATION_FAILED":
          return {
            success: false,
            message: "Story generation is taking longer than expected. Please try again in a few moments.",
          };

        case "CONFIGURATION_ERROR":
          return {
            success: false,
            message: "Service temporarily unavailable. Please try again later.",
          };

        default:
          return {
            success: false,
            message: result.error || "Failed to generate story. Please try again.",
          };
      }
    }

    // Success - update user statistics
    console.log("Updating language streaks and user stats...");

    try {
      const { updateLanguageStreak } = await import("./dashboard-actions");
      const streakResult = await updateLanguageStreak(
        userId,
        validatedData.language2
      );

      if (streakResult.success) {
        console.log("Language streak updated successfully");
      } else {
        console.warn("Language streak update failed:", streakResult.error);
      }
    } catch (streakError) {
      console.error("Error updating language streak:", streakError);
    }

    // Revalidate paths
    console.log("Revalidating paths...");
    try {
      revalidatePath("/dashboard");
      revalidatePath("/create-story");
      revalidatePath(`/view-story/${result.storyId}`);
      console.log("Paths revalidated");
    } catch (revalidateError) {
      console.warn("Path revalidation failed:", revalidateError);
    }

    // Success - redirect to story
    const totalTime = Date.now() - startTime;
    console.log(`Story generation completed successfully in ${totalTime}ms! Redirecting to story: ${result.storyId}`);

    redirect(`/view-story/${result.storyId}`);

  } catch (error: unknown) {
    const totalTime = Date.now() - startTime;
    console.error("Unexpected error in story generation:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      totalTime,
    });

    // Handle redirect errors (these are expected and should be re-thrown)
    if (error instanceof Error && 
        (error.message?.includes("NEXT_REDIRECT") || 
         error.message?.includes("redirect"))) {
      throw error;
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

// Function to check user's credit balance before story generation
export async function checkUserCredits(): Promise<{
  hasCredits: boolean;
  creditCount: number;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { hasCredits: false, creditCount: 0, error: "User not authenticated" };
    }

    const { getUserStats } = await import("./dashboard-actions");
    const stats = await getUserStats(userId);

    if (!stats) {
      return { hasCredits: false, creditCount: 0, error: "Unable to fetch user stats" };
    }

    console.log(`User credits check: ${stats.credits} credits available`);

    return {
      hasCredits: stats.credits > 0,
      creditCount: stats.credits,
    };
  } catch (error) {
    console.error("Error checking user credits:", error);
    return { 
      hasCredits: false, 
      creditCount: 0, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Function to get user's story creation history
export async function getUserStoryHistory(): Promise<{
  totalStories: number;
  thisMonthStories: number;
  languageBreakdown: Record<string, number>;
  error?: string;
} | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const { getDashboardData } = await import("./dashboard-actions");
    const dashboardData = await getDashboardData(userId);

    if (!dashboardData) return null;

    const languageBreakdown: Record<string, number> = {};
    dashboardData.storiesByLanguage.forEach((lang) => {
      if (lang.language2) {
        languageBreakdown[lang.language2] = lang.count;
      }
    });

    console.log("User story history:", {
      total: dashboardData.totalStoriesCreated,
      thisMonth: dashboardData.monthlyStoriesCreated,
      languages: languageBreakdown,
    });

    return {
      totalStories: dashboardData.totalStoriesCreated,
      thisMonthStories: dashboardData.monthlyStoriesCreated,
      languageBreakdown,
    };
  } catch (error) {
    console.error("Error getting user story history:", error);
    return {
      totalStories: 0,
      thisMonthStories: 0,
      languageBreakdown: {},
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Function to test story generation connectivity
export async function testStoryGeneration(): Promise<{
  isHealthy: boolean;
  message: string;
  components: {
    environment: boolean;
    database: boolean;
    replicate: boolean;
    firebase: boolean;
  };
}> {
  const components = {
    environment: false,
    database: false,
    replicate: false,
    firebase: false,
  };

  try {
    // Test environment
    try {
      validateEnvironment();
      components.environment = true;
    } catch (error) {
      console.error("Environment validation failed:", error);
    }

    // Test database connection
    try {
      const { userId } = await auth();
      if (userId) {
        await getUserWithValidation(userId, "health-check");
        components.database = true;
      }
    } catch (error) {
      console.error("Database connection failed:", error);
    }

    // Test Replicate
    try {
      const env = validateEnvironment();
      const replicate = new Replicate({ auth: env.REPLICATE_API_KEY });
      components.replicate = true;
    } catch (error) {
      console.error("Replicate initialization failed:", error);
    }

    // Test Firebase
    try {
      const testRef = ref(storage, "test-health-check");
      components.firebase = true;
    } catch (error) {
      console.error("Firebase connection failed:", error);
    }

    const isHealthy = Object.values(components).every(Boolean);

    return {
      isHealthy,
      message: isHealthy 
        ? "All story generation components are healthy" 
        : "Some story generation components are not working",
      components,
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      isHealthy: false,
      message: error instanceof Error ? error.message : "Health check failed",
      components,
    };
  }
}