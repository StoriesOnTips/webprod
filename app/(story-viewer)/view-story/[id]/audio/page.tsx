// app/(story-viewer)/view-story/[id]/audio/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Headphones,
  Sparkles,
  Volume2,
  Settings,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { getStoryById, validateStoryAccess } from "@/lib/actions/story-actions";
import { SPEECH_SYNTHESIS_LANGUAGE_MAP, LIMITED_TTS_LANGUAGES } from "@/lib/constants/languages";

interface AudioPageProps {
  params: Promise<{ id: string }>;
}



export async function generateMetadata({
  params,
}: AudioPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const story = await getStoryById(resolvedParams.id);

  if (!story) {
    return {
      title: "Audio Controls Not Found",
      description: "The requested audio controls could not be found.",
    };
  }

  const bookTitle =
    typeof story.output.bookTitle === "string"
      ? story.output.bookTitle
      : story.output.bookTitle.language1 ||
        Object.values(story.output.bookTitle)[0];

  return {
    title: `${bookTitle} - Audio Controls | Dashboard`,
    description: `Customize audio settings and text-to-speech preferences for ${bookTitle}. Voice settings for ${story.language1} and ${story.language2}.`,
  };
}

export default async function AudioPage({ params }: AudioPageProps) {
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

  // Check TTS support for both languages
  const lang1HasTTS = SPEECH_SYNTHESIS_LANGUAGE_MAP[story.language1];
  const lang2HasTTS = SPEECH_SYNTHESIS_LANGUAGE_MAP[story.language2];
  const hasLimitedTTS =
    LIMITED_TTS_LANGUAGES.includes(story.language1) ||
    LIMITED_TTS_LANGUAGES.includes(story.language2);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Headphones className="size-6 text-green-500" />
          <h1 className="text-2xl font-bold">Audio Controls</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Speech Synthesis
          </Badge>
        </div>

        <p className="text-muted-foreground">
          Customize your text-to-speech experience with voice settings, language
          support, and audio preferences.
        </p>
      </div>

      {/* TTS Support Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              {story.language1} Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              {lang1HasTTS ? (
                <CheckCircle className="size-5 text-green-500" />
              ) : (
                <AlertTriangle className="size-5 text-amber-500" />
              )}
              <span className="font-medium">
                {lang1HasTTS ? "Fully Supported" : "Limited Support"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Language Code:</strong> {lang1HasTTS ?? "Not mapped"}
              </p>
              <p>
                <strong>Quality:</strong> {lang1HasTTS ? "High" : "Variable"}
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {lang1HasTTS ? "All browsers" : "Browser dependent"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🌏</span>
              {story.language2} Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              {lang2HasTTS ? (
                <CheckCircle className="size-5 text-green-500" />
              ) : (
                <AlertTriangle className="size-5 text-amber-500" />
              )}
              <span className="font-medium">
                {lang2HasTTS ? "Fully Supported" : "Limited Support"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Language Code:</strong> {lang2HasTTS ?? "Not mapped"}
              </p>
              <p>
                <strong>Quality:</strong> {lang2HasTTS ? "High" : "Variable"}
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {lang2HasTTS ? "All browsers" : "Browser dependent"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning for Limited Support */}
      {hasLimitedTTS && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTriangle className="size-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Limited TTS Support:</strong> Some audio features may not
            work properly for {!lang1HasTTS && story.language1}
            {!lang1HasTTS && !lang2HasTTS && " and "}
            {!lang2HasTTS && story.language2}. Audio quality and availability
            depend on your browser's built-in speech synthesis engine.
          </AlertDescription>
        </Alert>
      )}

      {/* Audio Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="size-5" />
            Available Audio Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-500" />
                <span className="font-medium">Story Narration</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Listen to complete chapters in both languages with natural voice
                synthesis.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-500" />
                <span className="font-medium">Vocabulary Pronunciation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Hear correct pronunciation of difficult words to improve your
                speaking skills.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Moral Narration</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Listen to the story's moral lesson read aloud in your preferred
                language.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-blue-500" />
                <span className="font-medium">Voice Controls</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Adjust speed, pitch, and volume to match your listening
                preferences.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-blue-500" />
                <span className="font-medium">Language Switching</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Seamlessly switch between languages to compare pronunciation and
                meaning.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-blue-500" />
                <span className="font-medium">Keyboard Shortcuts</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Use spacebar to play/pause and escape to stop for efficient
                navigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Browser Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Compatibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Text-to-speech features work best with modern browsers. Here's
              what you can expect:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                  ✅ Excellent Support
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Chrome 71+ (all platforms)</li>
                  <li>• Edge 79+ (Windows, macOS)</li>
                  <li>• Safari 14+ (macOS, iOS)</li>
                  <li>• Firefox 92+ (Windows, macOS)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-amber-600 dark:text-amber-400">
                  ⚠️ Limited Support
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Older browser versions</li>
                  <li>• Some mobile browsers</li>
                  <li>• Privacy-focused browsers</li>
                  <li>• Browsers with disabled JavaScript</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips for Better Audio Experience */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Headphones className="size-5" />
            Tips for Better Audio Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🔧 Optimize Settings</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Start with speed at 0.8-1.0x for learning</li>
                <li>• Increase volume if background noise is present</li>
                <li>• Adjust pitch if the voice sounds unnatural</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🎧 Environment Setup</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use headphones for better audio clarity</li>
                <li>• Find a quiet space for focused listening</li>
                <li>• Ensure stable internet connection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
