import { NextResponse } from "next/server";
import { download } from "@/lib/agent-bucket";

// Public proxy for AgentBucket files. Keys are unguessable so this is OK
// for hackathon scale; tighten with a signed URL or auth before public launch.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const key = path.join("/");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const buf = await download(key);

    // Best-effort content-type from extension
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const mime: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      pdf: "application/pdf",
    };
    const contentType = mime[ext] ?? "application/octet-stream";

    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "File not found", detail: msg },
      { status: 404 }
    );
  }
}
