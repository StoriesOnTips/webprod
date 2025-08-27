// app/create-story/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import StorySubjectInput from "./_components/StorySubjectInput";
import StoryType from "./_components/StoryType";
import AgeGroup from "./_components/AgeGroup";
import ImageStyle from "./_components/ImageStyle";
import CreateStoryForm from "./_components/CreateStoryForm";
import GenreSelect from "./_components/GenreSelect";
import LanguageSelect from "./_components/LanguageSelect";

export default async function CreateStoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 mb-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Create Your AI Story
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Follow the steps below to create a personalized, educational story
            powered by AI. Each story is crafted to help you learn new languages
            while enjoying captivating narratives.
          </p>
        </div>
      </div>

      {/* Story Creation Form */}
      <div className="flex-1 overflow-hidden">
        <CreateStoryForm>
          <StorySubjectInput />
          <StoryType />
          <AgeGroup />
          <ImageStyle />
          <LanguageSelect />
          <GenreSelect />
        </CreateStoryForm>
      </div>
    </div>
  );
}
