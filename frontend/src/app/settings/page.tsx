"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Eye, EyeOff, Save, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

const apiProviders = [
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "gemini", name: "Google Gemini", placeholder: "AIza..." },
  { id: "claude", name: "Anthropic Claude", placeholder: "sk-ant-..." },
];

const SettingsPage = () => {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedKeys = localStorage.getItem("ai_interview_keys");
    if (savedKeys) {
      setKeys(JSON.parse(savedKeys));
    }
  }, []);

  const handleSave = (providerId: string, providerName: string) => {
    localStorage.setItem("ai_interview_keys", JSON.stringify(keys));
    toast.success(`${providerName} API key saved locally`);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your API keys and preferences</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">API Keys (BYOK)</CardTitle>
            </div>
            <CardDescription>Bring your own API keys. Keys are stored locally in your browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiProviders.map((provider) => (
              <motion.div key={provider.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <Label htmlFor={provider.id} className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  {provider.name}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={provider.id}
                      type={visible[provider.id] ? "text" : "password"}
                      placeholder={provider.placeholder}
                      value={keys[provider.id] || ""}
                      onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                      className="bg-secondary/50 pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setVisible({ ...visible, [provider.id]: !visible[provider.id] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {visible[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button onClick={() => handleSave(provider.id, provider.name)} variant="outline" size="icon">
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
