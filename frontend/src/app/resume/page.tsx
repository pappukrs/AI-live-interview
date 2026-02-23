"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockResume, type ResumeData } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";

const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState<ResumeData | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      // Get API keys from localStorage
      const savedKeysRaw = localStorage.getItem("ai_interview_keys");
      if (savedKeysRaw) {
        const keys = JSON.parse(savedKeysRaw);
        const geminiKey = keys.gemini || "";
        if (geminiKey) {
          formData.append("apiKey", geminiKey);
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload resume");

      const data = await response.json();
      const extracted = {
        ...mockResume, // Fallback for fields not yet parsed by backend
        ...data.extractedData,
        technologies: data.extractedData.skills || mockResume.technologies,
        projects: data.extractedData.projects || mockResume.projects,
      };
      setParsed(extracted);
      localStorage.setItem("parsed_resume", JSON.stringify(extracted));
    } catch (error) {
      console.error("Upload error:", error);
      // You could add a toast here
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resume</h1>
          <p className="text-muted-foreground mt-1">Upload your resume to personalize interview questions</p>
        </div>

        {/* Drop zone */}
        <Card className="glass border-border/50">
          <CardContent className="p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${dragActive ? "border-primary bg-accent/50" : "border-border hover:border-primary/50"
                }`}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">Drag & drop your resume here</p>
              <p className="text-sm text-muted-foreground mt-1">PDF or DOC, max 10MB</p>
              <label className="mt-4 inline-block">
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                <span className="text-sm text-primary cursor-pointer hover:underline">or browse files</span>
              </label>
            </div>

            <AnimatePresence>
              {file && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => { setFile(null); setParsed(null); }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {!parsed && (
                    <Button onClick={handleUpload} disabled={uploading} className="mt-4 w-full gradient-primary text-primary-foreground">
                      {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Resume...</> : "Upload & Analyze"}
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Parsed Result */}
        <AnimatePresence>
          {parsed && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass border-primary/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <CardTitle className="text-lg">Resume Analyzed</CardTitle>
                  </div>
                  <CardDescription>AI extracted the following from your resume</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium text-foreground">{parsed.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium text-foreground">{parsed.experience}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {parsed.skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {parsed.technologies.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Projects</p>
                    <ul className="space-y-1">
                      {parsed.projects.map((p) => (
                        <li key={p} className="text-sm text-foreground">• {p}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default ResumeUpload;
