import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, Mic, History, Settings, LogOut, Brain, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background dark">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        className="glass flex flex-col border-r border-border/50 z-10"
      >
        <div className="flex items-center gap-3 p-4 border-b border-border/50">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-foreground tracking-tight">
              MockAI
            </motion.span>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50 space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
            {!collapsed && "Logout"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="w-full text-muted-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
