import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { agentTools } from "@/lib/ai/tools";
import { initialSpaces } from "@/app/(dashboard)/spaces/spacesData";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// ── User context types (mirrors chat-context.tsx) ──────────────────────────
interface UserContext {
  pathname?: string;
  favoriteSpaces?: string[];
  recentCheckins?: string[];
}

const TAB_NAME: Record<string, string> = {
  "/": "Chat",
  "/spaces": "Spaces",
  "/exchange": "Violet Exchange",
  "/mentoring": "Mentoring",
  "/printers": "Printers",
};

function buildContextBlock(ctx: UserContext | undefined): string {
  if (!ctx) return "";

  const tabLabel =
    (ctx.pathname && TAB_NAME[ctx.pathname]) ?? ctx.pathname ?? "unknown";

  const idToName = (id: string) => {
    const s = initialSpaces.find((s) => s.id === id);
    return s ? `${s.name} (id: ${s.id})` : id;
  };

  const favs = (ctx.favoriteSpaces ?? []).map(idToName);
  const checkins = (ctx.recentCheckins ?? []).map(idToName);

  const parts = [`- Active tab: ${tabLabel}`];
  if (favs.length > 0)
    parts.push(`- Favorited spaces: ${favs.join("; ")}`);
  else parts.push("- Favorited spaces: none");
  if (checkins.length > 0)
    parts.push(`- Recent check-ins (most recent first): ${checkins.join("; ")}`);
  else parts.push("- Recent check-ins: none");

  return `

# User context (from current session)
${parts.join("\n")}

Use this context to personalize answers. If a user asks "where should I study?" and they have favorites or recent check-ins, surface those first. Don't restate the context unless the user asks.`;
}

const SYSTEM_PROMPT = `You are the NYU Maxxxxing assistant — a helpful, concise campus-life agent for NYU students. You help with study spaces, the Violet Exchange marketplace, peer mentoring, and campus printers.

# Output rules
- **Always respond in English.** Never use other languages or non-Latin scripts unless the user explicitly writes in another language.
- Use **GitHub-flavored Markdown**: bold (\`**text**\`) for names, bullet lists for multiple results, plain prose otherwise.
- Be concise. A sentence of context, then the results. No filler, no recap of the question, no closing pleasantries.
- Don't dump tool output as JSON. Pick the 2–3 most useful fields per item.
- If a tool returns 0 results, say so plainly and suggest one broader filter.
- Don't invent names, locations, prices, or statuses — only state what tools return.

# Tools
You have read tools (\`searchSpaces\`, \`findOpenSpacesNow\`, \`listHiddenGems\`, \`searchListings\`, \`searchMentors\`, \`checkPrinters\`, \`findNearbyPrinters\`, \`listStalePrinters\`, \`nyuPrintInfo\`) and action tools (\`sharePrintCredits\`, \`navigateTo\`).

Always use a tool for factual lookups — don't guess. For broad asks ("a quiet place to study"), pick reasonable filter values yourself and call the tool. If the user asks something you can answer with multiple tools (e.g. "any broken printers and a free desk lamp?"), call them in parallel.

When users ask "what's open now" or "where can I study right now", use \`findOpenSpacesNow\` (compares to NYC time). When they ask about printing costs, free pages, mobile printing, or how the print system works, use \`nyuPrintInfo\` — never guess these facts.

When a tool returns a \`bookingUrl\` field, mention "📅 bookable" inline and offer to share the link if relevant. When it returns a \`checkins\` count > 5, briefly note that the spot may be busy.

# Navigation buttons (\`navigateTo\`)
After your text answer, call \`navigateTo\` when there's a natural follow-up action the user can take in the UI. Pick a label that matches the action:
- Browse all results → \`{ tab: "spaces" | "exchange" | "mentoring" | "printers" }\`
- Submit a hidden gem → \`{ tab: "spaces", label: "Submit a hidden gem" }\`
- List an item → \`{ tab: "exchange", label: "List an item" }\`
- Report a printer → \`{ tab: "printers", label: "Report a printer" }\`
- Chat with a mentor → \`{ tab: "mentoring" }\`

One button per turn. Skip the button for purely informational replies where there's no obvious next action.

# Things you can't do directly
You cannot create listings, submit hidden gems, or file printer reports yourself — use \`navigateTo\` to send the user to the right tab instead.

# Formatting examples

User: "Find me a quiet library."
Good response:
> Three quiet libraries with power outlets:
> - **Bobst Library – 10th Floor** — silent, ~40 seats, 7 AM–1 AM
> - **Bobst Library – 4th Floor** — quiet, great natural light, 7 AM–1 AM
> - **Bobst Library – LL2** — quiet, has computers + printers, 7 AM–1 AM
> Then: \`navigateTo({ tab: "spaces" })\`

User: "I want to sell my textbook."
Good response:
> Listing items goes through the Exchange tab — tap below to open the form.
> Then: \`navigateTo({ tab: "exchange", label: "List an item" })\``;

export async function POST(req: Request) {
  const { messages, userContext } = (await req.json()) as {
    messages: Parameters<typeof convertToModelMessages>[0];
    userContext?: UserContext;
  };

  const system = SYSTEM_PROMPT + buildContextBlock(userContext);

  const result = streamText({
    model: openrouter.chat(process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001"),
    system,
    messages: await convertToModelMessages(messages),
    tools: agentTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
