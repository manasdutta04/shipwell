"use client";

import {
  ConsentManagerProvider,
  CookieBanner,
  ConsentManagerDialog,
} from "@c15t/nextjs";
import type { ReactNode } from "react";

export function ConsentManager({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: "offline",
        react: {
          colorScheme: "dark",
        },
        legalLinks: {
          privacyPolicy: { href: "/privacy", label: "Privacy Policy" },
          termsOfService: { href: "/terms", label: "Terms of Service" },
        },
      }}
    >
      {children}
      <CookieBanner
        legalLinks={["privacyPolicy", "termsOfService"]}
        theme={{
          "banner.root": {
            style: {
              "--banner-font-family": "var(--font-mono)",
            },
          },
          "banner.overlay": {
            style: { backgroundColor: "rgba(0, 0, 0, 0.4)" },
          },
          "banner.card": {
            style: {
              background: "#111113",
              border: "1px solid #2a2a30",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            },
          },
          "banner.header.title": {
            style: { color: "#f0f0f0" },
          },
          "banner.header.description": {
            style: { color: "#9a9aaa" },
          },
          "banner.footer.reject-button": {
            style: {
              background: "transparent",
              border: "1px solid #2a2a30",
              color: "#9a9aaa",
              borderRadius: "10px",
            },
          },
          "banner.footer.customize-button": {
            style: {
              background: "transparent",
              border: "1px solid #2a2a30",
              color: "#9a9aaa",
              borderRadius: "10px",
            },
          },
          "banner.footer.accept-button": {
            style: {
              background: "#6366f1",
              color: "#ffffff",
              borderRadius: "10px",
            },
          },
        }}
      />
      <ConsentManagerDialog
        theme={{
          "dialog.root": {
            style: {
              fontFamily: "var(--font-mono)",
            },
          },
          "dialog.overlay": {
            style: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
          },
          "dialog.card": {
            style: {
              background: "#111113",
              border: "1px solid #2a2a30",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            },
          },
          "dialog.title": {
            style: { color: "#f0f0f0" },
          },
          "dialog.description": {
            style: { color: "#9a9aaa" },
          },
          "widget.footer.reject-button": {
            style: {
              background: "transparent",
              border: "1px solid #2a2a30",
              color: "#9a9aaa",
              borderRadius: "10px",
            },
          },
          "widget.footer.accept-button": {
            style: {
              background: "#6366f1",
              color: "#ffffff",
              borderRadius: "10px",
            },
          },
          "widget.footer.save-button": {
            style: {
              background: "#6366f1",
              color: "#ffffff",
              borderRadius: "10px",
            },
          },
          "widget.accordion.trigger": {
            style: { color: "#f0f0f0" },
          },
          "widget.accordion.content": {
            style: { color: "#9a9aaa" },
          },
        }}
      />
    </ConsentManagerProvider>
  );
}
