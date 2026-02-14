"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ship, Zap, Shield, Layers, Scan } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { LogoLoader } from "@/components/logo-loader";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/analysis");
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LogoLoader size={48} />
    </div>
  );
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-radial-glow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5 glow-accent"
          >
            <Ship className="w-8 h-8 text-accent" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome to <span className="gradient-text">Shipwell</span></h1>
          <p className="text-text-muted text-sm leading-relaxed">
            Full Codebase Autopilot powered by Claude
          </p>
        </div>

        {/* Sign-in Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-black/30"
        >
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all duration-200 text-[15px] shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-5 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: "Secure" },
                { icon: Layers, label: "Cross-file" },
                { icon: Scan, label: "Deep analysis" },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <f.icon className="w-4 h-4 text-text-dim mx-auto mb-1" />
                  <span className="text-[10px] text-text-dim">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-dim">
            <Zap className="w-3 h-3" />
            Your API key stays in your browser — never on our servers
          </div>
          <p className="text-text-dim text-[11px] mt-2">
            Built for the Built with Opus 4.6 Hackathon
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
