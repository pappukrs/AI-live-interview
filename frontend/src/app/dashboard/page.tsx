"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mic, FileText, History, TrendingUp, Target, Zap, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/use-auth";
import { mockResume } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) return;
      try {
        const userId = user.id;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/history/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const stats = [
    { label: "Interviews", value: history.length.toString(), icon: Mic, trend: "Sessions total" },
    { label: "Avg Score", value: history.length ? `${Math.round(history.reduce((a, b) => a + (b.score || 0), 0) / history.length)}%` : "0%", icon: Target, trend: "Average" },
    { label: "Completion", value: history.filter(h => h.status === 'completed').length.toString(), icon: Zap, trend: "completed" },
    { label: "Streak", value: "1 day", icon: TrendingUp, trend: "Active" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0] || "there"} 👋</h1>
          <p className="text-muted-foreground mt-1">Ready for your next mock interview?</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={item}>
              <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                      <p className="text-xs text-primary mt-1">{s.trend}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                      <s.icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass border-border/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => router.push("/interview")} className="w-full justify-start gap-3 h-14 gradient-primary text-primary-foreground hover:opacity-90">
                <Mic className="h-5 w-5" /> Start New Interview
              </Button>
              <Button onClick={() => router.push("/resume")} variant="outline" className="w-full justify-start gap-3 h-12">
                <FileText className="h-5 w-5" /> Upload / Update Resume
              </Button>
              <Button onClick={() => router.push("/history")} variant="outline" className="w-full justify-start gap-3 h-12">
                <History className="h-5 w-5" /> View Past Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Profile snippet */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-accent/20 border border-border/50">
                <p className="text-sm font-medium text-foreground">Next.js Developer</p>
                <p className="text-xs text-muted-foreground mt-1">3 years experience</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {['React', 'Next.js', 'Typescript'].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-secondary text-[10px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent sessions */}
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/history")} className="text-xs">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : history.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-sm text-muted-foreground">No sessions yet. Start your first interview!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 3).map((session) => {
                  const dateStr = new Date(session.createdAt).toLocaleDateString();
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer group" onClick={() => router.push(`/feedback/${session.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className={`h-2.5 w-2.5 rounded-full ${session.status === "completed" ? "bg-success" : "bg-warning"}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{session.role || "Software Engineer"}</p>
                          <p className="text-xs text-muted-foreground">{dateStr} · {session._count?.responses || 0} questions</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-sm font-bold text-foreground">{session.score || 0}%</p>
                          <Progress value={session.score || 0} className="w-16 h-1 mt-1" />
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Dashboard;
