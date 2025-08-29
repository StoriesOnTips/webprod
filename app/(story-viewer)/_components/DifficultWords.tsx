import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Languages, TrendingUp, Target, GraduationCap, Sparkles } from "lucide-react"
import type { StoryChapter } from "@/lib/actions/story-actions"
import DifficultWordsClient from "./DifficultWordsClient"

interface DifficultWordsSectionProps {
  chapters: StoryChapter[]
  language1: string
  language2: string
}

interface DifficultWord {
  word: string
  meaning: string
  pronunciation?: string
  chapter?: number
}

// Interface for raw word data from chapters
interface RawWordData {
  word: string
  meaning: string
  pronunciation?: string
}

// Type guard to check if an object is a valid RawWordData
function isValidWordData(obj: unknown): obj is RawWordData {
  if (obj === null || typeof obj !== "object") {
    return false;
  }
  
  const o = obj as Record<string, unknown>;
  
  return (
    "word" in o &&
    "meaning" in o &&
    typeof o.word === "string" &&
    typeof o.meaning === "string" &&
    o.word.trim() !== "" &&
    o.meaning.trim() !== ""
  );
}

// Enhanced language display mapping
const LANGUAGE_DISPLAY: Record<string, { name: string; flag: string; code: string }> = {
  english: { name: "English", flag: "🇺🇸", code: "en" },
  spanish: { name: "Español", flag: "🇪🇸", code: "es" },
  french: { name: "Français", flag: "🇫🇷", code: "fr" },
  german: { name: "Deutsch", flag: "🇩🇪", code: "de" },
  italian: { name: "Italiano", flag: "🇮🇹", code: "it" },
  portuguese: { name: "Português", flag: "🇵🇹", code: "pt" },
  chinese: { name: "中文", flag: "🇨🇳", code: "zh" },
  japanese: { name: "日本語", flag: "🇯🇵", code: "ja" },
  korean: { name: "한국어", flag: "🇰🇷", code: "ko" },
  arabic: { name: "العربية", flag: "🇸🇦", code: "ar" },
  hindi: { name: "हिन्दी", flag: "🇮🇳", code: "hi" },
  russian: { name: "Русский", flag: "🇷🇺", code: "ru" },
  dutch: { name: "Nederlands", flag: "🇳🇱", code: "nl" },
  swedish: { name: "Svenska", flag: "🇸🇪", code: "sv" },
  norwegian: { name: "Norsk", flag: "🇳🇴", code: "no" },
  danish: { name: "Dansk", flag: "🇩🇰", code: "da" },
  polish: { name: "Polski", flag: "🇵🇱", code: "pl" },
  turkish: { name: "Türkçe", flag: "🇹🇷", code: "tr" },
  greek: { name: "Ελληνικά", flag: "🇬🇷", code: "el" },
  hebrew: { name: "עברית", flag: "🇮🇱", code: "he" },
}

// Extract difficult words from chapters with enhanced processing
function extractDifficultWords(chapters: StoryChapter[]): DifficultWord[] {
  const allWords: DifficultWord[] = []
  const seenWords = new Set<string>()

  try {
    // Validate that chapters is an array
    if (!Array.isArray(chapters)) {
      return allWords;
    }

    chapters.forEach((chapter, chapterIndex) => {
      // Validate chapter object and difficultWords array
      if (chapter && typeof chapter === "object" && 
          chapter.difficultWords && Array.isArray(chapter.difficultWords)) {
        
        chapter.difficultWords.forEach((wordData: unknown) => {
          // Use proper type guard to ensure we have the required fields
          if (isValidWordData(wordData)) {
            const normalizedWord = wordData.word.toLowerCase().trim()

            // Avoid duplicates (case-insensitive)
            if (!seenWords.has(normalizedWord)) {
              seenWords.add(normalizedWord)
              allWords.push({
                word: wordData.word.trim(),
                meaning: wordData.meaning.trim(),
                pronunciation: wordData.pronunciation?.trim() || undefined,
                chapter: chapterIndex + 1,
              })
            }
          }
        })
      }
    })

    // Sort by chapter and then alphabetically
    return allWords.sort((a, b) => {
      const chapterDiff = (a.chapter || 0) - (b.chapter || 0)
      if (chapterDiff !== 0) return chapterDiff
      return a.word.localeCompare(b.word)
    })
  } catch (error) {
    console.error("Error extracting difficult words:", error);
    return [];
  }
}

// Get language display information
function getLanguageInfo(lang: string) {
  const langKey = lang.toLowerCase()
  return (
    LANGUAGE_DISPLAY[langKey] || {
      name: lang,
      flag: "🌐",
      code: langKey,
    }
  )
}

