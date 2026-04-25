const BASE_URL = "https://bucket0.com/api/agent-bucket";

function getKey(): string {
  const key = process.env.BUCKET0_AGENT_BUCKET;
  if (!key) throw new Error("BUCKET0_AGENT_BUCKET is not set");
  return key;
}

function headers(): HeadersInit {
  return { Authorization: `Bearer ${getKey()}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;

  const status = res.status;
  const body = await res.text().catch(() => "");

  if (status === 401) throw new Error("AgentBucket: invalid or revoked key");
  if (status === 402) throw new Error(`AgentBucket: plan limit hit — ${body}`);
  if (status === 429) throw new Error("AgentBucket: rate limited, try again later");
  throw new Error(`AgentBucket: ${status} — ${body}`);
}

// ── Types ──

export interface UploadResult {
  success: boolean;
  key: string;
  fileName: string;
  size: number;
  destination: "agent" | "drive";
}

export interface BucketFile {
  key: string;
  fileName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface ListResult {
  files: BucketFile[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface DeleteResult {
  success: boolean;
}

export interface FolderResult {
  success: boolean;
}

// ── Operations ──

export async function upload(
  file: Blob | Buffer,
  filename: string,
  contentType?: string,
): Promise<UploadResult> {
  const form = new FormData();

  const blob =
    file instanceof Blob
      ? file
      : new Blob([new Uint8Array(file)], {
          type: contentType ?? "application/octet-stream",
        });

  form.append("file", blob, filename);
  form.append("filename", filename);

  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: "POST",
    headers: headers(),
    body: form,
  });

  return handleResponse<UploadResult>(res);
}

export async function list(
  page = 1,
  pageSize = 100,
): Promise<ListResult> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await fetch(`${BASE_URL}/files?${params}`, {
    headers: headers(),
  });

  return handleResponse<ListResult>(res);
}

export async function download(key: string): Promise<ArrayBuffer> {
  const params = new URLSearchParams({ key });

  const res = await fetch(`${BASE_URL}/files/download?${params}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AgentBucket download: ${res.status} — ${body}`);
  }

  return res.arrayBuffer();
}

export async function remove(key: string): Promise<DeleteResult> {
  const params = new URLSearchParams({ key });

  const res = await fetch(`${BASE_URL}/files?${params}`, {
    method: "DELETE",
    headers: headers(),
  });

  return handleResponse<DeleteResult>(res);
}

export async function createFolder(path: string): Promise<FolderResult> {
  const res = await fetch(`${BASE_URL}/files/folder`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  return handleResponse<FolderResult>(res);
}
