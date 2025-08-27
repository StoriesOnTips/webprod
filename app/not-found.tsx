import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "./(marketing)/_components/LandingHeader";

export const metadata: Metadata = {
  title: "404 Not Found",
  description: "The page you are looking for does not exist.",
  keywords: ["404", "Not Found", "Error"],
};

export default function Custom404() {
  return (
    <>
      <Header />
      <div className="min-h-screen flex lg:flex-row flex-col items-center justify-between bg-[#000015] py-12 px-4 sm:px-8 lg:px-24">
        {" "}
        <div className="mb-8">
          <Image
            src="/hero.webp" // Add your image path here
            alt="404 Illustration"
            width={500}
            height={500}
            className="mx-auto"
          />
        </div>
        <div className="text-center flex-1">
          <h1 className="text-3xl lg:text-6xl font-bold text-white mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-6">
            Oops! Page Not Found
          </h2>
          <p className="text-xl text-white mb-8">
            It seems the page you're looking for has vanished into thin air!
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            <Link href="/">
              Return to Homepage
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
