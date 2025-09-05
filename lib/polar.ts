// lib/polar.ts
import { Polar } from "@polar-sh/sdk";

// Polar client
export const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox"
});

// Credit packages configuration (backend uses "credits", UI shows "coins")
export const CREDIT_PACKAGES = {
    1: {
        price: 3.99,
        credits: 3,
        name: "Starter Pack",
        productId: process.env.POLAR_STARTER_PRODUCT_ID!
    },
    2: {
        price: 4.99,
        credits: 5,
        name: "Popular Pack",
        productId: process.env.POLAR_POPULAR_PRODUCT_ID!
    },
    3: {
        price: 8.99,
        credits: 8,
        name: "Value Pack",
        productId: process.env.POLAR_VALUE_PRODUCT_ID!
    },
    4: {
        price: 9.99,
        credits: 12,
        name: "Premium Pack",
        productId: process.env.POLAR_PREMIUM_PRODUCT_ID!
    },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;