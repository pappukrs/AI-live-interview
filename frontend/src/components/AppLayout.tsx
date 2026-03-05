"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, Mic, History, Settings, LogOut, Brain, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Resume", path: "/resume" },
  { icon: Mic, label: "Interview", path: "/interview" },
  { icon: History, label: "History", path: "/history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, init, isAuthenticated } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token && pathname !== "/login" && pathname !== "/signup") {
      router.push("/login");
    }
  }, [pathname, router]);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        {(!collapsed || isMobileMenuOpen) && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-foreground tracking-tight">
            MockAI
          </motion.span>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = pathname === path;
          return (
            <Link key={path} href={path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || isMobileMenuOpen) && <span className="text-sm font-medium">{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-2">
        {(!collapsed || isMobileMenuOpen) && user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
          {(!collapsed || isMobileMenuOpen) && "Logout"}
        </Button>
        <div className="hidden lg:block">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="w-full text-muted-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background dark">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 glass z-20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">MockAI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <LayoutDashboard className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] glass flex flex-col z-40"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        className="hidden lg:flex glass flex-col border-r border-border/50 z-10"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
