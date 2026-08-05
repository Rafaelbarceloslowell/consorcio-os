export const requiredAuthEnvironmentVariables = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const

export type AuthEnvironmentVariable =
  (typeof requiredAuthEnvironmentVariables)[number]

export type AuthEnvironment =
  Readonly<
    Record<
      string,
      string | undefined
    >
  >

export type AuthConfigurationState = {
  configured: boolean
  missing: AuthEnvironmentVariable[]
}

export function getAuthConfigurationState(
  environment: AuthEnvironment = process.env,
): AuthConfigurationState {
  const missing =
    requiredAuthEnvironmentVariables.filter(
      (name) =>
        !environment[name]?.trim(),
    )

  return {
    configured: missing.length === 0,
    missing,
  }
}
