import { Metadata } from "next";
import Link from "next/link";
import { getUserStories } from "@/lib/actions/story-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StoryItemCard } from "./_components/story-item-card";
import { Suspense } from "react";


export const metadata: Metadata = {
  title: "My Stories",
  description: "View and manage your created stories",
};

// Loading skeleton component
function StoriesGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl  bg-muted-foreground p-4 shadow-sm"
        >
          <div className="aspect-[4/3] w-full rounded-lg " />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 rounded" />
            <div className="h-3 w-1/2 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full" />
              <div className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Error boundary component
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 p-3">
        </div>
        <h3 className="text-lg font-semibold text-red-900">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-red-700">{message}</p>
        <Link
          href="/my-stories"
          className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">
          No stories created yet
        </h3>
        <p className="mt-2 text-muted-foreground">
          Start creating your first story to see it here.
        </p>
        <Link
          href="/create-story"
          className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/60"
        >
          Create Your First Story
        </Link>
      </div>
    </div>
  );
}

// Stories grid component
async function StoriesGrid() {
  try {
    const stories = await getUserStories(20); // Get up to 20 stories

    if (!stories || stories.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryItemCard key={story.storyId} story={story} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to load stories:", error);
    return (
      <ErrorMessage
        message={
          error instanceof Error
            ? error.message
            : "Failed to load your stories. Please try again."
        }
      />
    );
  }
}

// Main page component
export default async function MyStoriesPage() {
  // Check authentication at the page level
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-4xl text-foreground font-semibold">My Stories</h1>
            <p className="mt-2 text-gray-600">
              Manage and view all your created stories
            </p>
          </div>
          <Link
            href="/create-story"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary focus:ring-offset-2"
          >
            New Story
          </Link>
        </div>
      </div>

      {/* Stories grid with loading state */}
      <Suspense fallback={<StoriesGridSkeleton />}>
        <StoriesGrid />
      </Suspense>
    </div>
  );
}
