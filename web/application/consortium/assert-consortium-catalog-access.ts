import {
  ConsultantRole,
} from "@/lib/generated/prisma/client"

export function assertConsortiumCatalogManager(
  role: ConsultantRole,
): void {
  if (role !== ConsultantRole.ADMIN) {
    throw new Error(
      "Somente administradores podem manter o catálogo de consórcio.",
    )
  }
}
