"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, TrendingUp, Loader2, Brain, Target, Clock, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/AppLayout";

const Feedback = () => {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/session/${id}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSession();
  }, [id]);

  if (loading) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyzing performance data...</p>
      </div>
    </AppLayout>
  );

  if (!session) return (
    <AppLayout>
      <div className="text-center p-20">
        <h2 className="text-2xl font-bold">Session not found</h2>
        <Button onClick={() => router.push("/history")} className="mt-4">Back to History</Button>
      </div>
    </AppLayout>
  );

  const avgScore = session.score || (session.responses.length > 0 ? Math.round(session.responses.reduce((a: number, b: any) => a + (b.score || 0), 0) / session.responses.filter((r: any) => r.answer).length * 10) : 0);
  const dateStr = new Date(session.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance Report</h1>
            <p className="text-muted-foreground">{session.role || "Software Engineer"} · {dateStr}</p>
          </div>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Target className="h-12 w-12" /></div>
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold gradient-text">{avgScore}%</p>
              <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><MessageSquare className="h-12 w-12" /></div>
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-foreground">{session.responses.filter((r: any) => r.answer).length}</p>
              <p className="text-sm text-muted-foreground mt-1">Questions Answered</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Clock className="h-12 w-12" /></div>
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-foreground">{session.responses.length > 0 ? '15m' : '0m'}</p>
              <p className="text-sm text-muted-foreground mt-1">Duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-question breakdown */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Question Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.responses.filter((r: any) => r.answer).map((q: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-5 rounded-xl bg-secondary/20 border border-border/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-primary mb-1 uppercase tracking-wider">Question {i + 1}</p>
                    <p className="text-md font-semibold text-foreground leading-snug">{q.question}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black ${q.score >= 8 ? "text-success" : q.score >= 5 ? "text-warning" : "text-destructive"}`}>
                      {q.score || 0}
                    </span>
                    <span className="text-xs text-muted-foreground block font-medium">/ 10</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Your Answer</p>
                  <p className="text-sm text-foreground italic">"{q.answer}"</p>
                </div>

                {q.evaluation && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><Star className="h-3 w-3 text-warning fill-warning" /> AI Feedback</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{q.evaluation.feedback}</p>
                    </div>
                    {q.evaluation.improvement && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">How to Improve</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{q.evaluation.improvement}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center pt-6">
          <Button variant="outline" onClick={() => router.push("/history")} className="h-11 px-8 rounded-full">Back to History</Button>
          <Button onClick={() => router.push("/interview")} className="gradient-primary text-primary-foreground h-11 px-8 rounded-full shadow-lg shadow-primary/20">Start New Interview</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feedback;