// Calculate vocabulary statistics
function getVocabularyStats(words: DifficultWord[]) {
  const totalWords = words.length
  const chaptersWithWords = new Set(
    words
      .map((w) => w.chapter)
      .filter((chapter): chapter is number => typeof chapter === "number")
  ).size
  const wordsWithPronunciation = words.filter((w) => w.pronunciation).length
  const avgWordsPerChapter = chaptersWithWords > 0 ? Math.round(totalWords / chaptersWithWords) : 0

  return {
    totalWords,
    chaptersWithWords,
    wordsWithPronunciation,
    avgWordsPerChapter,
  }
}

// Determine difficulty level based on word count
function getDifficultyLevel(wordCount: number): { level: string; color: string; description: string } {
  if (wordCount <= 10) {
    return {
      level: "Beginner",
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      description: "Perfect for starting your language journey",
    }
  } else if (wordCount <= 25) {
    return {
      level: "Intermediate",
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      description: "Good challenge for developing learners",
    }
  } else {
    return {
      level: "Advanced",
      color: "bg-red-500/10 text-red-600 border-red-500/20",
      description: "Extensive vocabulary for serious learners",
    }
  }
}

export default function DifficultWordsSection({ chapters, language1, language2 }: DifficultWordsSectionProps) {
  const allWords = extractDifficultWords(chapters)
  const hasWords = allWords.length > 0
  const lang1Info = getLanguageInfo(language1)
  const lang2Info = getLanguageInfo(language2)
  const stats = getVocabularyStats(allWords)
  const difficulty = getDifficultyLevel(allWords.length)

  // No words available state
  if (!hasWords) {
    return (
      <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground">
            <BookOpen className="size-5 text-primary" />
            Vocabulary Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 relative">
              <BookOpen className="size-16 text-muted-foreground/30" />
              <Sparkles className="size-6 text-primary/50 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-2">No vocabulary words available</h3>

            <p className="text-muted-foreground max-w-md mb-6">
              This story doesn't have any vocabulary words defined yet. Vocabulary sections help you learn new words and
              improve your language skills.
            </p>

            {/* Language Learning Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <Card className="bg-muted/30 border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{lang1Info.flag}</div>
                  <div className="text-sm font-medium text-foreground">{lang1Info.name}</div>
                  <div className="text-xs text-muted-foreground">Known Language</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{lang2Info.flag}</div>
                  <div className="text-sm font-medium text-foreground">{lang2Info.name}</div>
                  <div className="text-xs text-muted-foreground">Target Language</div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              Check back later or explore another story with vocabulary support
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
      <CardHeader className="space-y-4">
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <GraduationCap className="size-6 text-primary" />
              Vocabulary Builder
              <Sparkles className="size-4 text-primary/70 animate-pulse" />
            </CardTitle>

            <p className="text-muted-foreground text-sm">Master new words from your language learning journey</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="size-3" />
              {stats.totalWords} words
            </Badge>

            <Badge className={difficulty.color}>{difficulty.level}</Badge>
          </div>
        </div>

        {/* Language Learning Path */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{lang1Info.flag}</div>
              <div className="text-center">
                <div className="font-medium text-foreground text-sm">{lang1Info.name}</div>
                <div className="text-xs text-muted-foreground">Known</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-primary">
              <div className="w-8 h-0.5 bg-primary/30"></div>
              <Languages className="size-5" />
              <div className="w-8 h-0.5 bg-primary/30"></div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-2xl">{lang2Info.flag}</div>
              <div className="text-center">
                <div className="font-medium text-foreground text-sm">{lang2Info.name}</div>
                <div className="text-xs text-muted-foreground">Learning</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">{difficulty.description}</p>
          </div>
        </div>

        {/* Vocabulary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="size-4 text-primary" />
                <span className="text-xl font-bold text-primary">{stats.totalWords}</span>
              </div>
              <div className="text-xs text-muted-foreground">Total Words</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="size-4 text-secondary-foreground" />
                <span className="text-xl font-bold text-secondary-foreground">{stats.chaptersWithWords}</span>
              </div>
              <div className="text-xs text-muted-foreground">Chapters</div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="size-4 text-accent-foreground" />
                <span className="text-xl font-bold text-accent-foreground">{stats.avgWordsPerChapter}</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg/Chapter</div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Languages className="size-4 text-green-600" />
                <span className="text-xl font-bold text-green-600">{stats.wordsWithPronunciation}</span>
              </div>
              <div className="text-xs text-muted-foreground">With Audio</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Learning Features Overview */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">✨ Learning Features</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">AI-powered pronunciation</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Smart search & filtering</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-2 bg-purple-500 rounded-full"></div>
              <span className="text-muted-foreground">Favorite words tracking</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-2 bg-orange-500 rounded-full"></div>
              <span className="text-muted-foreground">Chapter-based organization</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-2 bg-pink-500 rounded-full"></div>
              <span className="text-muted-foreground">Export & sharing tools</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="size-2 bg-teal-500 rounded-full"></div>
              <span className="text-muted-foreground">Progress tracking</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <DifficultWordsClient words={allWords} sourceLanguage={lang1Info.name} targetLanguage={lang2Info.name} />
      </CardContent>
    </Card>
  )
}
