import { Link, useLocation } from "wouter";
import { Home, Compass, HeartHandshake, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  if (location === "/") return null;

  const links = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/matches", icon: HeartHandshake, label: "Matches" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e7d8d8] bg-[#fffaf8]/95 pb-safe shadow-[0_-8px_28px_rgba(70,24,37,0.07)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-around px-3 py-2">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div
                data-testid={`nav-${link.label.toLowerCase()}`}
                className={cn(
                  "flex min-w-[58px] flex-col items-center rounded-2xl px-3 py-2 transition-colors cursor-pointer",
                  isActive ? "bg-[#f5e8e7] text-[#741f37]" : "text-[#8f777c] hover:text-[#741f37] hover:bg-[#f8efed]"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-semibold">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
