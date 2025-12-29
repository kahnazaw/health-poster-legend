import { supabase } from "./supabase";

export type AuditAction = 
  | "signup" 
  | "approved" 
  | "rejected" 
  | "login"
  | "report_submitted"
  | "report_approved"
  | "report_rejected"
  | "pdf_generated";

export interface AuditDetails {
  month?: string;
  year?: number;
  health_center_name?: string;
  rejection_reason?: string;
  [key: string]: any;
}

/**
 * Log an audit event to the audit_logs table
 * This is a lightweight logging function that doesn't throw errors
 * to avoid breaking the main flow
 */
export async function logAudit(
  userId: string | null,
  action: AuditAction,
  options?: {
    targetType?: string;
    targetId?: string;
    details?: AuditDetails;
  }
): Promise<void> {
  try {
    // Only log if we have a user ID (or allow system actions with null)
    if (!userId && action !== "pdf_generated") {
      return;
    }

    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: action,
      target_type: options?.targetType || null,
      target_id: options?.targetId || null,
      details: options?.details || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Silently fail to avoid breaking the main flow
    // Audit logging should never cause errors in production
    console.error("Failed to log audit event:", error);
  }
}

