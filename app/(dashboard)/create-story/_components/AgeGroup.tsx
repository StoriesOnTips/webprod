"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { OptionField } from "./StoryType";

interface AgeGroupProps {
  userSelection?: (data: {
    fieldName: string;
    fieldValue: string;
    isValid: boolean;
  }) => void;
}

function AgeGroup({ userSelection }: AgeGroupProps) {

const OptionsList: OptionField[] = [
    {
      label: "0-5 Years",
      desp: "Bright and playful stories with simple words and sounds, perfect for early learners to explore and enjoy",
      isFree: true,
      imageUrl: "/age-group/0-5.webp",
    },
    {
      label: "5-10 Years",
      desp: "Fun and imaginative stories with simple words that inspire curiosity and help build early language skills.",
      isFree: true,
      imageUrl: "/age-group/5-10.webp",
    },
    {
      label: "10-15 Years",
      desp: "Discover fun adventures and educational tales designed to expand vocabulary, improve understanding, and spark creativity in kids.",
      isFree: true,
      imageUrl: "/age-group/10-15.webp",
    },
    {
      label: "15-18 Years",
      desp: "Dive into challenging and captivating stories that spark critical thinking and creativity, nurturing a lifelong passion for reading and exploration.",
      isFree: true,
      imageUrl: "/age-group/15-18.webp",
    },
    {
      label: "18+ Years",
      desp: "Diverse short stories and cultural tales thoughtfully crafted for adults to enhance fluency, deepen empathy, and broaden global understanding.",
      isFree: true,
      imageUrl: "/age-group/18+.webp",
    },
    {
      label: "Beginner Language Learners",
      desp: "Engaging multi linguist stories designed to help beginners learn and use a new language with ease and confidence.",
      isFree: true,
      imageUrl: "/age-group/beginner.webp",
    },
    {
      label: "Intermediate Language Learners",
      desp: "Multi linguist and graded stories that build vocabulary, improve grammar, and deepen cultural understanding for confident learning.",
      isFree: true,
      imageUrl: "/age-group/intermediate.webp",
    },
    {
      label: "Advanced Language Learners",
      desp: "Immerse in rich, culturally diverse stories designed to advance fluency, foster natural expression, and master nuanced communication skills.",
      isFree: true,
      imageUrl: "/age-group/advanced.webp",
    },
  ];

  const labels = OptionsList.map((o) => o.label) as [string, ...string[]];
  const ageGroupSchema = z.enum(labels);

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string) => {
    const res = ageGroupSchema.safeParse(val);
    const isValid = res.success;
    const errorMessage = isValid
      ? null
      : res.error.issues[0]?.message ?? "Invalid value";
    setError(errorMessage);
    return isValid;
  };

  const OnUserSelect = (item: OptionField) => {
    setSelectedOption(item.label);
    setTouched(true);
    const isValid = validate(item.label);
    userSelection?.({
      fieldValue: item.label,
      fieldName: "ageGroup",
      isValid,
    });
  };

  useEffect(() => {
    // Initial validation state
    userSelection?.({
      fieldValue: selectedOption,
      fieldName: "ageGroup",
      isValid: false,
    });
  }, [selectedOption, userSelection]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-lg font-semibold tracking-wide">
          3. AGE GROUP
        </label>
        <p className="text-sm text-muted-foreground">
          Select the appropriate age group for your story.
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
                touched && !selectedOption && "border-destructive"
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

export default AgeGroup;
