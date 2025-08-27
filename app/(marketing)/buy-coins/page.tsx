import React from "react";
import { Metadata } from "next";
import BuyCredits from "./_components/BuyCredits";

export const metadata: Metadata = {
  title: "Buy Coins | StoriesOnTips",
  description: "Purchase credits to unlock AI-powered story generation and language learning features",
  keywords: [
    "buy credits", 
    "payment", 
    "subscription", 
    "buy coins", 
    "credits", 
    "AI stories", 
    "language learning"
  ],
  openGraph: {
    title: "Buy Coins | StoriesOnTips",
    description: "Purchase credits to unlock AI-powered story generation and language learning features",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Coins | StoriesOnTips",
    description: "Purchase credits to unlock AI-powered story generation and language learning features",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BuyCreditsPage() {
  return (
    <main className="min-h-screen">
      <BuyCredits />
    </main>
  );
}