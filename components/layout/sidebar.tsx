"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { ThemeToggle } from "../Theme/ThemeToggle";
import { signOut } from "@/app/auth/actions";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Transactions", href: "/transactions", icon: ShoppingCart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

interface SidebarProps {
  userEmail: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const year = new Date().getFullYear();

  function handleLogout() {
    startLogoutTransition(async () => {
      await signOut();
    });
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Title */}
          <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-xl font-bold">Sales Dashboard</h1>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            {userEmail ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="truncate text-sm font-medium">{userEmail}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Log out
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block w-full rounded-md border px-3 py-2 text-center text-sm font-medium hover:bg-muted"
              >
                Log in
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground">
              Sales Analytics Dashboard
            </p>
            <p className="text-xs text-muted-foreground">© {year}</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
