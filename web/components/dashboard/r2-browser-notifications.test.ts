import { describe, expect, it } from "vitest"

import {
  browserNotificationTag,
  shouldAttemptNativeNotification,
} from "./r2-browser-notifications"

describe("R2 browser notification policy", () => {
  it.each([
    ["granted", "hidden", true, true],
    ["granted", "visible", false, true],
    ["granted", "visible", true, false],
    ["default", "hidden", false, false],
    ["denied", "hidden", false, false],
    ["unsupported", "hidden", false, false],
  ] as const)(
    "permission=%s visibility=%s focus=%s => %s",
    (permission, visibilityState, hasFocus, expected) => {
      expect(shouldAttemptNativeNotification({ permission, visibilityState, hasFocus })).toBe(expected)
    },
  )

  it("versiona a chave de deduplicação depois de um snooze", () => {
    expect(browserNotificationTag("notification-1", 1)).toBe("gorillaos:r2:notification-1:1")
    expect(browserNotificationTag("notification-1", 2)).not.toBe(browserNotificationTag("notification-1", 1))
  })
})
