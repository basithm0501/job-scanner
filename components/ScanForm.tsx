"use client";

import { useState } from "react";

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Marketing",
  "Operations",
  "Healthcare",
  "Legal",
  "Education",
  "Customer Success",
  "HR",
  "Other",
] as const;

const YEARS_OPTIONS = ["0-2", "3-5", "6-10", "10+"] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type YearsOfExperience = (typeof YEARS_OPTIONS)[number];

export type ScanFormData = {
  jobTitle: string;
  industry: Industry;
  experience: YearsOfExperience;
  tasks: [string, string, string, string, string];
};

type ScanFormProps = {
  onSubmit: (data: ScanFormData) => void | Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60";

export function ScanForm({ onSubmit }: ScanFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState<"" | Industry>("");
  const [yearsOfExperience, setYearsOfExperience] = useState<
    "" | YearsOfExperience
  >("");
  const [task1, setTask1] = useState("");
  const [task2, setTask2] = useState("");
  const [task3, setTask3] = useState("");
  const [task4, setTask4] = useState("");
  const [task5, setTask5] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!industry || !yearsOfExperience) {
      form.reportValidity();
      return;
    }

    const data: ScanFormData = {
      jobTitle: jobTitle.trim(),
      industry,
      experience: yearsOfExperience,
      tasks: [
        task1.trim(),
        task2.trim(),
        task3.trim(),
        task4.trim(),
        task5.trim(),
      ],
    };

    setLoading(true);
    try {
      await Promise.resolve(onSubmit(data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-lg space-y-5 rounded-xl border border-zinc-800 bg-[#0f0f0f] p-6 text-white"
    >
      <div>
        <label htmlFor="job-title" className="mb-1 block text-sm text-zinc-300">
          Job Title
        </label>
        <input
          id="job-title"
          name="jobTitle"
          type="text"
          required
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className={inputClass}
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="industry" className="mb-1 block text-sm text-zinc-300">
          Industry
        </label>
        <select
          id="industry"
          name="industry"
          required
          value={industry}
          onChange={(e) => setIndustry(e.target.value as Industry | "")}
          className={inputClass}
          disabled={loading}
        >
          <option value="" disabled>
            Select industry
          </option>
          {INDUSTRIES.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="years" className="mb-1 block text-sm text-zinc-300">
          Years of Experience
        </label>
        <select
          id="years"
          name="yearsOfExperience"
          required
          value={yearsOfExperience}
          onChange={(e) =>
            setYearsOfExperience(e.target.value as YearsOfExperience | "")
          }
          className={inputClass}
          disabled={loading}
        >
          <option value="" disabled>
            Select range
          </option>
          {YEARS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-3 border-0 p-0">
        <legend className="mb-2 text-sm font-medium text-zinc-300">
          Top 5 Daily Tasks
        </legend>
        {[1, 2, 3, 4, 5].map((n) => {
          const value = [task1, task2, task3, task4, task5][n - 1];
          const setter = [setTask1, setTask2, setTask3, setTask4, setTask5][
            n - 1
          ];
          return (
            <div key={n}>
              <label
                htmlFor={`task-${n}`}
                className="mb-1 block text-sm text-zinc-300"
              >
                Task {n}
              </label>
              <input
                id={`task-${n}`}
                name={`task${n}`}
                type="text"
                required
                value={value}
                onChange={(e) => setter(e.target.value)}
                className={inputClass}
                disabled={loading}
              />
            </div>
          );
        })}
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#f59e0b] px-4 py-3 font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Analyzing..." : "Scan My Job Security →"}
      </button>
    </form>
  );
}
