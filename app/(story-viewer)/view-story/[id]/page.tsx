// app/(story-viewer)/view-story/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles } from "lucide-react";

import { getStoryById, validateStoryAccess } from "@/lib/actions/story-actions";
import { extractBookTitle } from "@/lib/utils/story-utils";
import StoryViewer from "../../_components/StoryViewer";
import StoryLoadingSkeleton from "../../_components/StoryLoadingSkeleton";
import StoryStats from "../../_components/story-stats";

interface ViewStoryPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Language mapping for Speech Synthesis API
const SPEECH_SYNTHESIS_LANGUAGE_MAP: Record<string, string> = {
  English: "en-US",
  Spanish: "es-ES",
  French: "fr-FR",
  Mandarin: "zh-CN",
  German: "de-DE",
  Arabic: "ar-SA",
  Russian: "ru-RU",
  Portuguese: "pt-BR",
  Italian: "it-IT",
  Japanese: "ja-JP",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
  Gujarati: "gu-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Punjabi: "pa-IN",
  Odia: "or-IN",
};

// Languages with limited TTS support
const LIMITED_TTS_LANGUAGES = [
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
];

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ViewStoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const story = await getStoryById(resolvedParams.id);

  if (!story) {
    return {
      title: "Story Not Found",
      description: "The requested story could not be found.",
    };
  }

  const bookTitle = extractBookTitle(story.output.bookTitle, story.language1);

  return {
    title: `${bookTitle} | Story Reader`,
    description: `Read and interact with ${bookTitle} - A ${story.genre} story for ${story.ageGroup}`,
    keywords: [
      story.genre,
      story.storyType,
      story.ageGroup,
      "AI story",
      "interactive book",
      "bilingual story",
      story.language1,
      story.language2,
    ],
  };
}

export default async function ViewStoryPage({
  params,
  searchParams,
}: ViewStoryPageProps) {
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

  const chaptersCount = story.output.chapters?.length || 0;

  // Check TTS support for both languages
  const hasLimitedTTS =
    LIMITED_TTS_LANGUAGES.includes(story.language1) ||
    LIMITED_TTS_LANGUAGES.includes(story.language2);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5"/>
          <h1 className="text-2xl font-bold">Read Your Story</h1>
        </div>
        <p className="text-muted-foreground">
          Experience your bilingual story with immersive reading features, audio
          narration, and vocabulary support.
        </p>
      </div>

      {/* Story Statistics */}
      <StoryStats
        chaptersCount={chaptersCount}
        currentProgress={0} // TODO: Calculate real progress from user data
        language1={story.language1}
        language2={story.language2}
        genre={story.genre}
        ageGroup={story.ageGroup}
      />

      {/* Main Story Reader */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Interactive Story Reader
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<StoryLoadingSkeleton />}>
            <StoryViewer
              story={story}
              preferredLanguage={preferredLanguage}
              ttsLanguageMap={SPEECH_SYNTHESIS_LANGUAGE_MAP}
              hasLimitedTTS={hasLimitedTTS}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
