"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { cn } from "@/lib/utils";

const languageOptions = [
  "English",
  "Spanish", 
  "French",
  "Mandarin",
  "German",
  "Arabic",
  "Russian",
  "Portuguese",
  "Italian",
  "Japanese",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
] as const;

const languageSchema = z.enum(languageOptions);

interface LanguageSelectProps {
  userSelection?: (data: { fieldName: string; fieldValue: string; isValid: boolean }) => void;
}

export default function LanguageSelect({ userSelection }: LanguageSelectProps) {
  const [lang1, setLang1] = useState("");
  const [lang2, setLang2] = useState("");
  const [touched, setTouched] = useState<{ language1: boolean; language2: boolean }>({
    language1: false,
    language2: false,
  });
  const [errors, setErrors] = useState<{ language1: string | null; language2: string | null }>({
    language1: null,
    language2: null,
  });

  const validate = (value: string, field: "language1" | "language2") => {
    const res = languageSchema.safeParse(value);
    const isValid = res.success;
    const errorMessage = isValid ? null : (res.error.issues[0]?.message ?? "Invalid value");
    
    setErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
    
    return isValid;
  };

  const handleSelect = (value: string, fieldName: "language1" | "language2") => {
    if (fieldName === "language1") setLang1(value);
    else setLang2(value);

    const isValid = validate(value, fieldName);
    
    userSelection?.({
      fieldValue: value,
      fieldName: fieldName,
      isValid,
    });
  };

  const handleBlur = (fieldName: "language1" | "language2") => {
    setTouched((t) => ({ ...t, [fieldName]: true }));
    const value = fieldName === "language1" ? lang1 : lang2;
    validate(value, fieldName);
  };

  useEffect(() => {
    // Initial validation state - only call once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    userSelection?.({
      fieldValue: "",
      fieldName: "language1",
      isValid: false,
    });
    userSelection?.({
      fieldValue: "",
      fieldName: "language2", 
      isValid: false,
    });
  }, []);

  const isFormValid = lang1 && lang2 && !errors.language1 && !errors.language2 && lang1 !== lang2;
  
  // Stable callback for batching language updates
  const batchLanguageUpdate = useCallback((lang1Data: { fieldValue: string; fieldName: string; isValid: boolean }, lang2Data: { fieldValue: string; fieldName: string; isValid: boolean }) => {
    // Call userSelection for both languages in sequence
    userSelection?.(lang1Data);
    userSelection?.(lang2Data);
  }, [userSelection]);
  
  // Update validation when both languages are selected and different
  useEffect(() => {
    if (lang1 && lang2 && lang1 !== lang2 && !errors.language1 && !errors.language2) {
      // Both languages are valid and different
      batchLanguageUpdate(
        { fieldValue: lang1, fieldName: "language1", isValid: true },
        { fieldValue: lang2, fieldName: "language2", isValid: true }
      );
    } else if (lang1 && lang2 && lang1 === lang2) {
      // Languages are the same - invalidate both
      batchLanguageUpdate(
        { fieldValue: lang1, fieldName: "language1", isValid: false },
        { fieldValue: lang2, fieldName: "language2", isValid: false }
      );
    }
  }, [lang1, lang2, errors.language1, errors.language2, batchLanguageUpdate]);
  
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold tracking-wide">
        5. LANGUAGES
      </Label>
      
      <div className="space-y-2">
        <Label htmlFor="language1" className="text-sm font-medium text-foreground">
          Your Native Language *
        </Label>
        <Select value={lang1} onValueChange={(val) => handleSelect(val, "language1")}>
          <SelectTrigger
            id="language1"
            className={cn(
              "w-full h-11 transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              touched.language1 && errors.language1 && 
              "border-destructive focus-visible:ring-destructive/20"
            )}
            onBlur={() => handleBlur("language1")}
          >
            <SelectValue placeholder="Choose your native language" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {languageOptions.map((lang) => (
              <SelectItem 
                key={lang} 
                value={lang}
                className="cursor-pointer hover:bg-muted/50"
              >
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {touched.language1 && errors.language1 && (
          <p className="text-sm text-destructive flex items-center gap-1" role="alert" aria-live="polite">
            <span className="text-destructive">⚠</span>
            {errors.language1}
          </p>
        )}
      </div>

        <div className="space-y-2">
          <Label htmlFor="language2" className="text-sm font-medium text-foreground">
            Language You Want to Learn *
          </Label>
          <Select 
            value={lang2} 
            onValueChange={(val) => handleSelect(val, "language2")}
          >
            <SelectTrigger
              id="language2"
              className={cn(
                "w-full h-11 transition-all duration-200",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                touched.language2 && errors.language2 && 
                "border-destructive focus-visible:ring-destructive/20"
              )}
              onBlur={() => handleBlur("language2")}
            >
              <SelectValue placeholder="Choose target language" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {languageOptions.map((lang) => (
                <SelectItem 
                  key={lang} 
                  value={lang}
                  className="cursor-pointer hover:bg-muted/50"
                  disabled={lang === lang1}
                >
                  {lang} {lang === lang1 && "(Already selected)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.language2 && errors.language2 && (
            <p className="text-sm text-destructive flex items-center gap-1" role="alert" aria-live="polite">
              <span className="text-destructive">⚠</span>
              {errors.language2}
            </p>
          )}
        </div>

      {lang1 && lang2 && lang1 === lang2 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
          <span>💡</span>
          You've selected the same language twice. Please choose different languages for better learning experience.
        </p>
      )}

      {isFormValid && lang1 !== lang2 && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-2">
          <span>✓</span>
          Perfect! Your story will help you learn {lang2} using your {lang1} knowledge.
        </p>
      )}
    </div>
  );
}