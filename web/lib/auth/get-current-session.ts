import {
  headers,
} from "next/headers"

import {
  getAuthConfigurationState,
} from "@/lib/auth/auth-configuration"

import {
  getAuth,
} from "@/lib/auth/auth"

export async function getCurrentSession() {
  const configuration =
    getAuthConfigurationState()

  if (!configuration.configured) {
    return null
  }

  return getAuth().api.getSession({
    headers: await headers(),
  })
}
