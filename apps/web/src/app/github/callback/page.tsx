"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"exchanging" | "success" | "error">("exchanging");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setError("No authorization code received from GitHub.");
      return;
    }

    let cancelled = false;

    async function exchange() {
      try {
        const res = await fetch("/api/github/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Failed to exchange code");
          return;
        }

        // Store token and username in localStorage
        localStorage.setItem("shipwell_github_token", data.access_token);
        if (data.username) {
          localStorage.setItem("shipwell_github_username", data.username);
        }
        if (data.avatar_url) {
          localStorage.setItem("shipwell_github_avatar", data.avatar_url);
        }

        setStatus("success");

        // Redirect to settings after a brief moment
        setTimeout(() => {
          if (!cancelled) router.push("/settings");
        }, 1500);
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setError(err.message || "Something went wrong");
        }
      }
    }

    exchange();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center max-w-sm mx-auto px-6">
        {status === "exchanging" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Connecting GitHub...</h2>
            <p className="text-text-dim text-sm">Exchanging authorization code</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-lg font-semibold mb-2">GitHub Connected!</h2>
            <p className="text-text-dim text-sm">Redirecting to settings...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Connection Failed</h2>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push("/settings")}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
