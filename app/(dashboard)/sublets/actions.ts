"use server";

import { upload } from "@/lib/agent-bucket";

export interface SubletImageUploadResult {
  url: string; // /api/files/<key>
  fileName: string;
  size: number;
}

/** Upload one image attached in the Sublets form to AgentBucket and return
 * a publicly-fetchable URL via the /api/files proxy. */
export async function uploadSubletImageAction(
  formData: FormData,
): Promise<{ success: true; result: SubletImageUploadResult } | { success: false; error: string }> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Only image files are supported" };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "Image exceeds 10 MB limit" };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `sublets/${Date.now()}-${safeName}`;
    const result = await upload(file, path, file.type || "image/jpeg");

    return {
      success: true,
      result: {
        url: `/api/files/${result.key}`,
        fileName: file.name,
        size: file.size,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: msg };
  }
}
