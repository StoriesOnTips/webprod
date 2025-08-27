"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { cn } from "@/lib/utils";

const genres = [
  "Adventure",
  "Fantasy",
  "Mystery",
  "Science Fiction",
  "Fairy Tale",
  "Animal Stories",
  "Friendship",
  "Family",
  "Comedy",
  "Historical",
  "Superhero",
] as const;

const genreSchema = z.enum(genres);

interface GenreSelectProps {
  userSelection?: (data: {
    fieldName: string;
    fieldValue: string;
    isValid: boolean;
  }) => void;
}

export default function GenreSelect({ userSelection }: GenreSelectProps) {
  const [genre, setGenre] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (value: string) => {
    const res = genreSchema.safeParse(value);
    const isValid = res.success;
    const errorMessage = isValid
      ? null
      : res.error.issues[0]?.message ?? "Invalid value";
    setError(errorMessage);
    return isValid;
  };

  const handleSelect = (value: string) => {
    setGenre(value);
    setTouched(true);
    const isValid = validate(value);
    userSelection?.({
      fieldValue: value,
      fieldName: "genre",
      isValid,
    });
  };

  const handleBlur = () => {
    setTouched(true);
    validate(genre);
  };

  useEffect(() => {
    // Initial validation state - only call once on mount
    userSelection?.({
      fieldValue: "",
      fieldName: "genre",
      isValid: false,
    });
  }, [userSelection]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-lg font-semibold tracking-wide">6. GENRE</label>
        <p className="text-sm text-muted-foreground">
          Choose the genre that best fits your story theme.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Story Genre *
        </Label>
        <Select value={genre} onValueChange={handleSelect}>
          <SelectTrigger
            className={cn(
              "w-full h-11 transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20 focus:border-primary",
              touched &&
                error &&
                "border-destructive focus-visible:ring-destructive/20"
            )}
            onBlur={handleBlur}
          >
            <SelectValue placeholder="Select a genre for your story" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {genres.map((g) => (
              <SelectItem
                key={g}
                value={g}
                className="cursor-pointer hover:bg-muted/50"
              >
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {touched && error && (
          <p
            className="text-sm text-destructive flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <span className="text-destructive">⚠</span>
            {error}
          </p>
        )}

        {genre && !error && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <span>✓</span>
            Great choice! {genre} stories are perfect for engaging narratives.
          </p>
        )}
      </div>
    </div>
  );
}
