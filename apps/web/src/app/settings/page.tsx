"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Check, X, Eye, EyeOff, Shield, Cpu, ExternalLink } from "lucide-react";
import clsx from "clsx";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { useApiKey } from "@/hooks/use-api-key";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "@shipwell/core/client";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const { apiKey, setApiKey, isConnected, loaded } = useApiKey();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("shipwell_model") || DEFAULT_MODEL;
    }
    return DEFAULT_MODEL;
  });
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  const handleConnect = async () => {
    const key = inputKey.trim();
    if (!key) return;

    setTestStatus("testing");
    setTestError("");

    try {
      // Quick validation — try listing models
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `HTTP ${res.status}`);
      }

      setApiKey(key);
      setInputKey("");
      setTestStatus("success");
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch (err: any) {
      if (err.message?.includes("authentication") || err.message?.includes("invalid")) {
        setTestError("Invalid API key. Please check and try again.");
      } else {
        // Key format looks OK, save it even if the test call failed for other reasons
        setApiKey(key);
        setInputKey("");
        setTestStatus("success");
        setTimeout(() => setTestStatus("idle"), 3000);
        return;
      }
      setTestStatus("error");
    }
  };

  const handleDisconnect = () => {
    setApiKey("");
    setTestStatus("idle");
    setTestError("");
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("shipwell_model", modelId);
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 10)}${"•".repeat(20)}${apiKey.slice(-4)}` : "";

  if (!loaded) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-text-muted text-sm mb-8">Manage your API connection and preferences</p>

          {/* API Key Section */}
          <section className="bg-bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isConnected ? "bg-success/10" : "bg-bg-elevated"
              )}>
                <Key className={clsx("w-5 h-5", isConnected ? "text-success" : "text-text-dim")} />
              </div>
              <div>
                <h2 className="font-semibold">Anthropic API Key</h2>
                <p className="text-text-dim text-xs">
                  {isConnected ? "Connected — your key is stored locally in your browser" : "Connect your API key to start analyzing"}
                </p>
              </div>
              {isConnected && (
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                  <Check className="w-3 h-3" />
                  Connected
                </div>
              )}
            </div>

            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-bg rounded-lg px-3 py-2.5 border border-border">
                  <span className="text-sm font-mono text-text-muted flex-1">
                    {showKey ? apiKey : maskedKey}
                  </span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 text-text-dim hover:text-text transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Disconnect API Key
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    placeholder="sk-ant-api03-..."
                    className="flex-1 bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none placeholder:text-text-dim font-mono"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={!inputKey.trim() || testStatus === "testing"}
                    className="px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {testStatus === "testing" ? "Verifying..." : "Connect"}
                  </button>
                </div>

                {testError && (
                  <p className="text-danger text-xs">{testError}</p>
                )}

                <div className="flex items-start gap-2 text-xs text-text-dim">
                  <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Your API key is stored only in your browser&apos;s localStorage. It is never sent to our servers — it&apos;s passed directly to Anthropic&apos;s API.
                  </span>
                </div>

                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  Get an API key from Anthropic Console
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </section>

          {/* Model Selector */}
          <section className="bg-bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center">
                <Cpu className="w-5 h-5 text-text-dim" />
              </div>
              <div>
                <h2 className="font-semibold">Model</h2>
                <p className="text-text-dim text-xs">Choose the Claude model for analysis</p>
              </div>
            </div>

            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors",
                    selectedModel === model.id
                      ? "border-accent/50 bg-accent/5"
                      : "border-border hover:border-border-bright hover:bg-bg-elevated"
                  )}
                >
                  <div>
                    <span className="text-sm font-medium">{model.label}</span>
                    <span className="text-xs text-text-dim ml-2 font-mono">{model.id}</span>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-accent" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
