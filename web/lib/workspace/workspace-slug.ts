const DEFAULT_WORKSPACE_SLUG = "consorcio-os"

type WorkspaceEnvironment = Readonly<
  Record<string, string | undefined>
>

export function getWorkspaceSlug(
  environment: WorkspaceEnvironment = process.env,
): string {
  return (
    environment.WORKSPACE_SLUG?.trim() ||
    DEFAULT_WORKSPACE_SLUG
  )
}
