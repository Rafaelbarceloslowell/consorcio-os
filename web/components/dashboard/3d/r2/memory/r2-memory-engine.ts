import type {
  R2Memory,
  R2MemoryCategory,
  R2MemoryContext,
} from "./r2-memory-types"



export function createR2Memory(
  category: R2MemoryCategory,
  content: string
): R2Memory {

  return {

    id:
      crypto.randomUUID(),

    category,

    content,

    createdAt:
      new Date()
        .toISOString(),

  }

}



export function addR2Memory(
  context: R2MemoryContext,
  memory: R2Memory
): R2MemoryContext {


  return {

    ...context,

    memories: [
      ...context.memories,
      memory,
    ],

  }

}



export function findR2Memories(
  context: R2MemoryContext,
  category?: R2MemoryCategory
) {


  if (!category) {

    return context.memories

  }


  return context.memories.filter(
    (memory) =>
      memory.category === category
  )

}