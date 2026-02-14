"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ship, Settings, User, LogOut, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "./auth-provider";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
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

  const navLinks = [
    { href: "/analysis", label: "Analysis" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-accent" />
          <span className="font-bold">Shipwell</span>
        </Link>

        {user && (
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm transition-colors",
                  pathname === link.href
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:text-text hover:bg-bg-elevated"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-elevated transition-colors"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                {user.displayName?.[0] || user.email?.[0] || "?"}
              </div>
            )}
            <span className="text-sm text-text-muted hidden sm:block max-w-[120px] truncate">
              {user.displayName || user.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-dim" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-bg-card border border-border rounded-lg shadow-xl z-50 py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-text-dim truncate">{user.email}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-bg-elevated hover:text-text transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-bg-elevated hover:text-text transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
