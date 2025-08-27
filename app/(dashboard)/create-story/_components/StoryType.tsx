"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { z } from "zod";

export interface OptionField {
  label: string;
  imageUrl: string;
  isFree: boolean;
  desp: string;
}

interface StoryTypeProps {
  userSelection?: (data: {
    fieldName: string;
    fieldValue: string;
    isValid: boolean;
  }) => void;
}

function StoryType({ userSelection }: StoryTypeProps) {
  const OptionsList: OptionField[] = [
    {
      label: "Poetic",
      imageUrl: "/story-type/Poetic.webp",
      isFree: true,
      desp: "A narrative told through rhythmic, expressive, and artistic language. Uses poetic devices like rhyme, meter, and imagery to evoke emotions and create a lyrical storytelling experience.",
    },
    {
      label: "Bed Story",
      imageUrl: "/story-type/bed.webp",
      isFree: true,
      desp: "Gentle, calming tales meant to be read before sleep, often with soothing themes, simple plots, and comforting endings to help children relax.",
    },
    {
      label: "Educational",
      imageUrl: "/story-type/educational.webp",
      isFree: true,
      desp: "Engaging narratives designed to teach specific lessons, skills, or knowledge, blending entertainment with learning to make concepts easier to understand.",
    },
    {
      label: "Folk & Cultural Tales",
      imageUrl: "/story-type/folk.webp",
      isFree: true,
      desp: "Traditional stories passed down through generations, reflecting the values, beliefs, and heritage of a culture. Often feature moral lessons, myths, or historical legends.",
    },
  ];

  const labels = OptionsList.map((o) => o.label) as [string, ...string[]];
  const storyTypeSchema = z.enum(labels);

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calledOnce = useRef(false);

  const isValidOption = (val: string): boolean => {
    return storyTypeSchema.safeParse(val).success;
  };

  const validate = (val: string) => {
    if (!val.trim()) {
      setError("Please select a story type");
      return false;
    }
    
    const res = storyTypeSchema.safeParse(val);
    const isValid = res.success;
    const errorMessage = isValid
      ? null
      : res.error.issues[0]?.message ?? "Please select a valid story type";
    setError(errorMessage);
    return isValid;
  };

  const OnUserSelect = (item: OptionField) => {
    setSelectedOption(item.label);
    setTouched(true);
    // Clear any previous errors when a new option is selected
    setError(null);
    const isValid = validate(item.label);
    userSelection?.({
      fieldValue: item.label,
      fieldName: "storyType",
      isValid,
    });
  };

  useEffect(() => {
    // Initial validation state - run only once on mount
    if (!calledOnce.current) {
      calledOnce.current = true;
      userSelection?.({
        fieldValue: "",
        fieldName: "storyType",
        isValid: false,
      });
    }
  }, [userSelection]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-lg font-semibold tracking-wide">
          2. STORY TYPE
        </label>
        <p className="text-sm text-muted-foreground">
          Choose the type of story you want to create.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {OptionsList.map((item, index) => {
          const isActive = selectedOption === item.label;
          return (
            <Card
              key={item.label || index}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                "border-2 hover:border-primary/20",
                isActive
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:bg-muted/50",
                touched && !isValidOption(selectedOption) && "border-destructive"
              )}
              onClick={() => OnUserSelect(item)}
              tabIndex={0}
              role="button"
              aria-pressed={isActive}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  OnUserSelect(item);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={
                        item.imageUrl || "/placeholder.svg?height=80&width=100"
                      }
                      alt={item.label}
                      width={100}
                      height={80}
                      className="h-20 w-24 rounded-lg object-cover border"
                      priority={index === 0}
                    />
                    {isActive && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-wide">
                      {item.label}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desp}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
    </div>
  );
}

export default StoryType;
