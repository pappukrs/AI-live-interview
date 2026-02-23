"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Brain, ChevronRight, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { type InterviewState, type AnswerEvaluation } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const stateLabels: Record<InterviewState, { label: string; icon: React.ElementType; color: string }> = {
  idle: { label: "Ready", icon: Clock, color: "text-muted-foreground" },
  question: { label: "Question", icon: Brain, color: "text-primary" },
  listening: { label: "Listening...", icon: Mic, color: "text-success" },
  processing: { label: "Evaluating...", icon: Loader2, color: "text-warning" },
  feedback: { label: "Feedback", icon: CheckCircle2, color: "text-success" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-primary" },
};

const Interview = () => {
  const router = useRouter();
  const [state, setState] = useState<InterviewState>("idle");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const recognitionRef = useRef<any>(null);

  const totalQuestions = 5;
  const progress = ((currentQIndex - 1) / totalQuestions) * 100;

  const startInterview = async () => {
    const rawResume = localStorage.getItem("parsed_resume");
    const rawKeys = localStorage.getItem("ai_interview_keys");

    if (!rawResume) {
      toast.error("Please upload your resume first");
      router.push("/resume");
      return;
    }

    const keys = rawKeys ? JSON.parse(rawKeys) : {};
    const apiKey = keys.gemini || keys.openai || keys.claude;
    const provider = keys.gemini ? "gemini" : keys.openai ? "openai" : "claude";

    if (!apiKey) {
      toast.error("Please add an API key in settings");
      router.push("/settings");
      return;
    }

    setState("processing");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedData: JSON.parse(rawResume),
          provider,
          apiKey,
          userId: user?.id || "default-user"
        }),
      });

      if (!response.ok) throw new Error("Failed to start interview");

      const data = await response.json();
      setSessionId(data.sessionId);
      setCurrentQuestionText(data.question);
      setState("question");
      setCurrentQIndex(1);
      setScores([]);
    } catch (error) {
      console.error(error);
      toast.error("Error starting interview");
      setState("idle");
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript("Speech recognition not supported in this browser. Please type your answer instead.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let t = "";
      for (let i = 0; i < event.results.length; i++) {
        t += event.results[i][0].transcript;
      }
      setTranscript(t);
      setAnswer(t);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setState("listening");
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !sessionId) return;

    const rawKeys = localStorage.getItem("ai_interview_keys");
    const keys = rawKeys ? JSON.parse(rawKeys) : {};
    const apiKey = keys.gemini || keys.openai || keys.claude;
    const provider = keys.gemini ? "gemini" : keys.openai ? "openai" : "claude";

    setState("processing");
    recognitionRef.current?.stop();
    setIsRecording(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answer,
          provider,
          apiKey
        }),
      });

      if (!response.ok) throw new Error("Failed to submit answer");

      const data = await response.json();
      setEvaluation(data);
      setScores((prev) => [...prev, data.score]);
      setState("feedback");
    } catch (error) {
      console.error(error);
      toast.error("Error evaluating answer");
      setState("question");
    }
  };

  const nextQuestion = () => {
    if (currentQIndex >= totalQuestions) {
      setState("completed");
      return;
    }

    if (evaluation?.nextQuestion) {
      setCurrentQuestionText(evaluation.nextQuestion);
      setCurrentQIndex((prev) => prev + 1);
      setAnswer("");
      setTranscript("");
      setEvaluation(null);
      setState("question");
    } else {
      // Fallback or retry
      setState("question");
    }
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;

  const StatusIcon = stateLabels[state].icon;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mock Interview</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`h-4 w-4 ${stateLabels[state].color} ${state === "processing" ? "animate-spin" : ""}`} />
              <span className={`text-sm font-medium ${stateLabels[state].color}`}>{stateLabels[state].label}</span>
            </div>
          </div>
          {state !== "idle" && state !== "completed" && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Question {currentQIndex}/{totalQuestions}</p>
              <Progress value={progress} className="w-32 h-1.5 mt-1" />
            </div>
          )}
        </div>

        {/* Idle State */}
        {state === "idle" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass border-border/50">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <Brain className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Ready to Practice?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  AI will ask you personalized technical questions based on your resume. Answer via voice or text.
                </p>
                <Button onClick={startInterview} className="gradient-primary text-primary-foreground px-8 h-12 text-base hover:opacity-90">
                  Start Interview <Mic className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question + Answer area */}
        {(state === "question" || state === "listening" || state === "processing") && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Question card */}
            <Card className="glass border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium leading-relaxed">{currentQuestionText || "Generating question..."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice / Text input */}
            <Card className="glass border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    className={`h-12 w-12 rounded-full ${isRecording ? "animate-pulse-glow" : ""}`}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{isRecording ? "Recording... Click to stop" : "Click to start voice recording"}</p>
                    <p className="text-xs text-muted-foreground">Or type your answer below</p>
                  </div>
                </div>

                {transcript && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Transcript</p>
                    <p className="text-sm text-foreground font-mono">{transcript}</p>
                  </div>
                )}

                <Textarea
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="min-h-[120px] bg-secondary/30 resize-none"
                />

                <Button onClick={submitAnswer} disabled={!answer.trim() || state === "processing"} className="w-full gradient-primary text-primary-foreground h-11">
                  {state === "processing" ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Working...</> : <><Send className="h-4 w-4 mr-2" /> Submit Answer</>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feedback */}
        {state === "feedback" && evaluation && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="glass border-success/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Answer Evaluation</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold gradient-text">{evaluation.score}</span>
                    <span className="text-muted-foreground">/10</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Feedback</p>
                    <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">How to Improve</p>
                    <p className="text-sm text-muted-foreground">{evaluation.improvement}</p>
                  </div>
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Strengths</p>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.strengths.map((s) => (
                          <span key={s} className="px-2.5 py-1 rounded-md bg-success/20 text-success text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button onClick={nextQuestion} className="w-full mt-6 gradient-primary text-primary-foreground h-11">
                  {currentQIndex >= totalQuestions ? "View Results" : <>Next Question <ChevronRight className="ml-1 h-4 w-4" /></>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Completed */}
        {state === "completed" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card className="glass border-primary/30">
              <CardContent className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Interview Complete!</h2>
                <p className="text-4xl font-bold gradient-text mb-2">{avgScore}%</p>
                <p className="text-muted-foreground mb-6">Overall Score</p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {scores.map((s, i) => (
                    <div key={i} className="text-center px-3 py-2 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Q{i + 1}</p>
                      <p className="text-sm font-bold text-foreground">{s}/10</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push("/dashboard")} variant="outline">Back to Dashboard</Button>
                  <Button onClick={() => { setState("idle"); setCurrentQIndex(0); setScores([]); setAnswer(""); setTranscript(""); setEvaluation(null); }} className="gradient-primary text-primary-foreground">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default Interview;
