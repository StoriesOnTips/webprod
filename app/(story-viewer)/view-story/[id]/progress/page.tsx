// app/(story-viewer)/view-story/[id]/progress/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";

import { getStoryById, validateStoryAccess } from "@/lib/actions/story-actions";

interface Chapter {
  chapterTitle: string | Record<string, string>;
  storyText: string | Record<string, string>;
  difficultWords?: string[];
}

interface ProgressPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProgressPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const story = await getStoryById(resolvedParams.id);

  if (!story) {
    return {
      title: "Progress Not Found",
      description: "The requested progress tracking could not be found.",
    };
  }

  const bookTitle =
    typeof story.output.bookTitle === "string"
      ? story.output.bookTitle
      : story.output.bookTitle.language1 ||
        Object.values(story.output.bookTitle)[0];

  return {
    title: `${bookTitle} - Progress Tracking | Dashboard`,
    description: `Track your reading progress for ${bookTitle}. Monitor chapters completed, vocabulary learned, and learning goals.`,
  };
}

export default async function ProgressPage({ params }: ProgressPageProps) {
  const resolvedParams = await params;
  const storyId = resolvedParams.id;

  // Validate story access
  const hasAccess = await validateStoryAccess(storyId);
  if (!hasAccess) {
    notFound();
  }

  // Fetch story data
  const story = await getStoryById(storyId);
  if (!story) {
    notFound();
  }

  const chaptersCount = story.output.chapters?.length || 0;

  // Calculate vocabulary stats
  const totalWords =
    story.output.chapters?.reduce((acc, chapter) => {
      return acc + (chapter.difficultWords?.length || 0);
    }, 0) || 0;

  // Mock progress data (in real app, this would come from user data)
  const currentProgress = 60;
  const completedChapters = Math.floor(chaptersCount * (currentProgress / 100));
  const wordsLearned = Math.floor(totalWords * 0.4);
  const readingTime = 15; // minutes

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Reading Progress</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Analytics
          </Badge>
        </div>

        <p className="text-muted-foreground">
          Track your learning journey with detailed progress analytics and
          achievement milestones.
        </p>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300">
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Story Completion</span>
              <span className="text-2xl font-bold text-blue-600">
                {currentProgress}%
              </span>
            </div>
            <Progress value={currentProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {completedChapters} of {chaptersCount} chapters completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {currentProgress}%
            </div>
            <p className="text-sm text-muted-foreground">Story Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {readingTime}
            </div>
            <p className="text-sm text-muted-foreground">Minutes Reading</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {wordsLearned}
            </div>
            <p className="text-sm text-muted-foreground">Words Learned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {completedChapters}
            </div>
            <p className="text-sm text-muted-foreground">Chapters Done</p>
          </CardContent>
        </Card>
      </div>

      {/* Chapter Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Chapter Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {story.output.chapters?.map((chapter: any, index: number) => {
              const isCompleted = index < completedChapters;
              const isCurrent = index === completedChapters;
              const chapterProgress = isCompleted ? 100 : isCurrent ? 60 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : isCurrent ? (
                        <div className="h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
                      ) : (
                        <div className="h-4 w-4 border-2 border-muted-foreground rounded-full" />
                      )}
                      <span className="font-medium">
                        Chapter {index + 1}:{" "}
                        {typeof chapter.chapterTitle === "string"
                          ? chapter.chapterTitle
                          : chapter.chapterTitle[story.language1] ||
                            `Chapter ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {chapterProgress}%
                      </span>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs">
                          Done
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Reading
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={chapterProgress} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Learning Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Reading Goals</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-sm">Start reading the story</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-sm">Complete first 3 chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
                  <span className="text-sm">Reach 75% completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-muted-foreground rounded-full" />
                  <span className="text-sm">Finish the entire story</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Learning Goals</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-sm">Listen to audio narration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
                  <span className="text-sm">Master 50% of vocabulary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-muted-foreground rounded-full" />
                  <span className="text-sm">Understand the moral lesson</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-muted-foreground rounded-full" />
                  <span className="text-sm">Practice pronunciation</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Reading Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {chaptersCount > 0 ? Math.round((readingTime / chaptersCount) * 10) / 10 : "—"}
              </div>
              <p className="text-sm text-muted-foreground">
                Avg. Minutes per Chapter
              </p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {readingTime > 0 ? Math.round((wordsLearned / readingTime) * 10) / 10 : "—"}
              </div>
              <p className="text-sm text-muted-foreground">Words per Minute</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {readingTime > 0 ? Math.round((currentProgress / readingTime) * 10) / 10 : "—"}%
              </div>
              <p className="text-sm text-muted-foreground">
                Progress per Minute
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
