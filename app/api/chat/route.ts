// app/api/chat/route.ts
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Force Node runtime so fs + Neon work on Vercel
export const runtime = "nodejs";
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const sql = neon(process.env.POSTGRES_URL!);

// type UserInfo = { ip?: string | null; userAgent?: string | null; timestamp?: string };

/**
 * EXACT prompt-loading behavior from your other file:
 * - Reads prompts/system-prompt.md
 * - Finds the line starting with "You are an AI consultant"
 * - Slices from there, strips markdown headings and bold
 * - Falls back to a default if file not found
 */
function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), "prompts", "system-prompt.md");
    const promptContent = fs.readFileSync(promptPath, "utf8");
    const lines = promptContent.split("\n");
    const contentStart = lines.findIndex((line) => line.startsWith("You are an AI consultant"));
    return lines
      .slice(contentStart)
      .join("\n")
      .replace(/#+\s*/g, "")
      .replace(/\*\*/g, "");
  } catch {
    console.warn("Could not load system prompt file, using default");
    return `You are Milo, an AI consultant for Archpoint Labs, a cutting-edge consulting firm specializing in AI transformation. 
    You help businesses understand how AI can solve their challenges through strategy, implementation, automation, and training. 
    Be professional, helpful, and solution-oriented while guiding potential clients toward deeper engagement with our services.`;
  }
}

/**
 * EXACT Neon logging behavior from your other file, adapted to be called
 * after streaming completes so we can log the full assistant response.
 */
async function logConversation(messages: any[], response: string, userInfo?: UserInfo) {
  try {
    const sessionId = Date.now().toString();
    await sql`
      INSERT INTO conversations (session_id, ip, user_agent, message_count, messages, ai_response)
      VALUES (
        ${sessionId},
        ${userInfo?.ip ?? "unknown"},
        ${userInfo?.userAgent ?? "unknown"},
        ${messages.length},
        ${JSON.stringify(messages)}::jsonb,
        ${response}
      )
    `;
    console.log(`💬 Conversation logged to Neon: ${sessionId}`);
  } catch (err) {
    console.error("Error logging conversation:", err);
  }
}

// ...imports and helpers (getSystemPrompt, logConversation) stay the same

type UserInfo = { ip: string; userAgent?: string | null; timestamp?: string };

export async function POST(req: NextRequest) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const systemPrompt = getSystemPrompt();

  // Get IP from headers (NextRequest has no `.ip`)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const userInfo: UserInfo = {
    ip,
    userAgent: req.headers.get("user-agent"),
    timestamp: new Date().toISOString(),
  };

  // We'll compute final text inside onFinish:
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    system: systemPrompt,

    // ✅ Keep just onFinish; remove onToken
    onFinish: async ({ responseMessages }: any) => {
      try {
        // Pull the assistant message text from responseMessages
        const assistant = responseMessages?.find((m: any) => m.role === "assistant");
        const finalResponseText =
          typeof assistant?.content === "string"
            ? assistant.content
            : (assistant?.content ?? [])
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("");

        await logConversation(messages as any[], finalResponseText ?? "", userInfo);
      } catch (err) {
        console.error("logConversation failed:", err);
      }
    },
  });

  // (optional) debug prints left as-is
  console.dir(messages, { depth: null });
  console.table(
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.parts.filter((p) => p.type === "text").map((p) => p.text).join(""),
    }))
  );

  return result.toUIMessageStreamResponse();
}