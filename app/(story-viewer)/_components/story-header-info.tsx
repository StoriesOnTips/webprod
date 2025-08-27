"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Languages } from "lucide-react";
import { getStoryById, StoryWithMetadata } from "@/lib/actions/story-actions";

export default function StoryHeaderInfo() {
  const params = useParams();
  const storyId = params?.id as string;
  const [story, setStory] = useState<StoryWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoryData() {
      if (!storyId) return;

      try {
        const storyData = await getStoryById(storyId);
        setStory(storyData);
      } catch (error) {
        console.error("Error loading story for header:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStoryData();
  }, [storyId]);

  if (loading || !story) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <BookOpen className="size-4 text-muted-foreground" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    );
  }

  const getBookTitle = () => {
    if (typeof story.output?.bookTitle === "string") {
      return story.output.bookTitle;
    }
    return (
      story.output?.bookTitle?.[story.language1] ||
      Object.values(story.output?.bookTitle || {})[0] ||
      "Story"
    );
  };

  // TODO: Implement real user progress tracking
  // const progress = calculateUserProgress(story.storyId);

  return (
    <div className="hidden md:flex items-center gap-4 max-w-md">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate max-w-[200px]">
            {getBookTitle()}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Languages className="size-3" />
            <span>
              {story.language1} → {story.language2}
            </span>
            <Badge variant="secondary" className="text-xs">
              {story.genre}
            </Badge>
          </div>
        </div>
      </div>

      {/* TODO: Show progress when implemented */}
      {/* <div className="flex items-center gap-2">
        <Progress value={progress} className="w-20 h-1.5" />
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div> */}
    </div>
  );
}
