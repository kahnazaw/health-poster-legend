import { supabase } from "./supabase";

export type AuditAction = "signup" | "approved" | "rejected" | "login";

/**
 * Log an audit event to the audit_logs table
 * This is a lightweight logging function that doesn't throw errors
 * to avoid breaking the main flow
 */
export async function logAudit(
  userId: string | null,
  action: AuditAction
): Promise<void> {
  try {
    // Only log if we have a user ID
    if (!userId) {
      return;
    }

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Silently fail to avoid breaking the main flow
    // Audit logging should never cause errors in production
    console.error("Failed to log audit event:", error);
  }
}

