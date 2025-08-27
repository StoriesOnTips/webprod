// app/(story-viewer)/_components/story-stats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface StoryStatsProps {
  chaptersCount: number;
  currentProgress: number;
  language1: string;
  language2: string;
  genre: string;
  ageGroup: string;
}

export default function StoryStats({
  chaptersCount,
  currentProgress,
  language1,
  language2,
  genre,
  ageGroup,
}: StoryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Chapters</p>
              <p className="text-2xl font-bold">{chaptersCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {language1}
            </Badge>
            <span className="text-sm">→</span>
            <Badge variant="outline" className="text-xs">
              {language2}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Languages</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Genre</p>
            <p className="text-lg font-semibold">{genre}</p>
            <Badge variant="secondary" className="text-xs mt-1">
              {ageGroup}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
