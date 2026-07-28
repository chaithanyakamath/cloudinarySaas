"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled client error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center p-4 text-center">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full border border-error/30 space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-base-content">Application Notice</h1>
        <p className="text-xs text-error/90 font-mono bg-error/10 p-3 rounded-xl break-words">
          {error?.message || "Client hydration update in progress. Please refresh."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="btn btn-primary rounded-xl w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </button>
          <Link href="/home" className="btn btn-outline rounded-xl w-full sm:w-auto">
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
