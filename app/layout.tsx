import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    template: "%s | StoriesOnTips",
    default: "StoriesOnTips",
  },
  description:
    "Create AI-generated stories, customize narratives, educate kids in writing, reading and speaking english language with good pronunciation of stories, difficult words and their meanings, learn life lessons by moral of the stories and unleash your creativity with AI storytelling!",
  keywords: [
    "AI Story Creator",
    "AI Story Generator",
    "Story Creator",
    "Story Generator",
    "Language Learning",
    "Moral Stories",
    "AI Stories",
    "AI Storytelling",
    "AI Storyteller",
    "AI Storytelling App",
    "AI Storytelling Platform",
    "AI Storytelling Software",
    "AI Storytelling Tool",
    "Education",
    "Kids",
    "Children",
    "Parents",
    "Teachers",
    "Students",
    "Schools",
    "English Learning App",
  ],
  openGraph: {
    title: "StoriesOnTips - AI Story Generator",
    description: "Create AI-generated stories for education and fun",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: shadcn,
      }}
      afterSignOutUrl="/"
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Provider>
              <main>{children}</main>
              <Toaster />
            </Provider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
