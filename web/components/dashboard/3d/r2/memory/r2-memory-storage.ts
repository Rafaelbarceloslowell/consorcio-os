import type {
  R2MemoryContext,
} from "./r2-memory-types"


const KEY =
  "gorilaos_r2_memory"



export function saveR2Memory(
  memory: R2MemoryContext
) {


  if (
    typeof window === "undefined"
  ) {
    return
  }


  localStorage.setItem(
    KEY,
    JSON.stringify(memory)
  )

}




export function loadR2Memory(
  userId: string
): R2MemoryContext {


  if (
    typeof window === "undefined"
  ) {

    return {
      userId,
      memories: [],
    }

  }


  const stored =
    localStorage.getItem(KEY)



  if (!stored) {

    return {
      userId,
      memories: [],
    }

  }



  try {

    const parsed =
      JSON.parse(stored)


    return {

      userId,

      memories:
        parsed.memories ?? [],

    }


  } catch {

    return {
      userId,
      memories: [],
    }

  }

}