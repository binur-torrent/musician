"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedKey = localStorage.getItem("musician-install-dismissed");
    if (dismissedKey) {
      setDismissed(true);
      return;
    }

    if (isIos()) {
      setShowIosHelp(true);
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem("musician-install-dismissed", "1");
    setDismissed(true);
    setShowIosHelp(false);
    setDeferredPrompt(null);
  }

  async function installAndroid() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  }

  if (dismissed || isStandalone()) return null;

  if (showIosHelp) {
    return (
      <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-accent">Install Musician</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap <Share className="inline h-4 w-4" /> Share, then{" "}
              <strong>Add to Home Screen</strong> to use it like a native app
              and listen offline anywhere.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-accent">Install Musician</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add to your home screen for offline playback anywhere.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss install prompt"
          onClick={dismiss}
          className="cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => void installAndroid()}
        className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
      >
        <Download className="h-4 w-4" />
        Install app
      </button>
    </div>
  );
}
