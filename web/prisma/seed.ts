import { prisma } from "../infrastructure/prisma/client"


async function main() {
  const workspace = await prisma.workspace.upsert({
    where: {
      slug: "consorcio-os",
    },
    update: {},
    create: {
      name: "Consórcio OS",
      slug: "consorcio-os",
    },
  })

  console.log("Workspace criado:", workspace)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
