"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Brain, ChevronRight, Loader2, CheckCircle2, Clock, Volume2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type InterviewState, type AnswerEvaluation } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { io, Socket } from "socket.io-client";

const stateLabels: Record<InterviewState, { label: string; icon: React.ElementType; color: string }> = {
  idle: { label: "Ready", icon: Clock, color: "text-muted-foreground" },
  question: { label: "AI Speaking...", icon: Volume2, color: "text-primary" },
  listening: { label: "Listening...", icon: Mic, color: "text-success" },
  processing: { label: "Evaluating...", icon: Loader2, color: "text-warning" },
  feedback: { label: "Feedback", icon: CheckCircle2, color: "text-success" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-primary" },
};

const Interview = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<InterviewState>("idle");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  const recognitionRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stateRef = useRef<InterviewState>("idle");

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const totalQuestions = 5;
  const progress = ((currentQIndex - 1) / totalQuestions) * 100;

  const startListening = useCallback(() => {
    // Only start if we are supposed to be in an active interview and not already listening
    if (stateRef.current === "completed") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        setState("listening");
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        let t = "";
        for (let i = 0; i < event.results.length; i++) {
          t += event.results[i][0].transcript;
        }
        setTranscript(t);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error(`Speech error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        // If it ended unexpectedly and we are still in listening state, restart?
        // But usually user clicks stop.
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition", err);
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Workaround for Chrome bug where synthesis stops after 15s
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Small timeout to ensure cancel finishes
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      // Select a natural voice
      utterance.voice = voices.find(v => (v.name.includes("Google") || v.name.includes("Premium") || v.name.includes("Female")) && v.lang.startsWith("en")) || voices[0];
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setState("question");
      };

      utterance.onend = () => {
        console.log("Speech synthesis ended. Starting listening in 500ms...");
        // Check stateRef instead of state to avoid stale closure
        if (stateRef.current !== "completed") {
          // Small delay before starting recognition to allow browser to clear audio buffers/state
          setTimeout(() => {
            if (stateRef.current !== "completed") {
              startListening();
            }
          }, 500);
        }
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        if (stateRef.current !== "completed") {
          setState("listening");
          startListening();
        }
      };

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 200);
  }, [startListening]);
  // Initialize Socket.io and global Speech handlers
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const socketBaseUrl = apiUrl.replace(/\/api$/, "");

    console.log("Connecting to Socket at:", socketBaseUrl, "with path: /api/socket.io");

    const socket = io(socketBaseUrl, {
      path: "/api/socket.io",
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected! ID:", socket.id, "Namespace:", socket.nsp);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
      toast.error("Socket connection failed. Please refresh.");
    });

    socket.on("disconnect", (reason) => {
      console.log("ℹ️ Socket disconnected:", reason);
    });

    socket.on("interview:feedback", (data: AnswerEvaluation) => {
      console.log("Received feedback via Socket:", data);
      setEvaluation(data);
      setScores((prev) => [...prev, data.score]);

      // Update UI immediately with the next question
      setCurrentQuestionText(data.nextQuestion);
      setCurrentQIndex((prev) => prev + 1);

      // Speak feedback AND the next question
      const combinedText = `${data.feedback}. ${data.nextQuestion}`;
      speakText(combinedText);
    });

    socket.on("error", (err: any) => {
      toast.error(err.message || "An error occurred");
      setState("listening");
      startListening();
    });

    // Handle voices changing (async load in some browsers)
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;

    return () => {
      socket.disconnect();
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [speakText, startListening]);

  const stopListeningAndSubmit = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onerror = null; // Prevent error toast on intentional stop
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    submitAnswer();
  };

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
      setCurrentQIndex(1);
      setScores([]);

      socketRef.current?.emit("interview:join", { sessionId: data.sessionId });

      // Start voice interaction
      speakText(data.question);
    } catch (error) {
      console.error(error);
      toast.error("Error starting interview");
      setState("idle");
    }
  };

  const submitAnswer = async () => {
    if (!transcript.trim() || !sessionId) {
      toast.error("No answer captured. Please click start and speak again.");
      setState("listening");
      startListening();
      return;
    }

    const rawKeys = localStorage.getItem("ai_interview_keys");
    const keys = rawKeys ? JSON.parse(rawKeys) : {};
    const apiKey = keys.gemini || keys.openai || keys.claude;
    const provider = keys.gemini ? "gemini" : keys.openai ? "openai" : "claude";

    setState("processing");
    console.log(`Submitting answer to socket for session ${sessionId}...`);

    socketRef.current?.emit("interview:answer", {
      sessionId,
      answer: transcript,
      provider,
      apiKey
    });
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) : 0;
  const StatusIcon = stateLabels[state].icon;

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-32">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Live AI Interview</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`h-4 w-4 ${stateLabels[state].color} ${state === "processing" || state === "question" ? "animate-pulse" : ""}`} />
              <span className={`text-xs md:text-sm font-medium ${stateLabels[state].color}`}>{stateLabels[state].label}</span>
            </div>
          </div>
          {state !== "idle" && state !== "completed" && (
            <div className="sm:text-right flex items-center sm:block gap-3">
              <p className="text-xs md:text-sm text-muted-foreground">Progression</p>
              <Progress value={progress} className="w-24 md:w-32 h-1.5 md:h-2 mt-1 shadow-inner" />
            </div>
          )}
        </div>

        {/* Idle State */}
        {state === "idle" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass border-border/50 shadow-2xl">
              <CardContent className="p-8 md:p-16 text-center">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 md:mb-8 animate-pulse-glow shadow-xl shadow-primary/20">
                  <Brain className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">Experience a Real Interview</h2>
                <p className="text-sm md:text-lg text-muted-foreground mb-8 md:mb-10 max-w-md mx-auto leading-relaxed">
                  The AI will ask questions via voice. Speak your answers, and the AI will listen and follow up just like a real human interviewer.
                </p>
                <Button onClick={startInterview} className="w-full sm:w-auto gradient-primary text-primary-foreground px-8 md:px-12 h-12 md:h-14 text-base md:text-lg font-bold rounded-xl md:rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                  Start Live Interview <Mic className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Interview area */}
        {(state === "question" || state === "listening" || state === "processing" || state === "feedback") && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">

            {/* AI Visualization */}
            <div className="flex flex-col items-center justify-center py-6 md:py-10 space-y-4">
              <div className={`relative h-40 w-40 md:h-56 md:w-56 rounded-full flex items-center justify-center bg-primary/5 border-4 md:border-8 border-primary/10 ${state === "question" ? "scale-105 md:scale-110" : "scale-100"} transition-all duration-700 shadow-2xl`}>
                <AnimatePresence>
                  {state === "question" && (
                    <motion.div
                      key="ping-q"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 rounded-full border-2 md:border-4 border-primary/30"
                    />
                  )}
                  {state === "listening" && (
                    <motion.div
                      key="ping-l"
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: [1.2, 1.4, 1.2], opacity: 0.2 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full border-4 md:border-8 border-success/40"
                    />
                  )}
                </AnimatePresence>

                <div className={`p-6 md:p-10 rounded-full bg-background border-2 shadow-2xl transition-all duration-500 ${state === "listening" ? "border-success scale-105 md:scale-110" : "border-primary/20"}`}>
                  {state === "listening" ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Mic className="h-12 w-12 md:h-20 md:w-20 text-success" />
                    </motion.div>
                  ) : (
                    <Brain className={`h-12 w-12 md:h-20 md:w-20 text-primary ${state === "question" ? "animate-pulse" : ""}`} />
                  )}
                </div>

                {state === "listening" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-4 md:-top-6 bg-success text-success-foreground px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm font-black uppercase tracking-[0.2em] shadow-2xl animate-pulse ring-2 md:ring-4 ring-background">
                    Listen Mode
                  </motion.div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm md:text-lg font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground">
                  {state === "question" ? "Interviewer Speaking" : state === "listening" ? "Your Turn to Talk" : "Thinking..."}
                </p>
                {state === "listening" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-success text-xs md:text-sm font-bold mt-2 flex items-center justify-center gap-2">
                    <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-success animate-ping" /> Speak now, I'm listening
                  </motion.p>
                )}
              </div>
            </div>

            {/* Question Display */}
            <Card className="glass border-primary/20 shadow-xl md:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden">
              <div className="h-1 gradient-primary w-full" />
              <CardContent className="p-6 md:p-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-10 text-center md:text-left">
                  <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-[1.25rem] gradient-primary flex items-center justify-center shrink-0 shadow-xl shadow-primary/30">
                    <Wand2 className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentQuestionText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-lg md:text-3xl text-foreground font-bold leading-snug tracking-tight"
                      >
                        {currentQuestionText || "Wait a second..."}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcript Display */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-6 md:p-10 rounded-2xl md:rounded-[3rem] bg-secondary/30 border-2 border-success/10 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] max-w-3xl mx-auto backdrop-blur-xl"
                >
                  <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-4 md:mb-8">
                    <div className="flex gap-1 md:gap-2 h-6 md:h-10 items-center">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: transcript ? [8, Math.random() * 30 + 5, 8] : [6, 10, 6] }}
                          transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.03 }}
                          className={`w-1 md:w-2 rounded-full ${i % 3 === 0 ? "bg-success" : "bg-success/50"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-lg md:text-2xl text-foreground/80 font-mono italic leading-relaxed px-2 md:px-6">
                    {transcript || "Speak clearly into your microphone..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Control Bar at Bottom */}
            {state === "listening" && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-6 md:bottom-12 left-0 right-0 z-50 flex justify-center px-4"
              >
                <div className="relative group w-full max-w-sm">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl md:rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
                  <Button
                    onClick={stopListeningAndSubmit}
                    variant="destructive"
                    className="relative w-full h-16 md:h-24 px-6 md:px-16 rounded-xl md:rounded-[2.25rem] text-xl md:text-3xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-6 border-b-4 md:border-b-8 border-red-800"
                  >
                    <MicOff className="h-6 w-6 md:h-10 md:w-10 animate-pulse" />
                    DONE SPEAKING
                  </Button>
                </div>
              </motion.div>
            )}

            {state === "processing" && (
              <div className="text-center py-8 md:py-16">
                <div className="inline-flex flex-col items-center gap-4 md:gap-6 bg-warning/5 border-2 border-warning/10 px-8 md:px-12 py-6 md:py-8 rounded-2xl md:rounded-[2rem] shadow-xl">
                  <div className="relative h-12 w-12 md:h-16 md:w-16">
                    <Loader2 className="absolute inset-0 h-12 w-12 md:h-16 md:w-16 animate-spin text-warning opacity-30" />
                    <Brain className="absolute inset-3 md:inset-4 h-6 w-6 md:h-8 md:w-8 text-warning animate-pulse" />
                  </div>
                  <span className="text-lg md:text-2xl font-black text-warning tracking-tight">AI is analyzing...</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Completed State */}
        {state === "completed" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card className="glass border-primary/30 shadow-2xl overflow-hidden">
              <div className="h-2 gradient-primary w-full" />
              <CardContent className="p-8 md:p-20 text-center">
                <div className="h-20 w-20 md:h-28 md:w-28 rounded-2xl md:rounded-[2.5rem] gradient-primary flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-3xl shadow-primary/40">
                  <CheckCircle2 className="h-10 w-10 md:h-14 md:w-14 text-primary-foreground" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-foreground mb-2 md:mb-4 tracking-tighter">Interview Complete!</h2>
                <div className="text-6xl md:text-8xl font-black gradient-text mb-4 md:mb-6">{avgScore}%</div>
                <p className="text-muted-foreground mb-10 md:mb-16 text-lg md:text-2xl font-semibold opacity-70">Performance Scorecard</p>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6 mb-10 md:mb-16">
                  {scores.map((s, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="text-center p-4 md:p-8 rounded-xl md:rounded-[2rem] bg-secondary/40 border-2 border-border/50 shadow-xl transition-all hover:border-primary/30 group"
                    >
                      <p className="text-[0.6rem] md:text-[0.7rem] font-black text-muted-foreground uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-4 group-hover:text-primary transition-colors">Q{i + 1}</p>
                      <p className="text-2xl md:text-4xl font-black text-foreground mb-2 md:mb-4">{s}</p>
                      <div className="h-1.5 md:h-2 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s * 10}%` }}
                          transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                          className="h-full gradient-primary"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center">
                  <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full sm:w-auto h-14 md:h-20 px-8 md:px-16 text-lg md:text-2xl font-extrabold rounded-xl md:rounded-3xl border-2 md:border-4 hover:bg-secondary/20 transition-all">
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => { setState("idle"); setCurrentQIndex(0); setScores([]); setTranscript(""); setEvaluation(null); }} className="w-full sm:w-auto gradient-primary text-primary-foreground h-14 md:h-20 px-8 md:px-16 text-lg md:text-2xl font-extrabold rounded-xl md:rounded-3xl shadow-3xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                    Try Another One
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
