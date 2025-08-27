// lib/actions/story-actions.ts
"use server";

import { db } from "@/config/db";
import { StoryData } from "@/config/schema";
import { eq, desc } from "drizzle-orm";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

export interface StoryChapter {
  chapterNumber: number;
  chapterTitle: string;
  storyText: string | { [language: string]: string };
  imagePrompt?: string;
  imageText?: string;
  difficultWords?: {
    word: string;
    meaning: string;
    pronunciation?: string;
    language?: string; // TODO: Make required in future versions to avoid fallback logic
  }[];
  vocabulary?: {
    word: string;
    translation: string;
    pronunciation?: string;
  }[];
  culturalNotes?: string;
}

export interface StoryOutput {
  bookTitle: {
    language1:string;
    language2:string;
  };
  cover: {
    imagePrompt: string;
    imageText: string;
  };
  chapters: StoryChapter[];
  moralOfTheStory?: {
    moral: string | { [language: string]: string };
  };
  languageLearningNotes?: {
    grammarFocus: string;
    difficulty: string;
    practiceActivities: string[];
  };
}

export interface StoryWithMetadata {
  storyId: string;
  storySubject: string;
  storyType: string;
  ageGroup: string;
  imageStyle: string;
  language1: string;
  language2: string;
  genre: string;
  coverImage: string;
  output: StoryOutput;
  userEmail: string;
  userName: string;
  userImage: string;
  createdAt: Date;
}

// Authentication check function
async function validateAuth() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error(
      "Authentication required. Please log in to access this content."
    );
  }

  const userEmail =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress;

  if (!userEmail) {
    throw new Error("User email not found. Please update your profile.");
  }

  return {
    userId,
    userEmail,
    userName: user.fullName || "Anonymous User",
  };
}

// Cache the story fetching function with auth validation
export const getStoryById = cache(
  async (storyId: string): Promise<StoryWithMetadata | null> => {
    try {
      // AUTH CHECK - Validate user authentication first
      await validateAuth();

      if (!storyId || storyId.trim() === "") {
        return null;
      }

      const result = await db
        .select()
        .from(StoryData)
        .where(eq(StoryData.storyId, storyId))
        .limit(1);

      if (!result || result.length === 0) {
        return null;
      }

      const storyData = result[0];

      // Validate that we have the required data
      if (!storyData.output || !storyData.coverImage) {
        console.error(`Story ${storyId} is missing required data`);
        return null;
      }

      return {
        storyId: storyData.storyId,
        storySubject: storyData.storySubject,
        storyType: storyData.storyType,
        ageGroup: storyData.ageGroup,
        imageStyle: storyData.imageStyle ?? "",
        language1: storyData.language1,
        language2: storyData.language2,
        genre: storyData.genre,
        coverImage: storyData.coverImage,
        output: storyData.output as StoryOutput,
        userEmail: storyData.userEmail,
        userName: storyData.userName,
        userImage: storyData.userImage || "",
        createdAt: storyData.createdAt || new Date(),
      };
    } catch (error) {
      console.error("Error fetching story:", error);
      throw error;
    }
  }
);

// Get story metadata without the full content (for performance) with auth check
export const getStoryMetadata = cache(async (storyId: string) => {
  try {
    // AUTH CHECK
    await validateAuth();

    const result = await db
      .select({
        storyId: StoryData.storyId,
        storySubject: StoryData.storySubject,
        storyType: StoryData.storyType,
        ageGroup: StoryData.ageGroup,
        genre: StoryData.genre,
        language1: StoryData.language1,
        language2: StoryData.language2,
        userName: StoryData.userName,
        userEmail: StoryData.userEmail,
        createdAt: StoryData.createdAt,
      })
      .from(StoryData)
      .where(eq(StoryData.storyId, storyId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching story metadata:", error);
    throw error;
  }
});

// Validate story access with auth check
export async function validateStoryAccess(storyId: string): Promise<boolean> {
  try {
    // AUTH CHECK
    await validateAuth();

    const story = await getStoryMetadata(storyId);
    if (!story) return false;

    // For now, all authenticated users can view any story
    return true;
  } catch (error) {
    console.error("Error validating story access:", error);
    return false;
  }
}

// Check if user owns a story with auth check
export async function checkStoryOwnership(storyId: string): Promise<boolean> {
  try {
    // AUTH CHECK
    const authUser = await validateAuth();

    const story = await getStoryMetadata(storyId);
    if (!story) {
      return false;
    }

    return story.userEmail === authUser.userEmail;
  } catch (error) {
    console.error("Error checking story ownership:", error);
    return false;
  }
}

// Get user's own stories with auth check
export async function getUserStories(limit: number = 10) {
  try {
    // AUTH CHECK
    const authUser = await validateAuth();

    const result = await db
      .select({
        storyId: StoryData.storyId,
        storySubject: StoryData.storySubject,
        storyType: StoryData.storyType,
        ageGroup: StoryData.ageGroup,
        genre: StoryData.genre,
        coverImage: StoryData.coverImage,
        language1: StoryData.language1,
        language2: StoryData.language2,
        output: StoryData.output,
        createdAt: StoryData.createdAt,
      })
      .from(StoryData)
      .where(eq(StoryData.userEmail, authUser.userEmail))
      .orderBy(desc(StoryData.createdAt))
      .limit(limit);

    // Transform the output to match StoryOutput interface
    return result.map(story => {
      const rawOutput = story.output as any;
      
      // Transform bookTitle to match StoryOutput interface
      let transformedBookTitle = { language1: "", language2: "" };
      
      if (rawOutput?.bookTitle) {
        if (typeof rawOutput.bookTitle === "string") {
          // If it's a string, use it for both languages
          transformedBookTitle = {
            language1: rawOutput.bookTitle,
            language2: rawOutput.bookTitle
          };
        } else if (typeof rawOutput.bookTitle === "object") {
          // If it's an object with language keys
          transformedBookTitle = {
            language1: rawOutput.bookTitle[story.language1] || rawOutput.bookTitle[story.language2] || Object.values(rawOutput.bookTitle)[0] || "",
            language2: rawOutput.bookTitle[story.language2] || rawOutput.bookTitle[story.language1] || Object.values(rawOutput.bookTitle)[0] || ""
          };
        }
      }

      return {
        ...story,
        output: {
          ...rawOutput,
          bookTitle: transformedBookTitle
        } as StoryOutput,
      };
    });
  } catch (error) {
    console.error("Error fetching user stories:", error);
    throw error;
  }
}
