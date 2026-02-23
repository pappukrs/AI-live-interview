import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockHistory } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";

const HistoryPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interview History</h1>
          <p className="text-muted-foreground mt-1">Review your past interview sessions</p>
        </div>

        {mockHistory.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="p-12 text-center">
              <Mic className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">No interviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start your first mock interview to see results here.</p>
              <Button onClick={() => navigate("/interview")} className="mt-4 gradient-primary text-primary-foreground">Start Interview</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {mockHistory.map((session, i) => (
              <motion.div key={session.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="glass border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/feedback/${session.id}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-3 w-3 rounded-full ${session.status === "completed" ? "bg-success" : session.status === "in-progress" ? "bg-warning" : "bg-destructive"}`} />
                        <div>
                          <p className="font-medium text-foreground">{session.role}</p>
                          <p className="text-sm text-muted-foreground">{session.date} · {session.duration} · {session.questionsAnswered}/{session.totalQuestions} questions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{session.score}%</p>
                          <Progress value={session.score} className="w-24 h-1.5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
