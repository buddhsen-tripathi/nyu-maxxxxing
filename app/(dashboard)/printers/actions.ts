"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ShareCreditsPayload {
  recipientEmail: string;
  pages: number;
  message?: string;
}

export async function shareCreditsAction(
  payload: ShareCreditsPayload
): Promise<{ success: boolean; error?: string }> {
  const { recipientEmail, pages, message } = payload;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "NYU Maxxxxing <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `You've received ${pages} NYU print credit${pages !== 1 ? "s" : ""}!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:#57068C;color:white;font-weight:700;font-size:18px;
                         padding:6px 16px;border-radius:6px;letter-spacing:1px;">NYU</span>
          </div>
          <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 8px;">
            🎉 You've received ${pages} print credit${pages !== 1 ? "s" : ""}!
          </h2>
          <p style="color:#4b5563;font-size:14px;margin:0 0 16px;">
            A fellow NYU student shared <strong>${pages} page${pages !== 1 ? "s" : ""}</strong>
            of print credits with you via <strong>NYU Maxxxxing</strong>.
          </p>
          ${
            message
              ? `<div style="background:#f3f4f6;border-left:3px solid #57068C;
                            padding:10px 14px;border-radius:4px;margin-bottom:16px;">
                  <p style="color:#374151;font-size:13px;margin:0;font-style:italic;">"${message}"</p>
                </div>`
              : ""
          }
          <p style="color:#4b5563;font-size:14px;margin:0 0 8px;">
            Use your credits at any NYU print station across campus.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">
            Sent via NYU Maxxxxing · This is an automated message.
          </p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}
