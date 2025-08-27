"use client";

import { useState, useEffect } from "react";
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

interface ImageStyleProps {
  userSelection?: (data: {
    fieldName: string;
    fieldValue: string;
    isValid: boolean;
  }) => void;
}

function ImageStyle({ userSelection }: ImageStyleProps) {
  const OptionsList: OptionField[] = [
    {
      label: "3D Cartoon",
      imageUrl: "/image-style/3dcartoon.webp",
      isFree: true,
      desp: "Vibrant and lively 3D animated illustrations with rich colors and depth.",
    },
    {
      label: "Paper Cut",
      imageUrl: "/image-style/papercut.webp",
      isFree: true,
      desp: "Unique paper-cut style illustrations with layered textures and artistic charm.",
    },
    {
      label: "Water Color",
      imageUrl: "/image-style/watercolor.webp",
      isFree: true,
      desp: "Soft and dreamy watercolor paintings with gentle, flowing artistic strokes.",
    },
    {
      label: "Pixel Style",
      imageUrl: "/image-style/pixelstyle.webp",
      isFree: true,
      desp: "Nostalgic pixel-art illustrations with retro gaming charm and character.",
    },
  ];

  const labels = OptionsList.map((o) => o.label) as [string, ...string[]];
  const imageStyleSchema = z.enum(labels);

  const [selectedOption, setSelectedOption] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string) => {
    const res = imageStyleSchema.safeParse(val);
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
      fieldName: "imageStyle",
      isValid,
    });
  };

  useEffect(() => {
    // Initial validation state - only call once on mount
    userSelection?.({
      fieldValue: "",
      fieldName: "imageStyle",
      isValid: false,
    });
  }, [userSelection]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-lg font-semibold tracking-wide">
          4. IMAGE STYLE
        </label>
        <p className="text-sm text-muted-foreground">
          Choose the visual style for your story illustrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OptionsList.map((item, index) => {
          const isActive = selectedOption === item.label;
          return (
            <Card
              key={item.label || index}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                "border-2 hover:border-primary/20 h-full",
                isActive
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:bg-muted/50",
                touched && error && "border-destructive"
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
              <CardContent className="p-4 h-full">
                <div className="flex flex-col gap-3 h-full">
                  <div className="relative">
                    <Image
                      src={
                        item.imageUrl || "/placeholder.svg?height=120&width=160"
                      }
                      alt={item.label}
                      width={160}
                      height={120}
                      className="w-full h-28 rounded-lg object-cover border"
                      priority={index < 2}
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

                  <div className="flex flex-col gap-1 flex-1">
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

export default ImageStyle;
