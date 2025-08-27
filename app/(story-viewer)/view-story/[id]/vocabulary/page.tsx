// app/(story-viewer)/view-story/[id]/vocabulary/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookMarked, Sparkles, Target, TrendingUp } from "lucide-react";

import { getStoryById, validateStoryAccess } from "@/lib/actions/story-actions";
import DifficultWordsSection from "../../../_components/DifficultWords";

interface VocabularyPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: VocabularyPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const story = await getStoryById(resolvedParams.id);

  if (!story) {
    return {
      title: "Vocabulary Not Found",
      description: "The requested story vocabulary could not be found.",
    };
  }

  const bookTitle =
    typeof story.output.bookTitle === "string"
      ? story.output.bookTitle
      : story.output.bookTitle.language1 ||
        Object.values(story.output.bookTitle)[0];

  return {
    title: `${bookTitle} - Vocabulary Builder | Dashboard`,
    description: `Master new words from ${bookTitle}. Interactive vocabulary learning with pronunciation and definitions in ${story.language1} and ${story.language2}.`,
  };
}

export default async function VocabularyPage({
  params,
  searchParams,
}: VocabularyPageProps) {
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

  // Calculate vocabulary stats
  const totalWords =
    story.output.chapters?.reduce((acc, chapter) => {
      return acc + (chapter.difficultWords?.length || 0);
    }, 0) || 0;

  const chaptersWithWords =
    story.output.chapters?.filter(
      (chapter) =>
        chapter.difficultWords && chapter.difficultWords.length > 0
    ).length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookMarked className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Vocabulary Builder</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Learning
          </Badge>
        </div>

        <p className="text-muted-foreground">
          Master new words from your story with interactive pronunciation,
          definitions, and progress tracking.
        </p>
      </div>

      {/* Vocabulary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold">{totalWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chapters</p>
                <p className="text-2xl font-bold">{chaptersWithWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg/Chapter</p>
                <p className="text-2xl font-bold">
                  {chaptersWithWords > 0
                    ? Math.round(totalWords / chaptersWithWords)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <p className="text-lg font-semibold">
                {totalWords <= 10
                  ? "Beginner"
                  : totalWords <= 25
                  ? "Intermediate"
                  : "Advanced"}
              </p>
              <Badge
                variant="secondary"
                className={`text-xs mt-1 ${
                  totalWords <= 10
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                    : totalWords <= 25
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                Level {totalWords <= 10 ? "1" : totalWords <= 25 ? "2" : "3"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Vocabulary Section */}
      <div className="max-w-6xl">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-8">
                <div className="h-60 bg-muted/50 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          }
        >
          <DifficultWordsSection
            chapters={story.output.chapters}
            language1={story.language1}
            language2={story.language2}
          />
        </Suspense>
      </div>

      {/* Learning Strategy Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Target className="h-5 w-5" />
            Vocabulary Learning Strategies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🎯 Active Learning
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use the audio feature to practice pronunciation</li>
                  <li>• Create your own sentences with new words</li>
                  <li>• Mark favorite words for regular review</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🔄 Spaced Repetition
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Review words after 1 day, then 3 days, then weekly</li>
                  <li>• Focus more time on challenging words</li>
                  <li>• Use the export feature to create flashcards</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  📝 Context Learning
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Read the full chapter to understand word usage</li>
                  <li>• Note how words relate to the story's theme</li>
                  <li>• Look for word patterns and connections</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🗣️ Practice Speaking
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use new words in conversations</li>
                  <li>• Record yourself using the vocabulary</li>
                  <li>• Practice with language exchange partners</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
