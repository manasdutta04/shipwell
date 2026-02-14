"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "shipwell_api_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKeyState(stored);
    setLoaded(true);
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isConnected = loaded && apiKey.length > 0;

  return { apiKey, setApiKey, isConnected, loaded };
}
