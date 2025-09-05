// app/buy-coins/success/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Coins, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
 title: "Purchase Successful | StoriesOnTips",
 description: "Your coin purchase was successful",
};

export default function PurchaseSuccessPage() {
 return (
   <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
     <Card className="max-w-md w-full bg-slate-900 border-slate-700">
       <CardHeader className="text-center">
         <div className="mx-auto mb-4">
           <CheckCircle className="w-16 h-16 text-green-400" />
         </div>
         <CardTitle className="text-2xl text-white mb-2">
           Payment Successful!
         </CardTitle>
         <p className="text-slate-400">
           Your coins have been added to your account
         </p>
       </CardHeader>
       
       <CardContent className="space-y-4">
         <div className="text-center p-4 bg-slate-800 rounded-lg">
           <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
             <Coins className="w-5 h-5" />
             <span className="font-semibold">Coins Added</span>
           </div>
           <p className="text-slate-300 text-sm">
             Check your dashboard to see your updated balance
           </p>
         </div>

         <div className="space-y-3">
           <Link href="/dashboard" className="block">
             <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
               Go to Dashboard
               <ArrowRight className="w-4 h-4 ml-2" />
             </Button>
           </Link>
           
           <Link href="/story-generator" className="block">
             <Button variant="outline" className="w-full">
               Create Stories
             </Button>
           </Link>
         </div>
       </CardContent>
     </Card>
   </div>
 );
}