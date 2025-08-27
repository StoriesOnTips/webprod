'use server';

import { eq, and, gte, sql } from 'drizzle-orm';
import { db } from '@/config/db';
import { revalidatePath } from 'next/cache';
import { StoryData, Users } from '@/config/schema';

export type LanguageStreak = {
  [language: string]: {
    totalStories: number;
    currentWeekStories: number;
    weeklyStreak: number;
    lastStoryDate: string;
  };
};

export interface StoryByLanguage {
  month: string | null;
  language: string | null;
  count: number;
}

export interface DashboardData {
  motherTongue: string;
  firstName: string;
  lastName: string;
  totalStoriesCreated: number;
  monthlyStoriesCreated: number;
  storiesByLanguage: StoryByLanguage[];
  languageStreaks: LanguageStreak;
}

export async function getDashboardData(clerkUserId: string): Promise<DashboardData | null> {
  try {
    // Get user data
    const user = await db
      .select({
        motherTongue: Users.motherTongue,
        firstName: Users.firstName,
        lastName: Users.lastName,
        totalStoriesCreated: Users.totalStoriesCreated,
        monthlyStoriesCreated: Users.monthlyStoriesCreated,
        languageStreaks: Users.languageStreaks,
        lastMonthlyReset: Users.lastMonthlyReset,
      })
      .from(Users)
      .where(eq(Users.clerkUserId, clerkUserId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const userData = user[0];

    // Check if monthly reset is needed
    const now = new Date();
    const lastReset = new Date(userData.lastMonthlyReset);
    const shouldResetMonthly = now.getMonth() !== lastReset.getMonth() || 
                              now.getFullYear() !== lastReset.getFullYear();

    if (shouldResetMonthly) {
      await resetMonthlyStats(clerkUserId);
      userData.monthlyStoriesCreated = 0;
    }

    // Get stories by language with month grouping - PostgreSQL compatible
    const storiesByLanguage = await db
      .select({
        language: StoryData.language2,
        month: sql<string>`TO_CHAR(${StoryData.createdAt}, 'Mon YYYY')`.as('month'),
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(StoryData)
      .where(eq(StoryData.clerkUserId, clerkUserId))
      .groupBy(StoryData.language2, sql`TO_CHAR(${StoryData.createdAt}, 'Mon YYYY')`);

    // Get current month stories (actual count from database)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyStories = await db
      .select({ count: sql<number>`COUNT(*)`.as('count') })
      .from(StoryData)
      .where(
        and(
          eq(StoryData.clerkUserId, clerkUserId),
          gte(StoryData.createdAt, currentMonth)
        )
      );

    const actualMonthlyCount = monthlyStories[0]?.count || 0;

    return {
      motherTongue: userData.motherTongue || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      totalStoriesCreated: userData.totalStoriesCreated || 0,
      monthlyStoriesCreated: actualMonthlyCount,
      storiesByLanguage: storiesByLanguage || [],
      languageStreaks: (userData.languageStreaks as LanguageStreak) || {},
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

export async function updateLanguageStreak(
  clerkUserId: string, 
  language: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    // Calculate week start (Monday = 0, Sunday = 6)
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday becomes 6 days from Monday
    const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
    
    // Get current user data
    const user = await db
      .select({
        languageStreaks: Users.languageStreaks,
        totalStoriesCreated: Users.totalStoriesCreated,
        monthlyStoriesCreated: Users.monthlyStoriesCreated,
      })
      .from(Users)
      .where(eq(Users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (user.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const currentStreaks: LanguageStreak = (user[0].languageStreaks as LanguageStreak) || {};
    const langData = currentStreaks[language] || {
      totalStories: 0,
      currentWeekStories: 0,
      weeklyStreak: 0,
      lastStoryDate: now.toISOString().split('T')[0]
    };
    
    // Check if it's a new week
    const lastStoryDate = new Date(langData.lastStoryDate);
    // Calculate last story week start (Monday = 0, Sunday = 6)
    const lastStoryDayOfWeek = lastStoryDate.getDay();
    const lastStoryDaysFromMonday = lastStoryDayOfWeek === 0 ? 6 : lastStoryDayOfWeek - 1;
    const lastStoryWeekStart = new Date(
      lastStoryDate.getFullYear(), 
      lastStoryDate.getMonth(), 
      lastStoryDate.getDate() - lastStoryDaysFromMonday
    );
    
    if (currentWeekStart.getTime() > lastStoryWeekStart.getTime()) {
      // New week - check if previous week had ≥2 stories for streak
      if (langData.currentWeekStories >= 2) {
        langData.weeklyStreak += 1;
      } else {
        langData.weeklyStreak = 0; // Reset streak if didn't meet goal
      }
      langData.currentWeekStories = 1;
    } else {
      langData.currentWeekStories += 1;
    }
    
    langData.totalStories += 1;
    langData.lastStoryDate = now.toISOString().split('T')[0];
    
    currentStreaks[language] = langData;
    
    // Update user record
    await db
      .update(Users)
      .set({ 
        languageStreaks: currentStreaks,
        totalStoriesCreated: (user[0].totalStoriesCreated || 0) + 1,
        monthlyStoriesCreated: (user[0].monthlyStoriesCreated || 0) + 1,
        updatedAt: now
      })
      .where(eq(Users.clerkUserId, clerkUserId));

    // Revalidate dashboard
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error updating language streak:', error);
    return { success: false, error: 'Failed to update streak' };
  }
}

export async function resetMonthlyStats(clerkUserId: string): Promise<void> {
  try {
    const now = new Date();
    
    await db
      .update(Users)
      .set({
        monthlyStoriesCreated: 0,
        lastMonthlyReset: now,
        updatedAt: now,
      })
      .where(eq(Users.clerkUserId, clerkUserId));

    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Error resetting monthly stats:', error);
  }
}

export async function getLanguageStreaks(clerkUserId: string): Promise<LanguageStreak | null> {
  try {
    const user = await db
      .select({ languageStreaks: Users.languageStreaks })
      .from(Users)
      .where(eq(Users.clerkUserId, clerkUserId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return (user[0].languageStreaks as LanguageStreak) || {};
  } catch (error) {
    console.error('Error fetching language streaks:', error);
    return null;
  }
}

export async function getUserStats(clerkUserId: string) {
  try {
    const user = await db
      .select({
        totalStoriesCreated: Users.totalStoriesCreated,
        monthlyStoriesCreated: Users.monthlyStoriesCreated,
        credits: Users.credits,
      })
      .from(Users)
      .where(eq(Users.clerkUserId, clerkUserId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}