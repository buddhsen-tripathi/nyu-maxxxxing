const MAX_STRING_LEN = 400;
const MAX_DEPTH = 5;

function truncate(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[…]";

  if (typeof value === "string") {
    if (value.startsWith("data:")) return `<data-url ${value.length}b>`;
    return value.length > MAX_STRING_LEN
      ? `${value.slice(0, MAX_STRING_LEN)}… (${value.length} chars)`
      : value;
  }

  if (Array.isArray(value)) return value.map((v) => truncate(v, depth + 1));

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = truncate(v, depth + 1);
    return out;
  }

  return value;
}

export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function agentLog(reqId: string, event: string, data?: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[agent ${ts}] [${reqId}] ${event}`;
  if (data === undefined) {
    console.log(prefix);
  } else {
    console.log(prefix, truncate(data));
  }
}
