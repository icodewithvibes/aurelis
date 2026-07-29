/**
 * App icon badge — the one piece of "at a glance" a web app really gets
 * on iOS.
 *
 * The Badging API landed in iOS/iPadOS 16.4 and works ONLY for a web
 * app added to the Home Screen; it is not exposed to Safari tabs or to
 * WKWebView. It also stays invisible until the user has granted
 * notification permission, even though the badge itself is not a
 * notification. So this is best-effort by nature: on a desktop browser,
 * in a Safari tab, or with permission withheld, it simply does nothing,
 * and nothing about the app depends on it.
 *
 * https://webkit.org/blog/14112/badging-for-home-screen-web-apps/
 *
 * This is NOT a widget and is not sold as one. It is a count on an
 * icon. The nearest thing to a real "what's next" surface is the
 * Calendar export in ics.ts, which hands the plan to iOS's own widget.
 */

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export function badgingSupported(): boolean {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

/**
 * Show how many things are still open today, or clear it at zero.
 * Never throws: a rejected badge call must not take a screen down.
 */
export async function setPlanBadge(count: number): Promise<void> {
  const nav = navigator as BadgeNavigator;
  try {
    if (count > 0) await nav.setAppBadge?.(count);
    else await nav.clearAppBadge?.();
  } catch {
    // Permission withheld, or not an installed web app. Not a problem.
  }
}

/**
 * Ask for notification permission — the gate the badge sits behind.
 *
 * Must be called from a user gesture; iOS ignores it otherwise, and
 * silently. Returns the resulting permission so the UI can say what
 * actually happened rather than assuming it worked.
 */
export async function requestBadgePermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}
