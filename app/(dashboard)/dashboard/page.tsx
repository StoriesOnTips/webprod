import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import DashboardContent from "./_components/DashboardContent"
import DashboardSkeleton from "./_components/DashboardSkeleton"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }
  
  return (
    <div className="min-h-[calc(100vh-4rem)] ">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userId={userId} />
      </Suspense>
    </div>
  )
}
