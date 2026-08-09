export type BrowserNotificationPermission = NotificationPermission | "unsupported"

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission
}

export function shouldAttemptNativeNotification(input: Readonly<{
  permission: BrowserNotificationPermission
  visibilityState: DocumentVisibilityState
  hasFocus: boolean
}>): boolean {
  return input.permission === "granted"
    && (input.visibilityState === "hidden" || !input.hasFocus)
}

export function browserNotificationTag(id: string, deliveryVersion: number): string {
  return `gorillaos:r2:${id}:${deliveryVersion}`
}
