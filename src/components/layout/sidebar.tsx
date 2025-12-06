"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, PlusSquare, Heart, User, LogOut } from "lucide-react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: PlusSquare, label: "Create", href: "/create" },
  { icon: Heart, label: "Activity", href: "/activity" },
  { icon: User, label: "Profile", href: "/profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen max-h-screen sticky top-0 px-4 py-6 border-r border-border glass">
      {/* Brand */}
      <div className="mb-10 px-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-purple-400">
          Scap
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="block group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon
                  size={24}
                  className={cn("transition-all duration-300", isActive && "fill-current")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn("text-lg font-medium", isActive && "font-semibold")}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="mt-auto px-4 pt-4 border-t border-border">
        {user ? (
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.imageUrl}
              alt={user.fullName || "User"}
              className="w-10 h-10 rounded-full border border-border"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.fullName}</p>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            </div>
            <SignOutButton>
              <button className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut size={20} />
              </button>
            </SignOutButton>
          </div>
        ) : (
          <Link href="/sign-in" className="btn btn-primary w-full">
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
