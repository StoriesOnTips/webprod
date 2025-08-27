"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Volume2,
  Play,
  Pause,
  Loader2,
  Share2,
  Copy,
  Check,
  Languages,
  VolumeX,
  Settings,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface MoralClientProps {
  moral: string | { [key: string]: string }
  language1: string
  language2: string
  preferredLanguage?: string
  ttsLanguageMap?: Record<string, string>
  hasLimitedTTS?: boolean
}

interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  currentLanguage: string | null
  currentUtterance: SpeechSynthesisUtterance | null
}

interface VoiceSettings {
  rate: number
  pitch: number
  volume: number
}

// Default language mapping if not provided
const DEFAULT_LANGUAGE_CODES: Record<string, string> = {
  English: "en-GB",
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
}

export default function MoralClient({
  moral,
  language1,
  language2,
  preferredLanguage,
  ttsLanguageMap = DEFAULT_LANGUAGE_CODES,
  hasLimitedTTS = false,
}: MoralClientProps) {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    currentLanguage: null,
    currentUtterance: null,
  })
  const [copiedLang, setCopiedLang] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
  })
  const [showSettings, setShowSettings] = useState(false)

  // Get text in specific language
  const getText = useCallback(
    (language: string): string => {
      if (typeof moral === "string") return moral
      return moral[language] || moral[language1] || moral[language2] || Object.values(moral)[0] || ""
    },
    [moral, language1, language2],
  )

  const moralLang1 = getText(language1)
  const moralLang2 = getText(language2)

  // Check TTS support for individual languages
  const lang1HasTTS = ttsLanguageMap[language1]
  const lang2HasTTS = ttsLanguageMap[language2]

  // Check speech synthesis support and load voices
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window
      setSpeechSupported(isSupported)

      if (!isSupported) {
        toast.error("Speech synthesis is not supported in this browser")
        return
      }

      // Load available voices
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices()
        setAvailableVoices(voices)
      }

      loadVoices()
      speechSynthesis.addEventListener("voiceschanged", loadVoices)

      return () => {
        speechSynthesis.removeEventListener("voiceschanged", loadVoices)
        speechSynthesis.cancel()
      }
    }
  }, [])

  // Check if language has TTS support
  const hasLanguageSupport = useCallback(
    (language: string): boolean => {
      const langCode = ttsLanguageMap[language]
      if (!langCode) return false

      return availableVoices.some((voice) => voice.lang === langCode || voice.lang.startsWith(langCode.split("-")[0]))
    },
    [availableVoices, ttsLanguageMap],
  )

  // Get best voice for language
  const getBestVoice = useCallback(
    (language: string): SpeechSynthesisVoice | null => {
      const langCode = ttsLanguageMap[language] || language
      const langPrefix = langCode.split("-")[0]

      // Find exact match first
      let voice = availableVoices.find((v) => v.lang === langCode)

      // Then try language prefix match
      if (!voice) {
        voice = availableVoices.find((v) => v.lang.startsWith(langPrefix))
      }

      // Fallback to default voice
      if (!voice) {
        voice = availableVoices.find((v) => v.default) || availableVoices[0]
      }

      return voice || null
    },
    [availableVoices, ttsLanguageMap],
  )

  // Speech synthesis function with fallback handling
  const speakMoral = useCallback(
    async (language: string) => {
      if (!speechSupported) {
        toast.error("Speech synthesis is not supported in this browser")
        return
      }

      // Check if language has support
      if (!hasLanguageSupport(language)) {
        toast.error(`Text-to-speech is not available for ${language}. Your browser may not support this language.`)
        return
      }

      const moralText = getText(language)
      if (!moralText) {
        toast.error(`No moral text available in ${language}`)
        return
      }

      try {
        // Stop current speech if playing
        if (audioState.isPlaying) {
          speechSynthesis.cancel()
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            currentLanguage: null,
            currentUtterance: null,
          }))

          // If clicking the same language, just stop
          if (audioState.currentLanguage === language) {
            return
          }
        }

        setAudioState((prev) => ({
          ...prev,
          isLoading: true,
          currentLanguage: language,
        }))

        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(moralText.trim())

        // Configure utterance
        const voice = getBestVoice(language)
        if (voice) {
          utterance.voice = voice
        }

        utterance.rate = voiceSettings.rate
        utterance.pitch = voiceSettings.pitch
        utterance.volume = voiceSettings.volume

        // Set up event listeners
        utterance.onstart = () => {
          setAudioState((prev) => ({
            ...prev,
            isPlaying: true,
            isLoading: false,
            currentUtterance: utterance,
          }))
        }

        utterance.onend = () => {
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            currentLanguage: null,
            currentUtterance: null,
          }))
        }

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event)
          setAudioState((prev) => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            currentLanguage: null,
            currentUtterance: null,
          }))
          toast.error(`Speech synthesis failed for ${language}. This language may not be fully supported.`)
        }

        // Speak the moral
        speechSynthesis.speak(utterance)
      } catch (error) {
        console.error("Error in speakMoral:", error)
        setAudioState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          currentLanguage: null,
          currentUtterance: null,
        }))
        toast.error(`Failed to play audio in ${language}`)
      }
    },
    [speechSupported, audioState, getText, getBestVoice, voiceSettings, hasLanguageSupport],
  )

  // Stop speech
  const stopSpeech = useCallback(() => {
    speechSynthesis.cancel()
    setAudioState((prev) => ({
      ...prev,
      isPlaying: false,
      currentLanguage: null,
      currentUtterance: null,
    }))
  }, [])

  // Copy moral to clipboard
  const copyToClipboard = useCallback(async (text: string, language: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLang(language)
      toast.success("Moral copied to clipboard!")

      setTimeout(() => {
        setCopiedLang(null)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard.")
    }
  }, [])

  // Share moral
  const shareMoral = useCallback(
    async (text: string, language: string) => {
      const shareData = {
        title: "Story Moral",
        text: `"${text}" - A valuable lesson from an AI-generated story`,
      }

      try {
        if (navigator.share && navigator.canShare(shareData)) {
          await navigator.share(shareData)
        } else {
          await copyToClipboard(text, language)
        }
      } catch (error) {
        console.error("Error sharing:", error)
        await copyToClipboard(text, language)
      }
    },
    [copyToClipboard],
  )

  // Render audio button with proper state and fallback
  const renderAudioButton = (language: string, text: string) => {
    const hasSupport = hasLanguageSupport(language)
    const isCurrentlyPlaying = audioState.isPlaying && audioState.currentLanguage === language
    const isCurrentlyLoading = audioState.isLoading && audioState.currentLanguage === language

    return (
      <Button
        onClick={() => speakMoral(language)}
        disabled={audioState.isLoading || !speechSupported || !hasSupport}
        variant="outline"
        size="sm"
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
    )
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && audioState.isPlaying) {
        event.preventDefault()
        stopSpeech()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [audioState.isPlaying, stopSpeech])

  return (
    <div className="space-y-6">
      {/* TTS Warning */}
      {hasLimitedTTS && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Audio narration has limited support for {!lang1HasTTS && language1}
            {!lang1HasTTS && !lang2HasTTS && " and "}
            {!lang2HasTTS && language2}. Text-to-speech may not be available for all content in these languages.
          </AlertDescription>
        </Alert>
      )}

      {/* Speech Support Warning */}
      {!speechSupported && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <VolumeX className="h-4 w-4" />
              <span className="text-sm font-medium">Speech synthesis is not supported in this browser</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Settings */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        <span>Listen to the moral</span>
        {speechSupported && (
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-6 w-6 p-0">
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showSettings && speechSupported && (
        <Card className="w-full max-w-md mx-auto bg-muted/30">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Voice Settings</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceSettings({ rate: 0.9, pitch: 1.0, volume: 1.0 })}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Both Languages on Same Page */}
      <div className="space-y-6">
        {/* Language 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{language1}</h3>
            <div
              className={`w-2 h-2 rounded-full ${hasLanguageSupport(language1) ? "bg-green-500" : "bg-amber-500"}`}
            />
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-foreground font-medium italic">"{moralLang1}"</p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            {renderAudioButton(language1, moralLang1)}
            <Button
              onClick={() => copyToClipboard(moralLang1, language1)}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={copiedLang === language1}
            >
              {copiedLang === language1 ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button onClick={() => shareMoral(moralLang1, language1)} variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            {!hasLanguageSupport(language1) && (
              <span className="text-xs text-amber-600 dark:text-amber-400">Limited TTS support</span>
            )}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Language 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">{language2}</h3>
            <div
              className={`w-2 h-2 rounded-full ${hasLanguageSupport(language2) ? "bg-green-500" : "bg-amber-500"}`}
            />
          </div>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="p-4">
              <p className="text-foreground font-medium italic">"{moralLang2}"</p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            {renderAudioButton(language2, moralLang2)}
            <Button
              onClick={() => copyToClipboard(moralLang2, language2)}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={copiedLang === language2}
            >
              {copiedLang === language2 ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button onClick={() => shareMoral(moralLang2, language2)} variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            {!hasLanguageSupport(language2) && (
              <span className="text-xs text-amber-600 dark:text-amber-400">Limited TTS support</span>
            )}
          </div>
        </div>
      </div>

      {/* Audio Status & Stop Button */}
      {audioState.isPlaying && (
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            Playing in {audioState.currentLanguage}
          </div>
          <Button onClick={stopSpeech} variant="outline" size="sm" className="gap-2 bg-transparent">
            <Pause className="h-4 w-4" />
            Stop
          </Button>
        </div>
      )}

      {/* Help Text */}
      {speechSupported && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to stop playback
          </p>
        </div>
      )}
    </div>
  )
}
