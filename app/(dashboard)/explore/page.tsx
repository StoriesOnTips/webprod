import { Card, CardContent } from '@/components/ui/card';
import React from 'react'

const explore = () => {
  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-xl md:text-2xl lg:text-4xl text-foreground font-semibold">Story Library</h1>
      <p className="text-muted-foreground font-medium">Explore some free stories in our library for better learning and gaining knowledge</p>

      <div className="container mx-auto px-4 pt-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
              <div className="space-y-4 max-w-lg">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Coming Soon
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Free stories are not available yet — check back soon!
                </p>
                <p className="text-sm text-muted-foreground">
                  We're working hard to bring you amazing free content. Stay tuned for updates!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}

export default explore;