'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SSOCallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we complete your authentication.
          </p>
        </CardContent>
      </Card>
      
      {/* Hidden callback handler */}
      <div className="sr-only">
        <AuthenticateWithRedirectCallback />
      </div>
    </div>
  )
}