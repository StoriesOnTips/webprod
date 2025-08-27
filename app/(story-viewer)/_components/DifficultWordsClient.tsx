"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  X,
  SortAsc,
  SortDesc,
  Volume2,
  Copy,
  CheckCircle,
  BookOpen,
  Download,
  Share2,
  Play,
  Pause,
  Loader2,
  Star,
  StarOff,
  VolumeX,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DifficultWord {
  word: string;
  meaning: string;
  pronunciation?: string;
  chapter?: number;
}

interface DifficultWordsClientProps {
  words: DifficultWord[];
  sourceLanguage: string;
  targetLanguage: string;
}

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentWord: string | null;
  currentUtterance: SpeechSynthesisUtterance | null;
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
}

type SortOption = "alphabetical" | "chapter" | "length" | "recent";

// Language code mapping for speech synthesis
const LANGUAGE_CODES: Record<string, string> = {
  english: "en-US",
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  italian: "it-IT",
  portuguese: "pt-PT",
  chinese: "zh-CN",
  japanese: "ja-JP",
  korean: "ko-KR",
  arabic: "ar-SA",
  hindi: "hi-IN",
  russian: "ru-RU",
  dutch: "nl-NL",
  swedish: "sv-SE",
  norwegian: "no-NO",
  danish: "da-DK",
  polish: "pl-PL",
  turkish: "tr-TR",
  greek: "el-GR",
  hebrew: "he-IL",
};

