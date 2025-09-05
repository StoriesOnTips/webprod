// app/buy-coins/page.tsx
import React from "react";
import { Metadata } from "next";
import BuyCredits from "./_components/BuyCredits";

export const metadata: Metadata = {
 title: "Buy Coins | StoriesOnTips",
 description: "Purchase coins to unlock AI-powered story generation and language learning features",
 keywords: [
   "buy coins", 
   "payment", 
   "subscription", 
   "coins", 
   "AI stories", 
   "language learning"
 ],
 openGraph: {
   title: "Buy Coins | StoriesOnTips",
   description: "Purchase coins to unlock AI-powered story generation and language learning features",
   type: "website",
 },
 twitter: {
   card: "summary_large_image",
   title: "Buy Coins | StoriesOnTips",
   description: "Purchase coins to unlock AI-powered story generation and language learning features",
 },
 robots: {
   index: true,
   follow: true,
 },
};

export default function BuyCoinsPage() {
 return (
   <main className="min-h-screen">
     <BuyCredits />
   </main>
 );
}