"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { cn } from "@/lib/utils";

const subjectSchema = z
  .string()
  .trim()
  .min(10, { message: "Story subject must be at least 10 characters." })
  .max(500, { message: "Story subject must be under 500 characters." });

interface StorySubjectInputProps {
  userSelection?: (data: {
    fieldName: string;
    fieldValue: string;
    isValid: boolean;
  }) => void;
}

function StorySubjectInput({ userSelection }: StorySubjectInputProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string) => {
    const res = subjectSchema.safeParse(val);
    const isValid = res.success;
    const errorMessage = isValid
      ? null
      : res.error.issues[0]?.message ?? "Invalid value";
    setError(errorMessage);
    return isValid;
  };

  const handleChange = (val: string) => {
    setValue(val);
    const isValid = validate(val);
    userSelection?.({
      fieldValue: val,
      fieldName: "storySubject",
      isValid,
    });
  };

  const handleBlur = () => {
    setTouched(true);
    validate(value);
  };

  useEffect(() => {
    // Only run on mount to set initial state
    if (userSelection) {
      const isValid = value.trim().length >= 10 && value.trim().length <= 500;
      userSelection({
        fieldValue: value,
        fieldName: "storySubject",
        isValid,
      });
    }

  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="story-subject" className="text-lg font-semibold tracking-wide">
          1. STORY SUBJECT
        </Label>
        <p className="text-sm text-muted-foreground">
          Describe what your story should be about. Be creative and detailed!
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          id="story-subject"
          name="subject"
          required
          maxLength={500}
          placeholder="Write a detailed prompt for your story. For example: 'A brave young princess who discovers she can talk to animals and goes on an adventure to save her kingdom from an evil wizard...'"
          className={cn(
            "min-h-[160px] max-h-[240px] resize-y text-base leading-relaxed",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-all duration-200",
            touched &&
            error &&
            "border-destructive focus-visible:ring-destructive/20"
          )}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          aria-invalid={touched && !!error}
          aria-describedby={error ? "story-subject-error" : undefined}
        />

        <div className="flex justify-between items-center text-xs">
          <span className={cn(
            "text-muted-foreground",
            (value.trim().length > 500 || error) && "text-destructive"
          )}>
            {value.trim().length}/500 characters
          </span>
          {value.trim().length >= 10 && value.trim().length <= 500 && !error && (
            <span className="text-green-600 font-medium">✓ Good length</span>
          )}
        </div>
      </div>

      {touched && error && (
        <p
          id="story-subject-error"
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <span className="text-destructive">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

export default StorySubjectInput;
