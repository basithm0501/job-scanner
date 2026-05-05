"use client";

const MESSAGES = [
  "Analyzing your role against 2,400 job categories...",
  "Cross-referencing McKinsey automation data...",
  "Building your protection plan...",
  "Almost done...",
] as const;

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-8 h-14 w-14 rounded-full bg-[#f59e0b] loading-pulse-circle" />
        <div className="relative h-16 w-full">
          {MESSAGES.map((message, index) => (
            <p
              key={message}
              className="loading-rotating-text absolute inset-0 m-auto flex items-center justify-center text-lg font-medium text-zinc-100"
              style={{ animationDelay: `${index * 2}s` }}
            >
              {message}
            </p>
          ))}
        </div>
      </div>
      <style jsx>{`
        .loading-pulse-circle {
          animation: pulseCircle 1.8s ease-in-out infinite;
        }

        .loading-rotating-text {
          opacity: 0;
          animation: rotateMessage 8s linear infinite;
        }

        @keyframes pulseCircle {
          0% {
            transform: scale(0.92);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(0.92);
            opacity: 0.7;
          }
        }

        @keyframes rotateMessage {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          6% {
            opacity: 1;
            transform: translateY(0);
          }
          22% {
            opacity: 1;
            transform: translateY(0);
          }
          28% {
            opacity: 0;
            transform: translateY(-6px);
          }
          100% {
            opacity: 0;
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}
