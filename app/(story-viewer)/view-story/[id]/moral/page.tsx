// app/(story-viewer)/view-story/[id]/moral/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Sparkles, BookOpen } from "lucide-react";

import { getStoryById, validateStoryAccess } from "@/lib/actions/story-actions";
import MoralSection from "../../../_components/Moral";

interface MoralPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: MoralPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const story = await getStoryById(resolvedParams.id);

  if (!story) {
    return {
      title: "Story Moral Not Found",
      description: "The requested story moral could not be found.",
    };
  }

  const bookTitle =
    typeof story?.output?.bookTitle === "string"
      ? story.output.bookTitle
      : story?.output?.bookTitle?.language1 ||
        (story?.output?.bookTitle && typeof story.output.bookTitle === "object" 
          ? Object.values(story.output.bookTitle)[0] 
          : "");

  return {
    title: `${bookTitle} - Story Moral | Dashboard`,
    description: `Discover the wisdom and life lessons from ${bookTitle}. Learn valuable morals in ${story.language1} and ${story.language2}.`,
  };
}

export default async function MoralPage({
  params,
  searchParams,
}: MoralPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const storyId = resolvedParams.id;
  const preferredLanguage = resolvedSearchParams?.lang as string;

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold">Story Moral</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Wisdom
          </Badge>
        </div>

        <p className="text-muted-foreground">
          Discover the valuable life lessons and wisdom embedded in this story.
          Available in both languages with audio support.
        </p>
      </div>

      {/* Main Moral Section */}
      <div className="max-w-4xl mx-auto">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-8">
                <div className="h-40 bg-muted/50 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          }
        >
          <MoralSection
            moral={story.output.moralOfTheStory?.moral}
            preferredLanguage={preferredLanguage}
            language1={story.language1}
            language2={story.language2}
          />
        </Suspense>
      </div>

      {/* Learning Tips */}
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <BookOpen className="h-5 w-5" />
            How to Apply This Moral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🤔 Reflect</h4>
              <p className="text-sm text-muted-foreground">
                Think about times in your life when this lesson could have been
                helpful. How might you apply it in the future?
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">📝 Practice</h4>
              <p className="text-sm text-muted-foreground">
                Look for opportunities in your daily life to practice this
                wisdom. Small actions can lead to big changes.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">🗣️ Share</h4>
              <p className="text-sm text-muted-foreground">
                Discuss this moral with friends or family. Different
                perspectives can deepen your understanding.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">📚 Remember</h4>
              <p className="text-sm text-muted-foreground">
                Keep this lesson in mind as you read more stories. Look for
                connections and patterns in different tales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
