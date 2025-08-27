import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StoryCardSkeleton() {
  return (
    <div className="group relative">
      <Card className="relative overflow-hidden border border-border/50 rounded-2xl shadow-lg bg-card/95 backdrop-blur-sm">
        <CardContent className="p-0 h-[440px]">
          <div className="relative h-full flex flex-col">
            {/* Image Section Skeleton */}
            <div className="relative h-[260px] overflow-hidden bg-muted/50">
              <Skeleton className="w-full h-full" />
              
              {/* Badge skeletons */}
              <div className="absolute top-4 left-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              
              <div className="absolute top-4 right-4">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              
              <div className="absolute bottom-4 left-4">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            {/* Content Section Skeleton */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-3 flex-1">
                <div className="space-y-2">
                  {/* Title skeleton */}
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  
                  {/* Description skeleton */}
                  <div className="space-y-1 pt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>

                {/* Date skeleton */}
                <Skeleton className="h-3 w-24" />
              </div>

              {/* Action Section Skeleton */}
              <div className="flex justify-between items-center pt-4 border-t border-border/30">
                <div className="flex items-center gap-1">
                  {/* Star rating skeleton */}
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-4 rounded" />
                  ))}
                  <Skeleton className="h-3 w-8 ml-2" />
                </div>
                
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(count)].map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <Card className="relative overflow-hidden border border-border/50 bg-card/95 shadow-xl">
      <CardContent className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Content Section Skeleton */}
          <div className="space-y-4 flex-1">
            <Skeleton className="h-8 w-40 rounded-full" />
            
            <div className="space-y-2">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-10 w-40 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>

          {/* Action Section Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Skeleton className="h-12 w-40" />
          </div>
        </div>

        {/* Stats Bar Skeleton */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="relative p-4 rounded-xl bg-card/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyStateSkeleton() {
  return (
    <Card className="mt-8 border border-border/50 bg-card/95 shadow-lg">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <Skeleton className="w-80 h-80 rounded-lg" />
          <div className="space-y-4 max-w-md">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-5 w-72 mx-auto" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}