import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Sparkles, Award, Crown, CircleCheck } from "lucide-react"


interface PricingOption {
  id: number
  price: number
  credits: number
  planName: string
  icon: React.ReactNode
  features: string[]
  valueProposition: string
  badge?: string
  highlight?: string
}

const PRICING_OPTIONS: readonly PricingOption[] = [
  {
    id: 1,
    price: 3.99,
    credits: 3,
    planName: "Story Sprout",
    icon: <Sparkles className="w-8 h-8 text-blue-400" />,
    features: ["3 unique AI stories", "Perfect for beginners", "Standard quality output", "24/7 support access"],
    valueProposition: "Perfect starter pack",
  },
  {
    id: 2,
    price: 4.99,
    credits: 7,
    planName: "Tale Weaver",
    icon: <CheckCircle className="w-8 h-8 text-green-400" />,
    features: ["7 unique AI stories", "Great for casual users", "Premium quality output", "Priority queue processing"],
    valueProposition: "Most popular choice",
    badge: "POPULAR",
  },
  {
    id: 3,
    price: 8.99,
    credits: 12,
    planName: "Mythic Master",
    icon: <Award className="w-8 h-8 text-yellow-400" />,
    features: ["12 unique AI stories", "Ideal for regular users", "Priority generation", "Advanced customization"],
    highlight: "BEST VALUE",
    valueProposition: "Best value for money",
  },
  {
    id: 4,
    price: 9.99,
    credits: 16,
    planName: "Legendary Quill",
    icon: <Crown className="w-8 h-8 text-purple-400" />,
    features: ["16 unique AI stories", "Best value for power users", "Priority support", "Early access to features"],
    highlight: "PREMIUM",
    valueProposition: "For content creators",
  },
] as const

export default function LandingPricing() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-16 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
              <span className="text-sm text-white/80 font-medium">
                Pricing
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-none mb-6">
              More Coins for more stories
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-light">
             checkout our coins purchase options for building more stories for fun and learning.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_OPTIONS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-lg border p-6 transition-all duration-300 hover:shadow-lg ${plan.badge === "POPULAR" ? "ring-2 ring-primary scale-105" : ""
                }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  {plan.badge}
                </Badge>
              )}
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                  {plan.highlight}
                </Badge>
              )}

              <div className="text-center pb-4">
                {plan.icon && <div className="flex justify-center mb-4">{plan.icon}</div>}
                <Badge>{plan.planName}</Badge>
                <h4 className="mb-2 mt-4 text-2xl font-bold text-primary">{plan.price}</h4>
                <p className="text-sm text-muted-foreground">{plan.valueProposition}</p>
              </div>

              <div className="text-center pb-4 flex-1">
                <div className="my-4 border-t"></div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-left">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <Link href="/buy-coins" target="_blank">
                  <Button
                    size="sm"
                    className="w-full"
                    variant={plan.badge === "POPULAR" ? "default" : "outline"}
                  >
                    Buy Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            All purchases are one-time payments currently. Subscriptions are on the way for some exclusive features!
          </p>
        </div>
      </div>
    </section>
  )
}