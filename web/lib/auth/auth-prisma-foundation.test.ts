import {
  readFile,
} from "node:fs/promises"

import {
  describe,
  expect,
  it,
} from "vitest"

describe(
  "Better Auth Prisma foundation",
  () => {
    it(
      "contains the four core models and the existing entity links",
      async () => {
        const schema =
          await readFile(
            "prisma/schema.prisma",
            "utf8",
          )

        for (
          const modelName of [
            "User",
            "Session",
            "Account",
            "Verification",
          ]
        ) {
          expect(schema).toContain(
            `model ${modelName} {`,
          )
        }

        expect(schema).toMatch(
          /workspaceId\s+String/,
        )
        expect(schema).toMatch(
          /consultantId\s+String/,
        )
        expect(schema).toMatch(
          /authUsers\s+User\[\]/,
        )
        expect(schema).toMatch(
          /authUser\s+User\?/,
        )
      },
    )

    it(
      "keeps workspace and consultant server-owned while the database hook supplies them",
      async () => {
        const authSource =
          await readFile(
            "lib/auth/auth.ts",
            "utf8",
          )

        expect(authSource).toMatch(
          /workspaceId:\s*\{[\s\S]*?required:\s*false,[\s\S]*?input:\s*false,[\s\S]*?\}/,
        )

        expect(authSource).toMatch(
          /consultantId:\s*\{[\s\S]*?required:\s*false,[\s\S]*?input:\s*false,[\s\S]*?\}/,
        )

        expect(authSource).toContain(
          "databaseHooks",
        )

        expect(authSource).toMatch(
          /workspaceId:\s*consultant\.workspaceId/,
        )

        expect(authSource).toMatch(
          /consultantId:\s*consultant\.id/,
        )
      },
    )
  },
)
