import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Quote, Heart } from "lucide-react";
import MoralClient from "./MoralClient";

interface MoralSectionProps {
  moral: string | { [language: string]: string } | undefined;
  preferredLanguage?: string;
  language1: string;
  language2: string;
}

// Helper function to get moral text in preferred language
function getMoralForLanguage(
  moral: string | { [language: string]: string } | undefined,
  preferredLanguage?: string,
  language1?: string,
  language2?: string
): string | null {
  if (!moral) return null;

  // If moral is a string, return it directly
  if (typeof moral === "string") {
    return moral.trim() || null;
  }

  // If moral is an object (bilingual), get the preferred language
  if (typeof moral === "object" && moral !== null) {
    // Try preferred language first
    if (preferredLanguage && moral[preferredLanguage]) {
      return moral[preferredLanguage].trim() || null;
    }

    // Try language1 (known language)
    if (language1 && moral[language1]) {
      return moral[language1].trim() || null;
    }

    // Try language2 (target language)
    if (language2 && moral[language2]) {
      return moral[language2].trim() || null;
    }

    // Get first available value
    const values = Object.values(moral);
    if (values.length > 0 && values[0]) {
      return values[0].trim() || null;
    }
  }

  return null;
}

export default function MoralSection({
  moral,
  preferredLanguage,
  language1,
  language2,
}: MoralSectionProps) {
  const moralText = getMoralForLanguage(
    moral,
    preferredLanguage,
    language1,
    language2
  );

  if (!moralText) {
    return (
      <Card className="bg-card border-border backdrop-blur-sm shadow-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Heart className="size-5 text-destructive" />
            Story Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="size-16 mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              No moral available
            </h3>
            <p className="text-center max-w-md">
              Every story has a lesson to discover, even if it's not explicitly
              stated. What did you learn from this tale?
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border backdrop-blur-sm shadow-lg w-full mx-auto">
      <CardHeader>
        <div className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground text-2xl md:text-3xl font-bold">
            <Heart className="size-6 text-destructive" />
            <span className="bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent">
              Moral of the Story
            </span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
            <BookOpen className="size-4" />
            Every story teaches us something valuable
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Content */}
          <div className="relative p-8 md:p-12">
            <blockquote className="text-lg md:text-xl font-medium text-center leading-relaxed text-foreground select-all italic">
              "{moralText}"
            </blockquote>

            {/* Interactive actions */}
            <div className="mt-8">
              <MoralClient
                moral={moralText}
                language1={language1}
                language2={language2}
                preferredLanguage={preferredLanguage}
              />
            </div>
          </div>
        </div>

        {/* Learning prompt */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">
            🤔 Reflect on this
          </h4>
          <p className="text-sm text-muted-foreground">
            How can you apply this lesson to your own life? Think about
            situations where this wisdom might be helpful.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
