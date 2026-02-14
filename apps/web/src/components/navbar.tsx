"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Ship, Settings, User, LogOut, ChevronDown, Key } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "./auth-provider";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border h-14 shrink-0">
      <div className="px-5 h-full flex items-center justify-between">
        <Link href={user ? "/analysis" : "/"} className="flex items-center gap-2 group">
          <Ship className="w-5 h-5 text-accent group-hover:text-accent-hover transition-colors" />
          <span className="font-bold text-[15px] tracking-tight">Shipwell</span>
        </Link>

        <div className="flex items-center gap-3">
          {!user && (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Sign in
            </Link>
          )}

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-all duration-150"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-full ring-1 ring-border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold ring-1 ring-accent/20">
                    {user.displayName?.[0] || user.email?.[0] || "?"}
                  </div>
                )}
                <span className="text-[13px] text-text-muted hidden sm:block max-w-[120px] truncate">
                  {user.displayName?.split(" ")[0] || user.email}
                </span>
                <ChevronDown className={clsx(
                  "w-3.5 h-3.5 text-text-dim transition-transform duration-150",
                  menuOpen && "rotate-180"
                )} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 glass border border-border rounded-xl shadow-2xl shadow-black/50 z-50 py-1 overflow-hidden">
                  <div className="px-3.5 py-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-text-dim truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-text-muted hover:bg-bg-elevated hover:text-text transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-text-muted hover:bg-bg-elevated hover:text-text transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      API Key & Model
                    </Link>
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-danger hover:bg-danger/5 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
