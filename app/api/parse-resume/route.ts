import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Dynamic import to avoid SSR issues with pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule: any = await import("pdf-parse");
      const pdfParse: (b: Buffer) => Promise<{ text: string }> =
        pdfParseModule.default ?? pdfParseModule;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else {
      // Plain text or unsupported — try reading as utf-8
      text = buffer.toString("utf-8").slice(0, 8000);
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file" },
        { status: 422 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system:
        "You extract structured info from a student resume. Return ONLY valid JSON with these fields: major (string), bio (string, 1-2 sentences summarising their background for a peer mentoring card), topics (array of up to 5 short strings of skills/subjects they could mentor others in). Be concise.",
      messages: [
        {
          role: "user",
          content: `Resume text:\n\n${text.slice(0, 6000)}`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse Claude response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("parse-resume error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
