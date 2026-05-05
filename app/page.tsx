"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ScanForm, type ScanFormData } from "@/components/ScanForm";
import { ScanResults, type ScanResultPayload } from "@/components/ScanResults";

const SCAN_RESULT_STORAGE_KEY = "scanResult";

function HomeContent() {
  const [result, setResult] = useState<ScanResultPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!searchParams) return;
    const unlockedFromUrl = searchParams.get("unlocked") === "true";
    if (!unlockedFromUrl) {
      setSessionExpired(false);
      return;
    }

    const stored = sessionStorage.getItem(SCAN_RESULT_STORAGE_KEY);
    if (!stored) {
      setSessionExpired(true);
      setIsUnlocked(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ScanResultPayload;
      setResult(parsed);
      setIsUnlocked(true);
      setSessionExpired(false);
      setErrorMessage(null);
    } catch {
      setSessionExpired(true);
      setIsUnlocked(false);
    }
  }, [searchParams]);

  function handleStartNewScan() {
    sessionStorage.removeItem(SCAN_RESULT_STORAGE_KEY);
    setResult(null);
    setErrorMessage(null);
    setIsUnlocked(false);
    setSessionExpired(false);
    router.replace(pathname);
  }

  async function handleSubmit(data: ScanFormData) {
    try {
      setIsScanning(true);
      setErrorMessage(null);
      setSessionExpired(false);
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as ScanResultPayload | { error?: string };

      if (!response.ok) {
        console.error("Scan request failed:", response.status, result);
        const message =
          typeof result === "object" && result && "error" in result
            ? String(result.error || "Scan failed")
            : "Scan failed";
        setErrorMessage(message);
        return;
      }

      console.log("Scan Result:", result);
      setResult(result as ScanResultPayload);
      setIsUnlocked(false);
      sessionStorage.setItem(
        SCAN_RESULT_STORAGE_KEY,
        JSON.stringify(result as ScanResultPayload),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {isScanning ? <LoadingOverlay /> : null}
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
        {!result && !sessionExpired ? (
          <section className="mb-10 text-center">
            <p className="mx-auto mb-4 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-red-300">
              🔴 Layoffs are accelerating
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Is Your Job <span className="text-[#f59e0b]">AI-Proof</span>?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Get a brutally honest automation risk score for your exact role
              — and a 90-day plan to stay irreplaceable.
            </p>
            <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center gap-3 text-sm text-zinc-200 sm:flex-row sm:gap-6">
              <p>⚡ Results in 60 seconds</p>
              <p>🎯 Role-specific (not generic)</p>
              <p>🔒 One-time $17, instant access</p>
            </div>
          </section>
        ) : null}
        {errorMessage ? (
          <p className="mb-6 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}
        {sessionExpired ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
            <p className="text-zinc-200">
              Your session expired. Please run a new scan to unlock your full
              results.
            </p>
            <button
              type="button"
              onClick={handleStartNewScan}
              className="mt-5 rounded-lg bg-[#f59e0b] px-4 py-2.5 font-semibold text-zinc-900 transition hover:bg-amber-400"
            >
              Start New Scan
            </button>
          </div>
        ) : result ? (
          <ScanResults
            result={result}
            unlocked={isUnlocked}
            onPayClick={() => {
              window.open(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK, "_blank");
            }}
          />
        ) : (
          <ScanForm onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f] text-white" />}>
      <HomeContent />
    </Suspense>
  );
}
