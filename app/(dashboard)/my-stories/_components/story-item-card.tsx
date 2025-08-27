"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoryOutput } from "@/lib/actions/story-actions";

// Type for the story data (matching your getUserStories return type)
interface StoryCardData {
  storyId: string;
  storySubject: string;
  storyType: string;
  ageGroup: string;
  genre: string;
  coverImage: string | null;
  createdAt: Date;
  output: StoryOutput;
}

interface StoryItemCardProps {
  story: StoryCardData;
}

// Format date helper with improved edge case handling
function formatDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handle future dates
  if (diffInDays < 0) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function StoryItemCard({ story }: StoryItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fallback image URL
  const fallbackImage = "/images/story-placeholder.jpg";

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-md hover:shadow-lg transition-all duration-200 border">
      {/* Cover Image */}
      <div className="relative h-[220px] w-full overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        <Image
          src={imageError ? fallbackImage : story.coverImage || fallbackImage}
          alt={`Cover for ${story.storySubject}`}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoading ? "opacity-0" : "opacity-100"
          }`}
          fill
          onError={() => setImageError(true)}
          onLoad={() => setImageLoading(false)}
          sizes="(max-width: 768px) 100vw, 400px"
          priority={false}
        />
      </div>

      {/* Content */}
      <CardHeader className="px-4 pt-4 pb-2">
        <h3 className="mb-1 text-base font-semibold text-foreground line-clamp-2">
          {story.output?.bookTitle?.language1 || "Untitled Story"}
        </h3>
        {story.output?.bookTitle?.language2 && (
          <h4 className="text-sm font-medium text-muted-foreground line-clamp-2">
            {story.output.bookTitle.language2}
          </h4>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-3">
        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="rounded-full text-xs font-medium">
            {story.ageGroup}
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs font-medium">
            {story.storyType}
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs font-medium">
            {story.genre}
          </Badge>
        </div>

        {/* Creation date */}
        <p className="text-xs text-muted-foreground font-medium">
          Created {formatDate(new Date(story.createdAt))}
        </p>
      </CardContent>

      {/* Footer */}
      <CardFooter className="mt-auto px-4 pb-4">
        <Button asChild className="w-full rounded-xl">
          <Link
            href={`/view-story/${story.storyId}`}
            aria-label={`View story ${story.output?.bookTitle?.language1 || "story"}`}
          >
            View Story
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}