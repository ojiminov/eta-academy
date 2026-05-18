// ─── OneSignal server-side helper ────────────────────────────────────────────
// Uses the OneSignal REST API to send push notifications.
// Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in Vercel env vars.

const APP_ID      = process.env.ONESIGNAL_APP_ID      ?? "";
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY ?? "";
const BASE_URL     = "https://onesignal.com/api/v1/notifications";

export interface PushPayload {
  /** OneSignal external_id values (= our User.id) */
  userIds?: string[];
  /** Send to ALL subscribed users (use for announcements) */
  toAll?: boolean;
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Deep-link URL opened when user taps */
  url?: string;
  /** Small data object attached to the notification */
  data?: Record<string, string>;
}

/**
 * Send a push notification via OneSignal.
 * Never throws — logs errors and returns false on failure.
 */
export async function sendPush(payload: PushPayload): Promise<boolean> {
  if (!APP_ID || !REST_API_KEY) {
    console.warn("[OneSignal] ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY not set — skipping push");
    return false;
  }
  if (!payload.toAll && (!payload.userIds || payload.userIds.length === 0)) return false;

  const body: Record<string, unknown> = {
    app_id: APP_ID,
    headings:  { en: payload.title },
    contents:  { en: payload.body },
    url:       payload.url ?? "https://eta-academy.vercel.app",
    data:      payload.data ?? {},
    chrome_web_icon: "https://eta-academy.vercel.app/icon-192.png",
    firefox_icon:    "https://eta-academy.vercel.app/icon-192.png",
  };

  if (payload.toAll) {
    body.included_segments = ["All"];
  } else {
    // Target specific users by external_id (= our userId)
    body.include_aliases   = { external_id: payload.userIds };
    body.target_channel    = "push";
  }

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[OneSignal] API error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[OneSignal] fetch failed:", err);
    return false;
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export async function notifyHomeworkAssigned(
  studentUserIds: string[],
  homeworkTitle: string,
  groupName: string,
  dueDate: Date
) {
  return sendPush({
    userIds: studentUserIds,
    title: "📝 New Homework",
    body: `${homeworkTitle} — due ${dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} (${groupName})`,
    url: "https://eta-academy.vercel.app/student/homework",
    data: { type: "HOMEWORK" },
  });
}

export async function notifyPaymentOverdue(
  studentUserIds: string[],
  amountUzs: number
) {
  return sendPush({
    userIds: studentUserIds,
    title: "⚠️ Payment Overdue",
    body: `You have an outstanding balance of ${amountUzs.toLocaleString()} UZS. Please contact the academy.`,
    url: "https://eta-academy.vercel.app/student/payments",
    data: { type: "PAYMENT" },
  });
}

export async function notifyAttendanceMarked(
  parentUserIds: string[],
  studentName: string,
  status: string
) {
  const statusLabel: Record<string, string> = {
    PRESENT: "✅ present",
    ABSENT:  "❌ absent",
    LATE:    "⏰ late",
    EXCUSED: "🙏 excused",
    HOLIDAY: "🎉 holiday",
    HW_NOT_DONE: "📋 homework not done",
  };
  return sendPush({
    userIds: parentUserIds,
    title: "📅 Attendance Update",
    body: `${studentName} was marked ${statusLabel[status] ?? status} today.`,
    url: "https://eta-academy.vercel.app/parent/attendance",
    data: { type: "ATTENDANCE", status },
  });
}

export async function notifyAnnouncement(
  title: string,
  body: string,
  targetUserIds?: string[] // undefined = send to all
) {
  return sendPush(
    targetUserIds
      ? { userIds: targetUserIds, title: `📢 ${title}`, body, url: "https://eta-academy.vercel.app" }
      : { toAll: true,           title: `📢 ${title}`, body, url: "https://eta-academy.vercel.app" }
  );
}
