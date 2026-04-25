"use server";

import { upload } from "@/lib/agent-bucket";

export interface ChatImageUploadResult {
  fileName: string;
  publicUrl: string; // /api/files/<key>
}

/**
 * Upload a single image attached in chat to AgentBucket and return a
 * publicly-fetchable URL via the /api/files proxy. Used so the agent can
 * reference uploaded photos by URL when calling tools (e.g. createExchangeListing).
 */
export async function uploadChatImageAction(
  formData: FormData
): Promise<{ success: true; result: ChatImageUploadResult } | { success: false; error: string }> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Only image files are supported" };
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "Image exceeds 10 MB limit" };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `chat/uploads/${Date.now()}-${safeName}`;

    const result = await upload(file, path, file.type || "image/jpeg");

    return {
      success: true,
      result: {
        fileName: file.name,
        publicUrl: `/api/files/${result.key}`,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: msg };
  }
}
