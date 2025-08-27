import type React from "react";
import Link from "next/link";
import { FaYoutube } from "react-icons/fa";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black border-t border-white/10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/20 via-black to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Company Info */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-white">StoriesOnTips</h3>
              </div>

              <p className="text-white/60 max-w-sm leading-relaxed">
                Transforming ideas into enchanting stories with our magical AI
                assistant. Create personalized, engaging, and age-appropriate
                stories in seconds.
              </p>

              <div className="flex items-center space-x-4">
                <a
                  href="https://www.youtube.com/@storiesontips"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="group flex items-center justify-center w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300"
                >
                  <FaYoutube
                    size={20}
                    className="text-white/70 group-hover:text-red-500 transition-colors"
                  />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Quick Links</h3>
              <ul className="space-y-4">
                {[
                  { name: "Create Story", href: "/create-story" },
                  { name: "Story Library", href: "/explore" },
                  { name: "Buy Coins", href: "/buy-credits" },
                  { name: "Home", href: "/" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center text-white/60 hover:text-white transition-colors duration-200"
                    >
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full mr-3 group-hover:bg-blue-400 transition-colors"></div>
                      <span>{link.name}</span>
                      <ArrowUpRight
                        size={14}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Image Section */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl scale-110"></div>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                  <Image
                    src="/landing/heroimagefinal.png"
                    alt="Footer brand image"
                    width={250}
                    height={250}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/60 text-sm">
              &copy; {currentYear} StoriesOnTips. All rights reserved.
            </p>

            <div className="flex items-center space-x-8">
              {[
                { name: "Terms of Service", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Cookie Policy", href: "/cookies" },
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/60 hover:text-white text-sm transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
