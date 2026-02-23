import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockHistory } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";

const Feedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = mockHistory.find((s) => s.id === id) || mockHistory[0];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance Report</h1>
            <p className="text-muted-foreground">{session.role} · {session.date}</p>
          </div>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass border-primary/30">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold gradient-text">{session.score}%</p>
              <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-foreground">{session.questionsAnswered}</p>
              <p className="text-sm text-muted-foreground mt-1">Questions Answered</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-foreground">{session.duration}</p>
              <p className="text-sm text-muted-foreground mt-1">Duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-question breakdown */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.questions.map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 rounded-lg bg-secondary/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Q{i + 1}: {q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">Your answer: "{q.answer}"</p>
                  </div>
                  <span className={`text-lg font-bold ml-4 ${q.evaluation.score >= 7 ? "text-success" : q.evaluation.score >= 5 ? "text-warning" : "text-destructive"}`}>
                    {q.evaluation.score}/10
                  </span>
                </div>
                <Progress value={q.evaluation.score * 10} className="h-1.5" />
                <p className="text-sm text-muted-foreground">{q.evaluation.feedback}</p>
                <div className="flex flex-wrap gap-2">
                  {q.evaluation.strengths.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded text-xs bg-success/20 text-success font-medium">{s}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="glass border-success/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="font-semibold text-foreground">Strengths</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Clear communication of technical concepts</li>
                <li>• Good understanding of fundamentals</li>
                <li>• Structured problem-solving approach</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="glass border-warning/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-foreground">Areas to Improve</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Include more real-world examples</li>
                <li>• Dive deeper into edge cases</li>
                <li>• Practice system design patterns</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/history")}>Back to History</Button>
          <Button onClick={() => navigate("/interview")} className="gradient-primary text-primary-foreground">Start New Interview</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feedback;
