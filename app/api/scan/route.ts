import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a brutally honest career risk analyst. You analyze jobs 
for automation risk based on current AI/robotics research. 
You respond ONLY in valid JSON, no markdown, no explanation outside 
the JSON structure.`;

const JSON_INSTRUCTION = `Return ONLY this JSON structure:
{
  "riskScore": <number 1-10>,
  "riskLabel": <"Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk">,
  "riskSummary": <2 sentence plain English explanation of overall risk, max 50 words>,
  "topThreats": [
    { "task": <which of their tasks>, "reason": <why it's at risk, max 20 words> },
    { "task": <second task>, "reason": <why> },
    { "task": <third task>, "reason": <why> }
  ],
  "protectionPlan": {
    "month1": { "skill": <skill name>, "action": <specific course or cert>, "timePerWeek": <hours> },
    "month2": { "skill": <skill name>, "action": <specific course or cert>, "timePerWeek": <hours> },
    "month3": { "skill": <skill name>, "action": <specific course or cert>, "timePerWeek": <hours> }
  },
  "safeSkills": [<skill 1>, <skill 2>, <skill 3>],
  "urgencyMessage": <one punchy sentence about what happens if they do nothing, max 20 words>
}`;

const MODEL_CANDIDATES = ["claude-sonnet-4-6", "claude-3-7-sonnet-latest"] as const;

type ScanRequestBody = {
  jobTitle: string;
  industry: string;
  experience: string;
  tasks: string[];
};

type JsonObject = Record<string, unknown>;

function isScanRequestBody(body: unknown): body is ScanRequestBody {
  if (body === null || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (typeof o.jobTitle !== "string") return false;
  if (typeof o.industry !== "string") return false;
  if (typeof o.experience !== "string") return false;
  if (!Array.isArray(o.tasks)) return false;
  if (o.tasks.length !== 5) return false;
  return o.tasks.every((t) => typeof t === "string");
}

function buildUserPrompt(data: ScanRequestBody): string {
  const numberedTasks = data.tasks
    .map((task, i) => `${i + 1}. ${task}`)
    .join("\n");

  return `Analyze this job for automation risk:
Job Title: ${data.jobTitle}
Industry: ${data.industry}  
Experience Level: ${data.experience} years
Daily Tasks:
${numberedTasks}

${JSON_INSTRUCTION}`;
}

function extractTextContent(message: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("").trim();
}

function safeParseModelJson(text: string): JsonObject | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }
    return null;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      const sliced = JSON.parse(text.slice(start, end + 1)) as unknown;
      if (sliced && typeof sliced === "object" && !Array.isArray(sliced)) {
        return sliced as JsonObject;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[/api/scan] Missing ANTHROPIC_API_KEY");
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY" },
        { status: 500 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error("[/api/scan] Invalid JSON body");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 500 });
    }

    if (!isScanRequestBody(body)) {
      console.error("[/api/scan] Invalid payload shape", body);
      return NextResponse.json(
        {
          error:
            "Expected body: { jobTitle: string, industry: string, experience: string, tasks: string[] (5 items) }",
        },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const userPrompt = buildUserPrompt(body);
    console.info(
      "[/api/scan] Sending scan request",
      JSON.stringify({
        jobTitle: body.jobTitle,
        industry: body.industry,
        experience: body.experience,
        tasksCount: body.tasks.length,
      }),
    );

    let message: Anthropic.Message | null = null;
    let lastError: unknown = null;
    let usedModel: string | null = null;

    for (const model of MODEL_CANDIDATES) {
      try {
        message = await anthropic.messages.create({
          model,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });
        usedModel = model;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`[/api/scan] Model attempt failed: ${model}`, error);
      }
    }

    if (!message) {
      throw lastError instanceof Error ? lastError : new Error("No model succeeded");
    }

    const text = extractTextContent(message);
    if (!text) {
      console.error("[/api/scan] Empty text response from model");
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 500 },
      );
    }

    const parsed = safeParseModelJson(text);
    if (!parsed) {
      console.error("[/api/scan] Model returned non-JSON content", text);
      return NextResponse.json(
        { error: "Model did not return valid JSON" },
        { status: 500 },
      );
    }

    console.info(`[/api/scan] Scan completed successfully with model: ${usedModel}`);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/scan] Unexpected failure", err);
    return NextResponse.json({ error: `Scan failed: ${message}` }, { status: 500 });
  }
}
