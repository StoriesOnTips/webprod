// app/view-story/[id]/components/StoryLoadingSkeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function StoryLoadingSkeleton() {
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-center">
          <Skeleton className="h-8 w-64 bg-slate-800" />
        </div>
        <div className="flex items-center justify-center mt-2">
          <Skeleton className="h-4 w-48 bg-slate-800" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Story Display Area Skeleton */}
        <div className="relative mx-auto mb-6" style={{ width: "min(100%, 600px)", height: "700px" }}>
          <Skeleton className="w-full h-full rounded-lg bg-slate-800" />
        </div>

        {/* Navigation Controls Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-24 bg-slate-800" />

          <div className="text-center">
            <Skeleton className="h-4 w-24 mx-auto mb-2 bg-slate-800" />
            <Skeleton className="h-2 w-48 bg-slate-800" />
          </div>

          <Skeleton className="h-12 w-24 bg-slate-800" />
        </div>

        {/* Audio Controls Skeleton */}
        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-32 bg-slate-700" />
              <Skeleton className="h-8 w-8 bg-slate-700" />
              <Skeleton className="h-8 w-8 bg-slate-700" />
            </div>
            <Skeleton className="h-8 w-8 bg-slate-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
