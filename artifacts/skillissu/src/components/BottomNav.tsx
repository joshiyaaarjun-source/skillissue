import { Link, useLocation } from "wouter";
import { Home, Compass, HeartHandshake, Trophy, BarChart, User, MessageCircle } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around p-2">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80 hover:bg-muted"
                )}
              >
                <Icon className={cn("h-6 w-6 mb-1", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
