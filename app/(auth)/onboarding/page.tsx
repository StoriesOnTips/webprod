import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { checkUserOnboarding } from "@/lib/actions/onboarding-actions";
import OnboardingForm from "../_components/OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has already completed onboarding
  const isOnboarded = await checkUserOnboarding(userId);

  if (isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-lg shadow-lg border overflow-hidden">
          <div className="bg-primary px-8 py-6 text-primary-foreground">
            <h1 className="text-3xl font-bold mb-2">Welcome to StoriesonTips!</h1>
            <p className="text-primary-foreground/80">
              Let's personalize your language learning journey with stories
            </p>
          </div>

          <div className="p-8">
            <OnboardingForm userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}