
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, Tag, User } from "lucide-react";
import type { StoryWithMetadata } from "@/lib/actions/story-actions";

interface StoryMetadataProps {
  story: StoryWithMetadata;
}

const LANGUAGE_DISPLAY: Record<string, string> = {
  english: "English",
  spanish: "Español",
  french: "Français",
  german: "Deutsch",
  italian: "Italiano",
  portuguese: "Português",
  chinese: "中文",
  japanese: "日本語",
  korean: "한국어",
  arabic: "العربية",
  hindi: "हिन्दी",
  russian: "Русский",
  dutch: "Nederlands",
  swedish: "Svenska",
  norwegian: "Norsk",
  danish: "Dansk",
  polish: "Polski",
  turkish: "Türkçe",
  greek: "Ελληνικά",
  hebrew: "עברית",
};

export default function StoryMetadata({ story }: StoryMetadataProps) {
  const getLanguageDisplay = (lang: string) =>
    LANGUAGE_DISPLAY[lang.toLowerCase()] || lang;

  return (
    <div className="space-y-4">
      {/* Story Description */}
      <p className="text-muted-foreground text-sm max-w-2xl">
        {story.storySubject}
      </p>

      {/* Metadata Pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          <Tag className="h-3 w-3" />
          {story.genre}
        </Badge>

        <Badge variant="secondary" className="gap-1">
          <User className="h-3 w-3" />
          {story.ageGroup}
        </Badge>

        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {story.storyType}
        </Badge>

        {story.language1 && story.language2 && (
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            {getLanguageDisplay(story.language1)} →{" "}
            {getLanguageDisplay(story.language2)}
          </Badge>
        )}
      </div>

      {/* Chapter Count */}
      <div className="text-sm text-muted-foreground">
        {story.output?.chapters?.length ?? 0} chapters • Created by{" "}
        <span className="text-foreground font-medium">{story.userName}</span> on{" "}
        {(() => {
          const date = new Date(story.createdAt);
          return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown date';
        })()}
      </div>
    </div>
  );
}
