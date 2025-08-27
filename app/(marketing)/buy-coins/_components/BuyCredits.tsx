"use client";

import { useContext, useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { UserDetailContext } from "@/app/_context/UserDetailContext";
import { processPayPalPayment } from "@/lib/actions/payment-actions";
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
    credits: 3,
    popular: false,
  },
  {
    id: 2,
    name: "Popular Pack",
    price: 4.99,
    credits: 7,
    popular: true,
  },
  {
    id: 3,
    name: "Value Pack",
    price: 8.99,
    credits: 12,
    popular: false,
  },
  {
    id: 4,
    name: "Premium Pack",
    price: 9.99,
    credits: 16,
    popular: false,
  },
];

export default function BuyCredits() {
  const context = useContext(UserDetailContext);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!context) {
    return <div>Loading...</div>;
  }

  const { userDetail, setUserDetail } = context;

  const handlePackageSelect = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handlePaymentSuccess = async (orderID: string) => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    
    try {
      const result = await processPayPalPayment(orderID, selectedPackage);
      
      if (result.success) {
        // Update user credits in context
        setUserDetail(prev => prev ? { ...prev, credits: result.newBalance! } : null);
        
        toast({
          title: "Payment Successful!",
          description: result.message,
        });
        
        setSelectedPackage(null);
      } else {
        toast({
          title: "Payment Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPkg = PACKAGES.find(p => p.id === selectedPackage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Buy Coins</h1>
          <p className="text-muted-foreground mb-6">Choose a package to unlock AI story generation and maximize your learning</p>
          
          {/* Current Balance */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-white">Current Balance: {userDetail?.credits || 0} Coins</span>
          </div>
        </div>

        {/* Package Selection */}
        {!selectedPackage ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {PACKAGES.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative cursor-pointer transition-all hover:scale-105 ${
                  pkg.popular 
                    ? 'border-indigo-500 bg-slate-900' 
                    : 'border-slate-700 bg-slate-900/50'
                }`}
                onClick={() => handlePackageSelect(pkg.id)}
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
                    <span className="text-xl font-semibold text-foreground">{pkg.credits} Coins</span>
                  </div>
                  
                  <div className="text-sm text-slate-400 mb-4">
                    ${(pkg.price / pkg.credits).toFixed(2)} per credit
                  </div>
                  
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Select Package
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Payment Section */
          <Card className="max-w-md mx-auto bg-slate-900 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Complete Purchase</CardTitle>
              <div className="text-slate-400">
                {selectedPkg?.name} - {selectedPkg?.credits} Coins
              </div>
              <div className="text-2xl font-bold text-white">
                ${selectedPkg?.price}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">{selectedPkg?.credits} AI story generations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Instant coin delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">No expiration date</span>
                </div>
              </div>

              {/* PayPal Payment */}
              {!isProcessing ? (
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        amount: {
                          value: selectedPkg!.price.toFixed(2),
                          currency_code: "USD",
                        },
                        description: `${selectedPkg!.name} - ${selectedPkg!.credits} Coins`,
                      }],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    await handlePaymentSuccess(data.orderID);
                  }}
                  onCancel={() => {
                    toast({
                      title: "Payment Cancelled",
                      description: "No charges were made.",
                      variant: "destructive",
                    });
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast({
                      title: "Payment Error",
                      description: "Please try again or contact support.",
                      variant: "destructive",
                    });
                  }}
                />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
                  <span className="text-white">Processing payment...</span>
                </div>
              )}

              {/* Back Button */}
              <Button 
                variant="outline" 
                onClick={() => setSelectedPackage(null)}
                disabled={isProcessing}
                className="w-full"
              >
                Choose Different Package
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}