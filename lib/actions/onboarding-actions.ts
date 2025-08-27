"use server";

import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { Users } from "@/config/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface OnboardingData {
  firstName: string;
  lastName: string;
  motherTongue: string;
  preferredAgeGroup: string;
  primaryGoal: string;
  storyFrequency: string;
  preferredImageStyle: string;
}

export async function completeOnboarding(
  clerkUserId: string,
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId || userId !== clerkUserId) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName", 
      "motherTongue",
      "preferredAgeGroup",
      "primaryGoal",
      "storyFrequency",
      "preferredImageStyle",
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof OnboardingData]?.trim()) {
        return { success: false, error: `${field} is required` };
      }
    }

    const now = new Date();

    // Update user with onboarding data
    const result = await db
      .update(Users)
      .set({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        userName: `${data.firstName.trim()} ${data.lastName.trim()}`,
        motherTongue: data.motherTongue,
        preferredAgeGroup: data.preferredAgeGroup,
        primaryGoal: data.primaryGoal,
        storyFrequency: data.storyFrequency,
        preferredImageStyle: data.preferredImageStyle,
        onboardingCompleted: true,
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(Users.clerkUserId, clerkUserId))
      .returning({ id: Users.id });

    if (result.length === 0) {
      return { success: false, error: "User not found" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return {
      success: false,
      error: "Failed to complete onboarding. Please try again.",
    };
  }
}

export async function checkUserOnboarding(clerkUserId: string): Promise<boolean> {
  try {
    const user = await db
      .select({
        onboardingCompleted: Users.onboardingCompleted,
      })
      .from(Users)
      .where(eq(Users.clerkUserId, clerkUserId))
      .limit(1);

    return user.length > 0 && user[0].onboardingCompleted;
  } catch (error) {
    console.error("Error checking user onboarding:", error);
    return false;
  }
}