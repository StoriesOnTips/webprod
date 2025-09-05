// app/buy-coins/_components/BuyCredits.tsx
"use client";

import { useContext, useState } from "react";
import { UserDetailContext } from "@/app/_context/UserDetailContext";
import { createPolarCheckout } from "@/lib/actions/payment-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PACKAGES = [
 {
   id: 1,
   name: "Starter Pack",
   price: 3.99,
   coins: 3, // Display as coins
   popular: false,
 },
 {
   id: 2,
   name: "Popular Pack",
   price: 4.99,
   coins: 5,
   popular: true,
 },
 {
   id: 3,
   name: "Value Pack",
   price: 8.99,
   coins: 8,
   popular: false,
 },
 {
   id: 4,
   name: "Premium Pack",
   price: 9.99,
   coins: 12,
   popular: false,
 },
];

export default function BuyCredits() {
 const context = useContext(UserDetailContext);
 const [isProcessing, setIsProcessing] = useState(false);
 const [processingPackage, setProcessingPackage] = useState<number | null>(null);

 if (!context) {
   return <div>Loading...</div>;
 }

 const { userDetail } = context;

 const handlePackageSelect = async (packageId: number) => {
   setIsProcessing(true);
   setProcessingPackage(packageId);
   
   try {
     // This will redirect to Polar checkout
     await createPolarCheckout(packageId);
   } catch (error) {
     toast({
       title: "Error",
       description: error instanceof Error ? error.message : "Failed to create checkout. Please try again.",
       variant: "destructive",
     });
     setIsProcessing(false);
     setProcessingPackage(null);
   }
 };

 return (
   <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20">
     <div className="max-w-6xl mx-auto px-4">
       {/* Header */}
       <div className="text-center mb-12">
         <h1 className="text-4xl font-bold text-foreground mb-4">Buy Coins</h1>
         <p className="text-muted-foreground mb-6">Choose a package to unlock AI story generation and maximize your learning</p>
         
         {/* Current Balance - Display as Coins */}
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
           <Coins className="w-4 h-4 text-yellow-400" />
           <span className="text-white">Current Balance: {userDetail?.credits || 0} Coins</span>
         </div>
       </div>

       {/* Package Selection */}
       <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {PACKAGES.map((pkg) => (
           <Card 
             key={pkg.id} 
             className={`relative cursor-pointer transition-all hover:scale-105 ${
               pkg.popular 
                 ? 'border-indigo-500 bg-slate-900' 
                 : 'border-slate-700 bg-slate-900/50'
             } ${processingPackage === pkg.id ? 'opacity-75' : ''}`}
           >
             {pkg.popular && (
               <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-600">
                 Most Popular
               </Badge>
             )}
             
             <CardHeader className="text-center">
               <CardTitle className="text-white">{pkg.name}</CardTitle>
               <div className="text-3xl font-bold text-white">${pkg.price}</div>
             </CardHeader>
             
             <CardContent className="text-center">
               <div className="flex items-center justify-center gap-2 mb-4">
                 <Coins className="w-5 h-5 text-yellow-400" />
                 <span className="text-xl font-semibold text-foreground">{pkg.coins} Coins</span>
               </div>
               
               <div className="text-sm text-slate-400 mb-4">
                 ${(pkg.price / pkg.coins).toFixed(2)} per coin
               </div>

               {/* Features */}
               <div className="space-y-2 mb-4">
                 <div className="flex items-center justify-center gap-2">
                   <Check className="w-4 h-4 text-green-400" />
                   <span className="text-sm text-slate-300">{pkg.coins} AI stories</span>
                 </div>
                 <div className="flex items-center justify-center gap-2">
                   <Check className="w-4 h-4 text-green-400" />
                   <span className="text-sm text-slate-300">Instant delivery</span>
                 </div>
                 <div className="flex items-center justify-center gap-2">
                   <Check className="w-4 h-4 text-green-400" />
                   <span className="text-sm text-slate-300">No expiration</span>
                 </div>
               </div>
               
               <Button 
                 className="w-full bg-indigo-600 hover:bg-indigo-700"
                 onClick={() => handlePackageSelect(pkg.id)}
                 disabled={isProcessing}
               >
                 {processingPackage === pkg.id ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin mr-2" />
                     Processing...
                   </>
                 ) : (
                   'Buy Now'
                 )}
               </Button>
             </CardContent>
           </Card>
         ))}
       </div>

       {/* Info */}
       <div className="text-center text-slate-400">
         <p>Secure payment powered by Polar.sh</p>
         <p className="text-sm mt-2">All transactions are encrypted and secure</p>
       </div>
     </div>
   </div>
 );
}