// utils/convertImage.ts

/**
 * Convert image URL to base64 string
 * @param url - The image URL to convert
 * @returns Promise<string> - Base64 encoded image string
 */
export async function convertImage(url: string): Promise<string> {
  try {
    // Validate URL
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    // Fetch the image with appropriate headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StoryGenerator/1.0)",
        Accept: "image/*",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    // Check if the response is actually an image
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error(`Invalid content type: ${contentType}. Expected image.`);
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();

    // Validate that we got data
    if (arrayBuffer.byteLength === 0) {
      throw new Error("Received empty image data");
    }

    // Convert to base64
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Validate base64 output
    if (!base64 || base64.length === 0) {
      throw new Error("Failed to convert image to base64");
    }

    return base64;
  } catch (error: any) {
    console.error("Error in convertImage:", error);

    // Re-throw with a more descriptive error message
    if (error.name === "AbortError") {
      throw new Error(
        "Image conversion timed out. The image may be too large or the server is slow."
      );
    }

    if (error.message?.includes("fetch")) {
      throw new Error(
        "Failed to fetch image. Please check the URL and try again."
      );
    }

    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

/**
 * Validate image URL format
 * @param url - URL to validate
 * @returns boolean - Whether the URL appears to be a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Check for common image extensions
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];
    return (
      imageExtensions.some((ext) => pathname.endsWith(ext)) ||
      pathname.includes("image") ||
      urlObj.searchParams.has("format")
    );
  } catch {
    return false;
  }
}

/**
 * Get image metadata from URL
 * @param url - Image URL
 * @returns Promise<object> - Image metadata
 */
export async function getImageMetadata(url: string): Promise<{
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "unknown";
    const contentLength = response.headers.get("content-length");
    const size = contentLength ? parseInt(contentLength, 10) : 0;

    return {
      contentType,
      size,
    };
  } catch (error: any) {
    console.error("Error getting image metadata:", error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
}

/**
 * Compress base64 image if needed (optional utility)
 * @param base64 - Base64 image string
 * @param maxSizeKB - Maximum size in KB
 * @returns string - Potentially compressed base64 string
 */
export function compressBase64IfNeeded(
  base64: string,
  maxSizeKB: number = 500
): string {
  const sizeKB = (base64.length * 3) / 4 / 1024; // Approximate KB size

  if (sizeKB <= maxSizeKB) {
    return base64;
  }

  console.warn(
    `Image size (${sizeKB.toFixed(
      2
    )}KB) exceeds maximum (${maxSizeKB}KB). Consider implementing compression.`
  );

  // For now, just return as-is. In production, you might want to implement
  // actual image compression using a library like sharp or canvas
  return base64;
}
