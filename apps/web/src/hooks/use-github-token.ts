"use client";

import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "shipwell_github_token";
const USERNAME_KEY = "shipwell_github_username";
const AVATAR_KEY = "shipwell_github_avatar";

export function useGitHubToken() {
  const [token, setTokenState] = useState<string>("");
  const [username, setUsernameState] = useState<string>("");
  const [avatarUrl, setAvatarUrlState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTokenState(localStorage.getItem(TOKEN_KEY) || "");
    setUsernameState(localStorage.getItem(USERNAME_KEY) || "");
    setAvatarUrlState(localStorage.getItem(AVATAR_KEY) || "");
    setLoaded(true);
  }, []);

  // Re-read from localStorage when window regains focus (after OAuth redirect back)
  useEffect(() => {
    const handleFocus = () => {
      setTokenState(localStorage.getItem(TOKEN_KEY) || "");
      setUsernameState(localStorage.getItem(USERNAME_KEY) || "");
      setAvatarUrlState(localStorage.getItem(AVATAR_KEY) || "");
    };
    // Also listen to storage events (for cross-tab updates from callback page)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USERNAME_KEY || e.key === AVATAR_KEY) {
        handleFocus();
      }
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const disconnect = useCallback(() => {
    setTokenState("");
    setUsernameState("");
    setAvatarUrlState("");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(AVATAR_KEY);
  }, []);

  const setToken = useCallback((t: string) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const isConnected = loaded && token.length > 0;

  return { token, setToken, username, avatarUrl, isConnected, loaded, disconnect };
}
