"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { Users } from "@/config/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { hashEmail } from "@/lib/utils";

// Input validation schema
const UserDataSchema = z.object({
  userEmail: z.string().email("Invalid email format"),
  userName: z.string().min(1, "Username is required").max(100, "Username too long"),
  userImage: z.string().url().optional().nullable().transform(val => val === "" ? null : val),
});

// Response types
export interface UserDetail {
  userEmail: string;
  userName: string;
  userImage: string | null;
  credits: number;
  onboardingCompleted: boolean;
}

export interface ActionResult<T = UserDetail> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

/**
 * Create new user in database
 */
export async function createUser(userData: {
  userEmail: string;
  userName: string;
  userImage?: string;
}): Promise<ActionResult<UserDetail>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized - Please sign in to continue",
      };
    }

    const validationResult = UserDataSchema.safeParse(userData);

    if (!validationResult.success) {
      return {
        success: false,
        message: "Invalid input data",
        errors: validationResult.error.issues.map((err) => err.message),
      };
    }

    const { userEmail, userName, userImage } = validationResult.data;

    const newUser = await db
      .insert(Users)
      .values({
        userEmail,
        userName,
        clerkUserId: userId,
        userImage: userImage || null,
        credits: 3,
        onboardingCompleted: false,
        firstName: "",
        lastName: "",
        motherTongue: "",
        preferredAgeGroup: "",
        primaryGoal: "",
        storyFrequency: "",
        preferredImageStyle: "",
      })
      .returning({
        userEmail: Users.userEmail,
        userName: Users.userName,
        userImage: Users.userImage,
        credits: Users.credits,
        onboardingCompleted: Users.onboardingCompleted,
      });

    if (!newUser || newUser.length === 0) {
      return {
        success: false,
        message: "Failed to create user account. Please try again.",
      };
    }

    const createdUser = newUser[0];
    revalidatePath("/");

    return {
      success: true,
      message: "User account created successfully",
      data: createdUser,
    };
  } catch (error) {
    console.error("Error in createUser server action:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      userData: { userEmailHash: hashEmail(userData.userEmail), userName: userData.userName },
    });

    return {
      success: false,
      message: "Internal server error. Please try again later.",
    };
  }
}

/**
 * Fetch existing user from database
 */
export async function fetchUser(userEmail: string): Promise<ActionResult<UserDetail>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized - Please sign in to continue",
      };
    }

    const emailSchema = z.string().email("Invalid email format");
    const validationResult = emailSchema.safeParse(userEmail);

    if (!validationResult.success) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    const user = await db
      .select({
        userEmail: Users.userEmail,
        userName: Users.userName,
        userImage: Users.userImage,
        credits: Users.credits,
        onboardingCompleted: Users.onboardingCompleted,
      })
      .from(Users)
      .where(eq(Users.userEmail, userEmail))
      .limit(1);

    if (user.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User data retrieved successfully",
      data: user[0],
    };
  } catch (error) {
    console.error("Error in fetchUser server action:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      userEmailHash: hashEmail(userEmail),
    });
    return {
      success: false,
      message: "Failed to fetch user data",
    };
  }
}

/**
 * Update user credits
 */
export async function updateUserCredits(
  userEmail: string,
  creditChange: number
): Promise<ActionResult<UserDetail>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        message: "Unauthorized - Please sign in to continue",
      };
    }

    const emailSchema = z.string().email("Invalid email format");
    const creditSchema = z.number().int("Credits must be a whole number");

    const emailValidation = emailSchema.safeParse(userEmail);
    const creditValidation = creditSchema.safeParse(creditChange);

    if (!emailValidation.success || !creditValidation.success) {
      return {
        success: false,
        message: "Invalid input data",
      };
    }

    // First, verify the user exists and get their current credits using clerkUserId
    const userResult = await db
      .select({
        credits: Users.credits,
        userEmail: Users.userEmail,
      })
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .limit(1);

    if (userResult.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Verify that the provided email matches the authenticated user's email
    if (userResult[0].userEmail !== userEmail) {
      return {
        success: false,
        message: "Unauthorized - Email does not match authenticated user",
      };
    }

    const currentCredit = userResult[0].credits;
    const newCredit =
      creditChange > 0
        ? currentCredit + creditChange
        : Math.max(0, currentCredit + creditChange);

    // Update using the same verified identifier (clerkUserId) instead of userEmail
    const updatedUser = await db
      .update(Users)
      .set({
        credits: newCredit,
      })
      .where(eq(Users.clerkUserId, userId))
      .returning({
        userEmail: Users.userEmail,
        userName: Users.userName,
        userImage: Users.userImage,
        credits: Users.credits,
        onboardingCompleted: Users.onboardingCompleted,
      });

    if (updatedUser.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/");

    return {
      success: true,
      message: `Credits ${creditChange > 0 ? "added" : "used"} successfully`,
      data: updatedUser[0],
    };
  } catch (error) {
    console.error("Error in updateUserCredits server action:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      userEmailHash: hashEmail(userEmail),
      creditChange,
    });
    return {
      success: false,
      message: "Failed to update credits",
    };
  }
}