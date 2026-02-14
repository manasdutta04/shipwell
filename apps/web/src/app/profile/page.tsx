"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, LogOut, Shield, Key, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/components/auth-provider";
import { useApiKey } from "@/hooks/use-api-key";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, signOut } = useAuth();
  const { isConnected } = useApiKey();

  if (!user) return null;

  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "Unknown";

  const lastSignIn = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Unknown";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-16 h-16 rounded-full border-2 border-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent text-2xl font-bold border-2 border-border">
                  {user.displayName?.[0] || user.email?.[0] || "?"}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{user.displayName || "User"}</h1>
                <p className="text-text-muted text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Account Details</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Shield className="w-4 h-4" />
                  Provider
                </div>
                <span className="text-sm">Google</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" />
                  Joined
                </div>
                <span className="text-sm">{createdAt}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Calendar className="w-4 h-4" />
                  Last sign in
                </div>
                <span className="text-sm">{lastSignIn}</span>
              </div>
            </div>
          </div>

          {/* API Key Status */}
          <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className={`w-5 h-5 ${isConnected ? "text-success" : "text-text-dim"}`} />
                <div>
                  <h2 className="font-semibold text-sm">API Connection</h2>
                  <p className="text-xs text-text-dim">
                    {isConnected ? "Anthropic API key connected" : "No API key connected"}
                  </p>
                </div>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                {isConnected ? "Manage" : "Connect"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors w-full justify-center border border-danger/20"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </motion.div>
      </main>
    </div>
  );
}
