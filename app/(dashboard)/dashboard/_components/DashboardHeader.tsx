"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { UserDetailContext, UserDetailContextType } from "@/app/_context/UserDetailContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, ArrowRight, TrendingUp, BookOpen, Heart, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserStats } from "@/lib/actions/dashboard-actions";

// Types for stats
interface DashboardStats {
  totalStories: number;
  thisMonth: number;
  favorites: number;
}
export default function DashboardHeader() {
  const context = useContext(UserDetailContext);
  const router = useRouter();
  if (!context) {
    return null;
  }
  const { userDetail, setUserDetail } = context;

  // Stats state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        // Require a logged-in user
        const clerkUserId = userDetail?.id;
        if (!clerkUserId || typeof clerkUserId !== 'string') {
          throw new Error("Missing user ID for stats fetch");
        }

        const data = await getUserStats(clerkUserId);
        if (!data) {
          throw new Error("No stats returned");
        }
        if (mounted) {
          setStats({
            totalStories: data.totalStoriesCreated || 0,
            thisMonth: data.monthlyStoriesCreated || 0,
            favorites: 0,
          });
        }
      } catch (err) {
        if (mounted) setStatsError("Failed to load stats");
        if (mounted) console.error("Stats load error:", err);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, [userDetail?.id]);

  const handleBuyCoinClick = () => {
    router.push("/buy-coins");
  };

  const creditStatus = userDetail?.credits || 0;
  const isLowBalance = creditStatus <= 5;
  const isCriticalBalance = creditStatus <= 2;

  return (
    <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-xl dark:shadow-2xl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 dark:from-primary/20 dark:to-secondary/20"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse dark:opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000 dark:opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full filter blur-3xl animate-pulse delay-500"></div>
      </div>

      <CardContent className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Content Section */}
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-foreground text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Your Creative Hub
            </div>
            
            <div className="space-y-2">
              <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight tracking-tight">
                My Stories
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Discover, create, and manage your AI-generated stories in one beautiful place.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/50 dark:bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="relative">
                  <Coins className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    creditStatus > 10 ? "text-green-500" : 
                    creditStatus > 5 ? "text-yellow-500" : "text-red-500"
                  )} />
                </div>
                <span className="font-semibold text-foreground">
                  {creditStatus} coins left
                </span>
                {creditStatus > 0 && (
                  <Image 
                    src="/coin.webp" 
                    alt="coin credits" 
                    width={20} 
                    height={20} 
                    className="ml-1 animate-pulse" 
                  />
                )}
              </div>
              
              {isLowBalance && (
                <Badge 
                  variant={isCriticalBalance ? "destructive" : "secondary"}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm font-medium animate-pulse",
                    isCriticalBalance 
                      ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" 
                      : "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                  )}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {isCriticalBalance ? "Critical Balance" : "Low Balance"}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Section */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Button
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0 px-8 py-3 h-12"
              onClick={handleBuyCoinClick}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Coins className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Buy More Coins
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Bar */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group relative p-4 rounded-xl bg-card/30 dark:bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Stories</p>
                  <p className="text-foreground font-bold text-xl min-w-[2.5ch]">
                    {statsLoading ? (
                      <span className="inline-block w-5 h-5 align-middle animate-pulse bg-muted rounded" />
                    ) : statsError ? (
                      "—"
                    ) : (
                      stats?.totalStories ?? 0
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group relative p-4 rounded-xl bg-card/30 dark:bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20 border border-green-500/20">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">This Month</p>
                  <p className="text-foreground font-bold text-xl min-w-[2.5ch]">
                    {statsLoading ? (
                      <span className="inline-block w-5 h-5 align-middle animate-pulse bg-muted rounded" />
                    ) : statsError ? (
                      "—"
                    ) : (
                      stats?.thisMonth ?? 0
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group relative p-4 rounded-xl bg-card/30 dark:bg-card/50 border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 dark:bg-red-500/20 border border-red-500/20">
                  <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Favorites</p>
                  <p className="text-foreground font-bold text-xl min-w-[2.5ch]">
                    {statsLoading ? (
                      <span className="inline-block w-5 h-5 align-middle animate-pulse bg-muted rounded" />
                    ) : statsError ? (
                      "—"
                    ) : (
                      stats?.favorites ?? 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}