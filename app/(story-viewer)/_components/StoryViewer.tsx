"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Heart,
  Languages,
  Volume2,
  Play,
  Pause,
  Loader2,
  VolumeX,
  Settings,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import type { StoryWithMetadata } from "@/lib/actions/story-actions";

interface StoryViewerProps {
  story: StoryWithMetadata;
  preferredLanguage?: string;
  ttsLanguageMap: Record<string, string>;
  hasLimitedTTS: boolean;
}

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentPage: number | null;
  currentLanguage: string | null;
  currentUtterance: SpeechSynthesisUtterance | null;
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
}

interface Chapter {
  chapterNumber: number;
  chapterTitle: { [key: string]: string } | string;
  storyText: { [key: string]: string } | string;
  difficultWords?: Array<{
    word: string;
    meaning: string;
    pronunciation?: string;
    language?: string; // TODO: Make required in future versions to avoid fallback logic
  }>;
}

export default function StoryViewer({
  story,
  preferredLanguage,
  ttsLanguageMap,
  hasLimitedTTS,
}: StoryViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    currentPage: null,
    currentLanguage: null,
    currentUtterance: null,
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
  });
  const [speechSupported, setSpeechSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [showSettings, setShowSettings] = useState(false);
  const [imageError, setImageError] = useState(false);

  const chapters = story.output.chapters || [];
  const totalPages = chapters.length + 2; // Cover + chapters + final page
  const progress = ((currentPage + 1) / totalPages) * 100;

  const language1 = story.language1;
  const language2 = story.language2;

  // Check TTS support for individual languages
  const lang1HasTTS = ttsLanguageMap[language1];
  const lang2HasTTS = ttsLanguageMap[language2];

  // Check speech synthesis support and load voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSupported =
        "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
      setSpeechSupported(isSupported);

      if (!isSupported) {
        toast.error("Speech synthesis is not supported in this browser");
        return;
      }

      // Load available voices
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      speechSynthesis.addEventListener("voiceschanged", loadVoices);

      return () => {
        speechSynthesis.removeEventListener("voiceschanged", loadVoices);
        speechSynthesis.cancel();
      };
    }
  }, []);

  // Get text in preferred language
  const getText = useCallback(
    (
      text: string | { [language: string]: string },
      fallbackLang?: string
    ): string => {
      if (typeof text === "string") return text;
      return (
        text[preferredLanguage || ""] ||
        text[fallbackLang || language1] ||
        text[language1] ||
        text[language2] ||
        Object.values(text)[0] ||
        ""
      );
    },
    [preferredLanguage, language1, language2]
  );

  // Get best voice for language
  const getBestVoice = useCallback(
    (language: string): SpeechSynthesisVoice | null => {
      const langCode = ttsLanguageMap[language] || language;
      const langPrefix = langCode.split("-")[0];

      // Find exact match first
      let voice = availableVoices.find((v) => v.lang === langCode);

      // Then try language prefix match
      if (!voice) {
        voice = availableVoices.find((v) => v.lang.startsWith(langPrefix));
      }

      // Fallback to default voice
      if (!voice) {
        voice = availableVoices.find((v) => v.default) || availableVoices[0];
      }

      return voice || null;
    },
    [availableVoices, ttsLanguageMap]
  );

  // Check if language has TTS support
  const hasLanguageSupport = useCallback(
    (language: string): boolean => {
      const langCode = ttsLanguageMap[language] || language;
      if (!langCode) return false;

      return availableVoices.some(
        (voice) =>
          voice.lang === langCode ||
          voice.lang.startsWith(langCode.split("-")[0])
      );
    },
    [availableVoices, ttsLanguageMap]
  );

  // Speech synthesis function with fallback handling
  const toggleAudio = useCallback(
    async (text: string, pageIndex: number, language?: string) => {
      if (!speechSupported) {
        toast.error("Speech synthesis is not supported in this browser");
        return;
      }

      const targetLanguage = language || preferredLanguage || language1;

      // Check if language has support
      if (!hasLanguageSupport(targetLanguage)) {
        toast.error(
          `Text-to-speech is not available for ${targetLanguage}. Your browser may not support this language.`
        );
        return;
      }

      try {
        // Stop current speech if playing
        if (audioState.isPlaying) {
          speechSynthesis.cancel();
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            currentPage: null,
            currentLanguage: null,
            currentUtterance: null,
          }));

          // If clicking the same content, just stop
          if (
            audioState.currentPage === pageIndex &&
            audioState.currentLanguage === targetLanguage &&
            audioState.currentUtterance?.text === text.trim()
          ) {
            return;
          }
        }

        setAudioState((prev) => ({
          ...prev,
          isLoading: true,
          currentPage: pageIndex,
          currentLanguage: targetLanguage,
        }));

        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(text.trim());

        // Configure utterance
        const voice = getBestVoice(targetLanguage);
        if (voice) {
          utterance.voice = voice;
        }

        utterance.rate = voiceSettings.rate;
        utterance.pitch = voiceSettings.pitch;
        utterance.volume = voiceSettings.volume;

        // Set up event listeners
        utterance.onstart = () => {
          setAudioState((prev) => ({
            ...prev,
            isPlaying: true,
            isLoading: false,
            currentUtterance: utterance,
          }));
        };

        utterance.onend = () => {
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            currentPage: null,
            currentLanguage: null,
            currentUtterance: null,
          }));
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event);
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            currentPage: null,
            currentLanguage: null,
            currentUtterance: null,
          }));
          toast.error(
            `Speech synthesis failed for ${targetLanguage}. This language may not be fully supported.`
          );
        };

        // Speak the text
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Audio error:", error);
        setAudioState({
          isPlaying: false,
          isLoading: false,
          currentPage: null,
          currentLanguage: null,
          currentUtterance: null,
        });
        toast.error(`Failed to play audio in ${targetLanguage}`);
      }
    },
    [
      speechSupported,
      audioState,
      preferredLanguage,
      language1,
      getBestVoice,
      voiceSettings,
      hasLanguageSupport,
    ]
  );

  // Stop speech
  const stopSpeech = useCallback(() => {
    try {
      // Check if speech synthesis is active before canceling
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
      }

      // Clear state regardless of speech status
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        currentPage: null, // For StoryViewer
        currentLanguage: null,
        currentUtterance: null,
      }));
    } catch (error) {
      console.error("Speech synthesis stopped:", error);
    }
  }, []);

  // Navigation
  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      stopSpeech();
    }
  }, [currentPage, totalPages, stopSpeech]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      stopSpeech();
    }
  }, [currentPage, stopSpeech]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          prevPage();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextPage();
          break;
        case " ":
          event.preventDefault();
          if (currentPage === 0) {
            const title = getText(story.output.bookTitle);
            toggleAudio(title, currentPage);
          } else if (currentPage <= chapters.length) {
            const chapter = chapters[currentPage - 1] as Chapter;
            if (chapter) {
              const title = getText(chapter.chapterTitle);
              const text = getText(chapter.storyText);
              toggleAudio(`${title}. ${text}`, currentPage);
            }
          }
          break;
        case "Escape":
          event.preventDefault();
          stopSpeech();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentPage,
    chapters,
    getText,
    toggleAudio,
    story.output.bookTitle,
    prevPage,
    nextPage,
    stopSpeech,
  ]);

  // Render audio button with proper state and fallback
  const renderAudioButton = (
    text: string,
    pageIndex: number,
    language: string,
    size: "sm" | "lg" = "sm"
  ) => {
    const hasSupport = hasLanguageSupport(language);
    const isCurrentlyPlaying =
      audioState.isPlaying &&
      audioState.currentPage === pageIndex &&
      audioState.currentLanguage === language;
    const isCurrentlyLoading =
      audioState.isLoading &&
      audioState.currentPage === pageIndex &&
      audioState.currentLanguage === language;

    return (
      <Button
        onClick={() => toggleAudio(text, pageIndex, language)}
        disabled={audioState.isLoading || !speechSupported || !hasSupport}
        variant="outline"
        size={size}
        className="gap-2"
      >
        {isCurrentlyLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isCurrentlyPlaying ? (
          <Pause className="h-4 w-4" />
        ) : !speechSupported || !hasSupport ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Listen in {language}
        {!hasSupport && " (Unavailable)"}
      </Button>
    );
  };

  // Cover Page
  const renderCoverPage = () => {
    // Directly access language fields with sensible fallbacks
    const titlelang1 = typeof story.output.bookTitle === 'object' && story.output.bookTitle !== null
      ? (story.output.bookTitle as any)[language1] || (story.output.bookTitle as any)[language2] || ""
      : story.output.bookTitle || "";
    const titlelang2 = typeof story.output.bookTitle === 'object' && story.output.bookTitle !== null
      ? (story.output.bookTitle as any)[language2] || (story.output.bookTitle as any)[language1] || ""
      : story.output.bookTitle || "";

    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-6">
        {/* Book Cover */}
        <div className="relative aspect-[3/4] w-full max-w-sm">
          {!imageError ? (
            <Image
              src={story.coverImage}
              alt={`Cover of ${titlelang1}`}
              fill
              className="object-cover rounded-lg shadow-lg"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center border-2 border-border">
              <BookOpen className="h-24 w-24 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {titlelang1}
          </h1>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {titlelang2}
          </h1>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">{story.genre}</Badge>
          <Badge variant="secondary">{story.ageGroup}</Badge>
          <Badge variant="outline" className="gap-1">
            <Languages className="h-3 w-3" />
            {language1} → {language2}
          </Badge>
        </div>

        {/* Audio Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Voice Settings</span>
            {speechSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Voice Settings */}
          {showSettings && speechSupported && (
            <Card className="w-full max-w-md bg-muted/30">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Voice Settings</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setVoiceSettings({ rate: 0.9, pitch: 1.0, volume: 1.0 })
                      }
                      className="h-6 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Speed: {voiceSettings.rate.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.rate}
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value);
                          if (isFinite(value)) {
                            const clampedValue = Math.max(0.5, Math.min(2, value));
                            setVoiceSettings((prev) => ({
                              ...prev,
                              rate: clampedValue,
                            }));
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Pitch: {voiceSettings.pitch.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.pitch}
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value);
                          if (isFinite(value)) {
                            const clampedValue = Math.max(0.5, Math.min(2, value));
                            setVoiceSettings((prev) => ({
                              ...prev,
                              pitch: clampedValue,
                            }));
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">
                        Volume: {Math.round(voiceSettings.volume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={voiceSettings.volume}
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value);
                          if (isFinite(value)) {
                            const clampedValue = Math.max(0, Math.min(1, value));
                            setVoiceSettings((prev) => ({
                              ...prev,
                              volume: clampedValue,
                            }));
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue={language1} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value={language1} className="gap-2">
                <Languages className="h-3 w-3" />
                {language1}
              </TabsTrigger>
              <TabsTrigger value={language2} className="gap-2">
                <Languages className="h-3 w-3" />
                {language2}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={language1} className="mt-4">
              {renderAudioButton(titlelang1, currentPage, language1, "lg")}
            </TabsContent>

            <TabsContent value={language2} className="mt-4">
              {renderAudioButton(titlelang2, currentPage, language2, "lg")}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  // Chapter Page - No Tabs, Show Both Languages
  const renderChapterPage = (chapterIndex: number) => {
    const chapter = chapters[chapterIndex] as Chapter;
    if (!chapter) return null;

    const titleLang1 = getText(chapter.chapterTitle, language1);
    const titleLang2 = getText(chapter.chapterTitle, language2);
    const textLang1 = getText(chapter.storyText, language1);
    const textLang2 = getText(chapter.storyText, language2);

    return (
      <div className="min-h-[600px] space-y-8">
        {/* Chapter Header */}
        <div className="text-center border-b border-border pb-6">
          <Badge variant="secondary" className="mb-2">
            Chapter {chapter.chapterNumber}
          </Badge>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {titleLang1}
            </h2>
            {titleLang2 !== titleLang1 && (
              <h3 className="text-xl md:text-2xl font-medium text-muted-foreground">
                {titleLang2}
              </h3>
            )}
          </div>
        </div>

        {/* Language 1 Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {language1}
            </h3>
            <div
              className={`w-2 h-2 rounded-full ${hasLanguageSupport(language1) ? "bg-green-500" : "bg-amber-500"
                }`}
            />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-4">
            <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
              {textLang1}
            </p>
          </div>

          <div className="flex items-center gap-2 pb-4">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            {renderAudioButton(
              `${titleLang1}. ${textLang1}`,
              currentPage,
              language1
            )}
            {!hasLanguageSupport(language1) && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Limited support
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6" />

        {/* Language 2 Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Languages className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">
              {language2}
            </h3>
            <div
              className={`w-2 h-2 rounded-full ${hasLanguageSupport(language2) ? "bg-green-500" : "bg-amber-500"
                }`}
            />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-4">
            <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
              {textLang2}
            </p>
          </div>

          <div className="flex items-center gap-2 pb-4">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            {renderAudioButton(
              `${titleLang2}. ${textLang2}`,
              currentPage,
              language2
            )}
            {!hasLanguageSupport(language2) && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Limited support
              </span>
            )}
          </div>
        </div>

        {/* Vocabulary */}
        {chapter.difficultWords && chapter.difficultWords.length > 0 && (
          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Key Vocabulary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapter.difficultWords.map((vocab, index) => (
                <Card key={index} className="bg-muted/50 border-border">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-foreground">
                          {vocab.word}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {vocab.meaning}
                        </p>
                        {vocab.pronunciation && (
                          <span className="text-xs text-muted-foreground">
                            [{vocab.pronunciation}]
                          </span>
                        )}
                      </div>
                      {(() => {
                        // Compute the language for the vocab word
                        let wordLang = vocab.language;
                        if (!wordLang) {
                          // TODO: Replace with proper language detection library (e.g., franc, langdetect)
                          // For now, use deterministic fallback to primary language
                          wordLang = language1;

                          // Dev-only warning for missing language data
                          if (process.env.NODE_ENV === 'development') {
                            console.warn(
                              `Missing language for vocabulary word "${vocab.word}". ` +
                              `Using fallback language: ${language1}. ` +
                              `Please ensure vocab.language is set in source data.`
                            );
                          }

                          // TODO: Add telemetry event for production monitoring
                          // Example: analytics.track('vocabulary_missing_language', { word: vocab.word, fallbackLanguage: language1 });
                        }
                        return (
                          <Button
                            onClick={() =>
                              toggleAudio(vocab.word, -1, wordLang)
                            }
                            disabled={
                              !speechSupported || !hasLanguageSupport(wordLang)
                            }
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Pronounce word"
                          >
                            {!speechSupported ||
                              !hasLanguageSupport(wordLang) ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Final Page
  const renderFinalPage = () => {
    const moralLang1 = getText(
      story.output.moralOfTheStory?.moral ?? "No moral for this story",
      language1
    );
    const moralLang2 = getText(
      story.output.moralOfTheStory?.moral ?? "No moral for this story",
      language2
    );

    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-6">
        <Heart className="h-16 w-16 text-primary animate-pulse" />

        <h2 className="text-3xl font-bold text-foreground">The End</h2>

        <p className="text-xl text-muted-foreground">
          Thank you for reading "{getText(story.output.bookTitle)}"
        </p>

        {/* Story Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md w-full">
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {chapters.length}
              </div>
              <div className="text-sm text-muted-foreground">Chapters</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary-foreground">
                {story.genre}
              </div>
              <div className="text-sm text-muted-foreground">Genre</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-foreground">2</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </CardContent>
          </Card>
        </div>

        {/* Author Info */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-muted-foreground">
            Created by{" "}
            <span className="text-foreground font-medium">
              {story.userName}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(story.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };

  // Render current page
  const renderCurrentPage = () => {
    if (currentPage === 0) {
      return renderCoverPage();
    } else if (currentPage <= chapters.length) {
      return renderChapterPage(currentPage - 1);
    } else {
      return renderFinalPage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Speech Support Warning */}
      {(!speechSupported || hasLimitedTTS) && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <VolumeX className="h-4 w-4" />
              <span className="text-sm font-medium">
                {!speechSupported
                  ? "Speech synthesis is not supported in this browser"
                  : "Some languages have limited text-to-speech support"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Reading Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Story Content */}
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-8">{renderCurrentPage()}</CardContent>
      </Card>

      {/* Navigation */}
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Primary Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={prevPage}
                disabled={currentPage === 0}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {currentPage === 0
                    ? "Cover"
                    : currentPage <= chapters.length
                      ? `Chapter ${currentPage}`
                      : "The End"}
                </span>

                {/* Page Dots */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentPage(i);
                        stopSpeech();
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${i === currentPage
                          ? "bg-primary"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        }`}
                      title={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>

                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
              </div>

              <Button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Audio Status & Controls */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {audioState.isPlaying ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Playing in {audioState.currentLanguage}</span>
                  </>
                ) : audioState.isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : speechSupported ? (
                  <>
                    <Volume2 className="h-3 w-3" />
                    <span>Speech Ready</span>
                    {hasLimitedTTS && (
                      <Badge variant="outline" className="text-xs ml-2">
                        Limited Support
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3" />
                    <span>No Speech Support</span>
                  </>
                )}
              </div>

              {/* Stop Button */}
              {audioState.isPlaying && (
                <Button
                  onClick={stopSpeech}
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-transparent"
                >
                  <Pause className="h-3 w-3" />
                  Stop
                </Button>
              )}

              {/* Keyboard Shortcuts */}
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">←→</kbd>
                <span>Navigate</span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                  Space
                </kbd>
                <span>Play</span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                <span>Stop</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