export default function DifficultWordsClient({
  words,
  sourceLanguage,
  targetLanguage,
}: DifficultWordsClientProps) {
  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [copiedWords, setCopiedWords] = useState<Set<string>>(new Set());
  const [favoriteWords, setFavoriteWords] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    currentWord: null,
    currentUtterance: null,
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
  });
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const { theme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check speech synthesis support
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

        // Find best voice for target language
        const targetLangCode =
          LANGUAGE_CODES[targetLanguage.toLowerCase()] || targetLanguage;
        const preferredVoice =
          voices.find((voice) =>
            voice.lang.startsWith(targetLangCode.split("-")[0])
          ) ||
          voices.find((voice) => voice.default) ||
          voices[0];

        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      };

      // Load voices immediately and on voiceschanged event
      loadVoices();
      speechSynthesis.addEventListener("voiceschanged", loadVoices);

      return () => {
        speechSynthesis.removeEventListener("voiceschanged", loadVoices);
        // Stop any ongoing speech
        speechSynthesis.cancel();
      };
    }
  }, [targetLanguage]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vocabulary-favorites");
      if (saved) {
        setFavoriteWords(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(
        "vocabulary-favorites",
        JSON.stringify([...favoriteWords])
      );
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  }, [favoriteWords]);

  // Filter and sort words with advanced options
  const processedWords = useMemo(() => {
    let filtered = words.filter((word) => {
      const matchesSearch =
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.meaning.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFavorites =
        !showFavoritesOnly || favoriteWords.has(word.word);

      return matchesSearch && matchesFavorites;
    });

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case "alphabetical":
          comparison = a.word.localeCompare(b.word);
          break;
        case "chapter":
          comparison = (a.chapter || 0) - (b.chapter || 0);
          break;
        case "length":
          comparison = a.word.length - b.word.length;
          break;
        case "recent":
          comparison = words.indexOf(b) - words.indexOf(a);
          break;
        default:
          comparison = a.word.localeCompare(b.word);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [
    words,
    searchTerm,
    sortOption,
    sortOrder,
    showFavoritesOnly,
    favoriteWords,
  ]);

  // Search and filter functions
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const toggleShowFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev);
  }, []);

  // Speech synthesis functions
  const speakWord = useCallback(
    async (word: string) => {
      if (!speechSupported) {
        toast.error("Speech synthesis is not supported");
        return;
      }

      try {
        // Stop current speech if playing
        if (audioState.isPlaying) {
          speechSynthesis.cancel();
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            currentWord: null,
            currentUtterance: null,
          }));

          // If clicking the same word, just stop
          if (audioState.currentWord === word) {
            return;
          }
        }

        setAudioState((prev) => ({
          ...prev,
          isLoading: true,
          currentWord: word,
        }));

        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(word);

        // Configure utterance
        if (selectedVoice) {
          utterance.voice = selectedVoice;
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
            currentWord: null,
            currentUtterance: null,
          }));
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event);
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            currentWord: null,
            currentUtterance: null,
          }));
          toast.error("Speech synthesis failed");
        };

        // Speak the word
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Error in speakWord:", error);
        setAudioState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          currentWord: null,
          currentUtterance: null,
        }));
        toast.error("Failed to pronounce word");
      }
    },
    [speechSupported, audioState, selectedVoice, voiceSettings]
  );

  // Stop speech
  const stopSpeech = useCallback(() => {
    speechSynthesis.cancel();
    setAudioState((prev) => ({
      ...prev,
      isPlaying: false,
      currentWord: null,
      currentUtterance: null,
    }));
  }, []);

  // Copy functionality with enhanced feedback
  const copyWord = useCallback(async (word: string) => {
    try {
      await navigator.clipboard.writeText(word);
      setCopiedWords((prev) => new Set([...prev, word]));
      toast.success(`"${word}" copied to clipboard!`);

      setTimeout(() => {
        setCopiedWords((prev) => {
          const newSet = new Set(prev);
          newSet.delete(word);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  // Favorite functionality
  const toggleFavorite = useCallback((word: string) => {
    setFavoriteWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
        toast.success(`Removed "${word}" from favorites`);
      } else {
        newSet.add(word);
        toast.success(`Added "${word}" to favorites`);
      }
      return newSet;
    });
  }, []);

  // Export functionality

  const exportWords = useCallback(() => {
    const wordsToExport = showFavoritesOnly
      ? processedWords.filter((word) => favoriteWords.has(word.word))
      : processedWords;

    // CSV field sanitizer
    function sanitizeCSVField(field: string | undefined | null): string {
      let value = field ?? "";
      // Neutralize formula injection
      if (/^[=+\-@]/.test(value)) {
        value = "'" + value;
      }
      // Escape double quotes
      value = value.replace(/"/g, '""');
      // Wrap in double quotes
      return `"${value}"`;
    }

    const header = ["Word", "Meaning", "Pronunciation", "Chapter"];
    const rows = [
      header.map(sanitizeCSVField).join(","),
      ...wordsToExport.map((word) =>
        [
          sanitizeCSVField(word.word),
          sanitizeCSVField(word.meaning),
          sanitizeCSVField(word.pronunciation || ""),
          sanitizeCSVField(word.chapter?.toString() || ""),
        ].join(",")
      ),
    ];
    const csvString = rows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `vocabulary-${sourceLanguage}-to-${targetLanguage}.csv`
    );
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 0);

    toast.success("Vocabulary exported successfully!");
  }, [
    processedWords,
    showFavoritesOnly,
    favoriteWords,
    sourceLanguage,
    targetLanguage,
  ]);

  // Share functionality
  const shareVocabulary = useCallback(async () => {
    const shareText = `Check out these vocabulary words I'm learning:\n\n${processedWords
      .slice(0, 5)
      .map((word) => `• ${word.word} - ${word.meaning}`)
      .join("\n")}${
      processedWords.length > 5
        ? `\n...and ${processedWords.length - 5} more!`
        : ""
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${sourceLanguage} to ${targetLanguage} Vocabulary`,
          text: shareText,
        });
      } catch (error) {
        copyWord(shareText);
      }
    } else {
      copyWord(shareText);
    }
  }, [processedWords, sourceLanguage, targetLanguage, copyWord]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "f":
            event.preventDefault();
            searchInputRef.current?.focus();
            break;
          case "k":
            event.preventDefault();
            clearSearch();
            break;
        }
      }

      // ESC to stop speech
      if (event.key === "Escape" && audioState.isPlaying) {
        event.preventDefault();
        stopSpeech();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [clearSearch, audioState.isPlaying, stopSpeech]);

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search words or meanings... (Ctrl+F)"
              className="pl-10 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-2 bg-background border border-border rounded-md text-sm"
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="chapter">By Chapter</option>
              <option value="length">By Length</option>
              <option value="recent">Recently Added</option>
            </select>

            <Button
              variant="outline"
              onClick={toggleSortOrder}
              className="gap-2 bg-transparent"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              {sortOrder === "asc" ? "A-Z" : "Z-A"}
            </Button>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="h-3 w-3" />
              {processedWords.length}{" "}
              {processedWords.length === 1 ? "word" : "words"}
            </Badge>

            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={toggleShowFavorites}
              className="gap-1"
            >
              <Star
                className={`h-3 w-3 ${showFavoritesOnly ? "fill-current" : ""}`}
              />
              Favorites ({favoriteWords.size})
            </Button>

            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Speech Status */}
            {!speechSupported ? (
              <Badge variant="destructive" className="gap-1">
                <VolumeX className="h-3 w-3" />
                No Speech Support
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Volume2 className="h-3 w-3" />
                Speech Ready
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={exportWords}
              className="gap-1 bg-transparent"
            >
              <Download className="h-3 w-3" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareVocabulary}
              className="gap-1 bg-transparent"
            >
              <Share2 className="h-3 w-3" />
              Share
            </Button>
          </div>
        </div>

        {/* Voice Settings */}
        {speechSupported && availableVoices.length > 0 && (
          <Card className="bg-muted/20 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Voice Settings</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Voice
                  </label>
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={(e) => {
                      const voice = availableVoices.find(
                        (v) => v.name === e.target.value
                      );
                      setSelectedVoice(voice || null);
                    }}
                    className="w-full px-2 py-1 bg-background border border-border rounded text-xs"
                  >
                    {(() => {
                      const targetLower =
                        typeof targetLanguage === "string"
                          ? targetLanguage.toLowerCase()
                          : targetLanguage;
                      const langPrefix =
                        LANGUAGE_CODES[targetLower]?.split("-")[0] ??
                        targetLanguage;
                      return availableVoices
                        .filter((voice) => voice.lang.startsWith(langPrefix))
                        .map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ));
                    })()}
                  </select>
                </div>

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
                    onChange={(e) =>
                      setVoiceSettings((prev) => ({
                        ...prev,
                        rate: Number.parseFloat(e.target.value),
                      }))
                    }
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
                    onChange={(e) =>
                      setVoiceSettings((prev) => ({
                        ...prev,
                        pitch: Number.parseFloat(e.target.value),
                      }))
                    }
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
                    onChange={(e) =>
                      setVoiceSettings((prev) => ({
                        ...prev,
                        volume: Number.parseFloat(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Words List */}
      <ScrollArea className="h-auto max-h-[600px]">
        {processedWords.length > 0 ? (
          <div className="grid gap-3">
            {processedWords.map((word, index) => {
              const isPlaying =
                audioState.isPlaying && audioState.currentWord === word.word;
              const isLoading =
                audioState.isLoading && audioState.currentWord === word.word;
              const isCopied = copiedWords.has(word.word);
              const isFavorited = favoriteWords.has(word.word);

              return (
                <Card
                  key={`${word.word}-${index}`}
                  className="bg-card border-border hover:shadow-md transition-all duration-200 group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Word Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-primary capitalize">
                            {word.word}
                          </h3>

                          {word.chapter && (
                            <Badge variant="outline" className="text-xs">
                              Chapter {word.chapter}
                            </Badge>
                          )}
                        </div>

                        <p className="text-foreground leading-relaxed mb-2">
                          {word.meaning}
                        </p>

                        {word.pronunciation && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Volume2 className="h-3 w-3" />
                            {word.pronunciation}
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(word.word)}
                          className="h-8 w-8 p-0"
                          title={
                            isFavorited
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          {isFavorited ? (
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speakWord(word.word)}
                          disabled={isLoading || !speechSupported}
                          className="h-8 w-8 p-0"
                          title="Pronounce word"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPlaying ? (
                            <Pause className="h-4 w-4 text-green-500" />
                          ) : !speechSupported ? (
                            <VolumeX className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyWord(word.word)}
                          className="h-8 w-8 p-0"
                          title="Copy word"
                        >
                          {isCopied ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4">
              {showFavoritesOnly ? (
                <Star className="h-12 w-12 text-muted-foreground opacity-50" />
              ) : (
                <Search className="h-12 w-12 text-muted-foreground opacity-50" />
              )}
            </div>

            <h3 className="text-lg font-medium text-foreground mb-2">
              {showFavoritesOnly ? "No favorite words yet" : "No words found"}
            </h3>

            <p className="text-muted-foreground max-w-md">
              {showFavoritesOnly
                ? "Start adding words to your favorites by clicking the star icon."
                : searchTerm
                ? `No words match "${searchTerm}". Try a different search term.`
                : "No vocabulary words are available for this story."}
            </p>

            {(searchTerm || showFavoritesOnly) && (
              <div className="flex gap-2 mt-4">
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={clearSearch}
                    className="gap-1 bg-transparent"
                  >
                    <X className="h-4 w-4" />
                    Clear search
                  </Button>
                )}

                {showFavoritesOnly && (
                  <Button
                    variant="outline"
                    onClick={toggleShowFavorites}
                    className="gap-1 bg-transparent"
                  >
                    <BookOpen className="h-4 w-4" />
                    Show all words
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Learning Tips and Shortcuts */}
      {processedWords.length > 0 && (
        <div className="space-y-4">
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learning Tip */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  💡 Learning Tips
                </h4>
                <p className="text-sm text-muted-foreground">
                  Use the audio feature to improve pronunciation, save favorite
                  words for review, and practice using them in your own
                  sentences. Regular review is key to retention!
                </p>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  ⌨️ Shortcuts
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Ctrl+F
                    </kbd>{" "}
                    Focus search
                  </div>
                  <div>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Ctrl+K
                    </kbd>{" "}
                    Clear search
                  </div>
                  <div>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                      Esc
                    </kbd>{" "}
                    Stop speech
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
