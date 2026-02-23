import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mic, FileText, History, TrendingUp, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/use-auth";
import { mockHistory, mockResume } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";

const stats = [
  { label: "Interviews", value: "12", icon: Mic, trend: "+3 this week" },
  { label: "Avg Score", value: "76%", icon: Target, trend: "+5% improvement" },
  { label: "Questions", value: "58", icon: Zap, trend: "Answered" },
  { label: "Streak", value: "4 days", icon: TrendingUp, trend: "Keep going!" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0] || "there"} 👋</h1>
          <p className="text-muted-foreground mt-1">Ready for your next mock interview?</p>
        </div>

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
              <Button onClick={() => navigate("/interview")} className="w-full justify-start gap-3 h-14 gradient-primary text-primary-foreground hover:opacity-90">
                <Mic className="h-5 w-5" /> Start New Interview
              </Button>
              <Button onClick={() => navigate("/resume")} variant="outline" className="w-full justify-start gap-3 h-12">
                <FileText className="h-5 w-5" /> Upload / Update Resume
              </Button>
              <Button onClick={() => navigate("/history")} variant="outline" className="w-full justify-start gap-3 h-12">
                <History className="h-5 w-5" /> View Past Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Skills overview */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">{mockResume.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium text-foreground">{mockResume.experience}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Skills</p>
                <div className="flex flex-wrap gap-2">
                  {mockResume.skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent sessions */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockHistory.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate(`/feedback/${session.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full ${session.status === "completed" ? "bg-success" : "bg-warning"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.role}</p>
                      <p className="text-xs text-muted-foreground">{session.date} · {session.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{session.score}%</p>
                    <Progress value={session.score} className="w-20 h-1.5 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
