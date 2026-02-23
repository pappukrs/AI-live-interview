"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, ArrowRight, Loader2, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/use-auth";
import { AppLayout } from "@/components/AppLayout";

const HistoryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview History</h1>
          <p className="text-muted-foreground mt-1">Review your past interview sessions and performance</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading sessions...</p>
          </div>
        ) : history.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="p-12 text-center text-accent-neutral">
              <Mic className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-foreground font-semibold text-lg">No interviews yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Start your first mock interview to see your detailed performance reports here.</p>
              <Button onClick={() => router.push("/interview")} className="mt-6 gradient-primary text-primary-foreground">Start Your First Interview</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((session, i) => {
              const dateObj = new Date(session.createdAt);
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div key={session.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass border-border/50 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => router.push(`/feedback/${session.id}`)}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${session.status === "completed" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                            <Mic className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{session.role || "Software Engineer"}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {dateStr}</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {timeStr}</span>
                              <span className="text-xs text-muted-foreground">· {session._count?.responses || 0} questions</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xl font-bold text-foreground">{session.score || 0}%</p>
                            <Progress value={session.score || 0} className="w-20 h-1.5 mt-1" />
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
