export type R2MemoryCategory =
  | "identity"
  | "preference"
  | "work"
  | "achievement"
  | "context"


export type R2Memory = {

  id: string

  category:
    R2MemoryCategory

  content: string

  createdAt: string

}


export type R2MemoryContext = {

  userId: string

  memories:
    R2Memory[]

}