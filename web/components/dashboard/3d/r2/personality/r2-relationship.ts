export type R2RelationshipInput = {

  daysActive: number

  interactions: number

  preferredNickname?: string

}


export type R2RelationshipLevel =
  | "new"
  | "familiar"
  | "partner"



export function getR2Relationship(
  input: R2RelationshipInput
): R2RelationshipLevel {


  if (
    input.interactions < 5
  ) {
    return "new"
  }


  if (
    input.interactions < 50
  ) {
    return "familiar"
  }


  return "partner"

}