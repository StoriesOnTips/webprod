import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Eye, Clock, Star, BookOpen, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryOutputItem {
  bookTitle: string;
  text?: string;
}

interface Story {
  id: number;
  storyType: string;
  ageGroup: string;
  coverImage: string;
  imageStyle: string;
  userEmail: string;
  userImage: string;
  userName: string;
  output: StoryOutputItem[];
  storyId: string;
  storySubject: string;
  createdAt: string | undefined;
}

interface StoryItemProps {
  story: Story;
}

export default function StoryItemCard({ story }: StoryItemProps) {
  const estimatedReadTime = (() => {
    // Use story content if available, otherwise fallback to storySubject
    const content = story?.output?.[0]?.text || story?.storySubject || "";
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(3, Math.ceil(wordCount / 200));
  })();

  return (
    <div className="group relative">
      
      <Card className="relative overflow-hidden border border-border/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 group-hover:translate-y-[-4px] bg-card/95 backdrop-blur-sm">
        <CardContent className="p-0 h-[440px]">
          <Link href={`/view-story/${story?.storyId}`} className="block h-full">
            <div className="relative h-full flex flex-col">
              {/* Enhanced Image Section */}
              <div className="relative h-[260px] overflow-hidden">
                <Image
                  alt={story?.output?.[0]?.bookTitle || "Story Cover"}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                  src={story?.coverImage || "/placeholder.svg"}
                  width={500}
                  height={500}
                  priority={false}
                  loading="lazy"
                />
                
                {/* Enhanced overlay gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/40"></div>
                
                {/* Interactive hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-secondary/30 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                {/* Enhanced badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <Badge 
                    variant="secondary"
                    className="bg-card/90 dark:bg-card/95 backdrop-blur-sm border-border/50 text-foreground font-medium shadow-sm"
                  >
                    <User className="w-3 h-3 mr-1" />
                    {story?.ageGroup || "All Ages"}
                  </Badge>
                </div>

                {/* Enhanced reading time */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 dark:bg-black/80 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                  <Clock className="w-3 h-3" />
                  {estimatedReadTime} min read
                </div>

                {/* Story type indicator */}
                <div className="absolute bottom-4 left-4">
                  <Badge 
                    className={cn(
                      "bg-primary/90 dark:bg-primary/95 text-primary-foreground font-medium shadow-lg backdrop-blur-sm",
                      "hover:bg-primary transition-colors duration-300"
                    )}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    {story?.storyType || "Story"}
                  </Badge>
                </div>
              </div>

              {/* Enhanced Content Section */}
              <div className="flex-1 p-6 flex flex-col justify-between bg-card/95 dark:bg-card/98 backdrop-blur-sm border-t border-border/30">
                <div className="space-y-3 flex-1">
                  <div className="space-y-2">
                    <h3 className="text-foreground font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {story?.output?.[0]?.bookTitle || "Untitled Story"}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {story?.storySubject || "A magical adventure awaits in this enchanting tale..."}
                    </p>
                  </div>

                  {/* Creation date */}
                  {story?.createdAt && (() => {
                    const date = new Date(story.createdAt);
                    return !isNaN(date.getTime()) ? (
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>{date.toLocaleDateString()}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Enhanced Action Section */}
                <div className="flex justify-between items-center pt-4 border-t border-border/30">
                  <div className="flex items-center gap-3">
                    {/* TODO: Implement real rating system */}
                    {/* <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Star className="w-4 h-4 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground ml-1">4.0</span>
                    </div> */}
                  </div>
                  
                  <Button
                    type="button"
                    className="group/btn bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground border-0 shadow-md hover:shadow-lg transition-all duration-300 px-4 py-2 rounded-md text-sm font-medium inline-flex items-center focus-visible:ring-2 focus-visible:ring-primary/20"
                    aria-label={`Read story: ${story?.output?.[0]?.bookTitle || "Untitled Story"}`}
                  >
                    <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                    Read Story
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}