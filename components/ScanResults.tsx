"use client";

export type ScanThreat = {
  task: string;
  reason: string;
};

export type ScanProtectionMonth = {
  skill: string;
  action: string;
  timePerWeek: number | string;
};

/** Shape returned from /api/scan (Claude JSON). */
export type ScanResultPayload = {
  riskScore: number;
  riskLabel: string;
  riskSummary: string;
  topThreats: ScanThreat[];
  protectionPlan?: {
    month1: ScanProtectionMonth;
    month2: ScanProtectionMonth;
    month3: ScanProtectionMonth;
  };
  safeSkills?: string[];
  urgencyMessage: string;
};

type ScanResultsProps = {
  result: ScanResultPayload;
  onPayClick: () => void;
  unlocked?: boolean;
};

function riskScoreStyles(score: number): string {
  const n = Math.min(10, Math.max(1, Math.round(score)));
  if (n <= 3) return "bg-emerald-600 text-white ring-emerald-500/40";
  if (n <= 6) return "bg-yellow-500 text-zinc-900 ring-yellow-400/50";
  if (n <= 8) return "bg-orange-500 text-white ring-orange-400/40";
  return "bg-red-600 text-white ring-red-500/40";
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3A5.25 5.25 0 0 0 12 1.5Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RedactedThreatRow({ threat }: { threat?: ScanThreat }) {
  const taskLine =
    threat?.task ??
    "Additional threat analysis — unlock full report to reveal.";
  const reasonLine =
    threat?.reason ??
    "Detailed reasoning available in the paid breakdown.";

  return (
    <div className="relative flex gap-3 rounded-lg border border-zinc-700/80 bg-zinc-800/40 px-4 py-3">
      <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500/90" />
      <div className="min-w-0 flex-1 select-none">
        <p className="blur-sm opacity-50">{taskLine}</p>
        <p className="mt-1 blur-sm opacity-50">{reasonLine}</p>
      </div>
    </div>
  );
}

export function ScanResults({ result, onPayClick, unlocked = false }: ScanResultsProps) {
  const threats = Array.isArray(result.topThreats) ? result.topThreats : [];
  const firstThreat = threats[0];
  const secondThreat = threats[1];
  const thirdThreat = threats[2];
  const score = Number(result.riskScore);
  const displayScore = Number.isFinite(score)
    ? Math.min(10, Math.max(1, Math.round(score)))
    : 1;

  return (
    <div className="w-full max-w-2xl space-y-10 text-white">
      {/* STATE 1 — free preview */}
      <section
        className="space-y-6 rounded-xl border border-zinc-800 bg-[#0f0f0f] p-6 md:p-8"
        aria-label="Free preview"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div
            className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-4xl font-bold ring-4 ${riskScoreStyles(displayScore)}`}
            aria-label={`Risk score ${displayScore} out of 10`}
          >
            {displayScore}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Risk level
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              {result.riskLabel}
            </h2>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-400">Summary</h3>
          <p className="text-base leading-relaxed text-zinc-200 md:text-lg">
            {result.riskSummary}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-400">
            Top automation threats
          </h3>
          {unlocked ? (
            <ul className="space-y-3">
              {threats.slice(0, 3).map((threat, index) => (
                <li
                  key={`${threat.task}-${index}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3"
                >
                  <p className="font-medium text-white">{threat.task}</p>
                  <p className="mt-1 text-sm text-zinc-300">{threat.reason}</p>
                </li>
              ))}
              {threats.length === 0 ? (
                <li className="rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500">
                  No threat breakdown available.
                </li>
              ) : null}
            </ul>
          ) : (
            <ul className="space-y-3">
              {firstThreat ? (
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3">
                  <p className="font-medium text-white">{firstThreat.task}</p>
                  <p className="mt-1 text-sm text-zinc-300">{firstThreat.reason}</p>
                </li>
              ) : (
                <li className="rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-500">
                  No threat breakdown available.
                </li>
              )}
              <li>
                <RedactedThreatRow threat={secondThreat} />
              </li>
              <li>
                <RedactedThreatRow threat={thirdThreat} />
              </li>
            </ul>
          )}
        </div>

        <div
          className="rounded-lg border-l-4 border-amber-500 bg-zinc-900/70 px-4 py-4 md:px-5 md:py-5"
          role="status"
        >
          <p className="text-base font-semibold leading-snug text-amber-100 md:text-lg">
            {result.urgencyMessage}
          </p>
        </div>
      </section>

      {/* STATE 2 — paywall / unlocked full content */}
      <section
        className="space-y-6 rounded-xl border border-zinc-800 bg-[#0f0f0f] p-6 md:p-8"
        aria-label={unlocked ? "Unlocked full report" : "Locked full report"}
      >
        {unlocked ? (
          <>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-500">
                90-day protection plan
              </h3>
              <ul className="space-y-3">
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-3 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Month 1</p>
                  <p>Skill: {result.protectionPlan?.month1?.skill ?? "N/A"}</p>
                  <p>Action: {result.protectionPlan?.month1?.action ?? "N/A"}</p>
                  <p>Time/Week: {String(result.protectionPlan?.month1?.timePerWeek ?? "N/A")} hrs</p>
                </li>
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-3 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Month 2</p>
                  <p>Skill: {result.protectionPlan?.month2?.skill ?? "N/A"}</p>
                  <p>Action: {result.protectionPlan?.month2?.action ?? "N/A"}</p>
                  <p>Time/Week: {String(result.protectionPlan?.month2?.timePerWeek ?? "N/A")} hrs</p>
                </li>
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-3 text-sm text-zinc-300">
                  <p className="font-semibold text-white">Month 3</p>
                  <p>Skill: {result.protectionPlan?.month3?.skill ?? "N/A"}</p>
                  <p>Action: {result.protectionPlan?.month3?.action ?? "N/A"}</p>
                  <p>Time/Week: {String(result.protectionPlan?.month3?.timePerWeek ?? "N/A")} hrs</p>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-500">
                Automation-proof skills
              </h3>
              <ul className="flex flex-wrap gap-2">
                {(result.safeSkills ?? []).map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-200"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="pointer-events-none select-none">
              <h3 className="mb-3 text-sm font-semibold text-zinc-500">
                90-day protection plan
              </h3>
              <ul className="space-y-3 blur-sm opacity-50">
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm text-zinc-300">
                  Month One — Foundation sprint
                </li>
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm text-zinc-300">
                  Month Two — Capability build
                </li>
                <li className="rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm text-zinc-300">
                  Month Three — Proof & positioning
                </li>
              </ul>
            </div>

            <div className="pointer-events-none select-none">
              <h3 className="mb-3 text-sm font-semibold text-zinc-500">
                Automation-proof skills
              </h3>
              <ul className="flex flex-wrap gap-2 blur-sm opacity-50">
                <li className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  Skill alpha
                </li>
                <li className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  Skill beta
                </li>
                <li className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  Skill gamma
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-zinc-900/80 p-6 shadow-lg shadow-black/40 md:p-8">
              <h3 className="text-xl font-bold text-white md:text-2xl">
                Your Full Protection Plan is Ready
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 md:text-base">
                Unlock your complete 90-day skill roadmap, all 3 threat
                breakdowns, and your automation-proof skill stack.
              </p>
              <button
                type="button"
                onClick={onPayClick}
                className="mt-6 w-full rounded-lg bg-[#f59e0b] px-4 py-3.5 text-base font-semibold text-zinc-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Unlock Full Report — $17
              </button>
              <p className="mt-3 text-center text-xs text-zinc-500">
                One-time payment. Instant access.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
