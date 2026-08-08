import {
  describe,
  expect,
  it,
} from "vitest"

import {
  ConsultantRole,
} from "@/lib/generated/prisma/client"

import {
  assertConsortiumCatalogManager,
} from "./assert-consortium-catalog-access"

describe(
  "consortium catalog access",
  () => {
    it(
      "permite apenas administrador",
      () => {
        expect(() =>
          assertConsortiumCatalogManager(
            ConsultantRole.ADMIN,
          ),
        ).not.toThrow()

        for (const role of [
          ConsultantRole.CONSULTANT,
          ConsultantRole.MANAGER,
        ]) {
          expect(() =>
            assertConsortiumCatalogManager(
              role,
            ),
          ).toThrow(
            "Somente administradores",
          )
        }
      },
    )
  },
)
