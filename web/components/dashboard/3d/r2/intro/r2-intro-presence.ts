import type {
  R2IntroState,
} from "./r2-intro-state"


export type R2Presence = {

  eye: 
    | "closed"
    | "soft"
    | "focused"
    | "happy"

  energy: number

  aura: number

  head:
    | "down"
    | "neutral"
    | "up"

}


export function getR2Presence(
  state: R2IntroState
): R2Presence {


  switch(state) {


    case "sleeping":

      return {
        eye: "closed",
        energy: 0.15,
        aura: 0.1,
        head: "down",
      }



    case "curious":

      return {
        eye: "focused",
        energy: 0.45,
        aura: 0.3,
        head: "neutral",
      }



    case "laughing":

      return {
        eye: "happy",
        energy: 0.65,
        aura: 0.5,
        head: "neutral",
      }



    case "revealing":

      return {
        eye: "focused",
        energy: 0.85,
        aura: 0.8,
        head: "up",
      }



    case "welcoming":

      return {
        eye: "happy",
        energy: 1,
        aura: 1,
        head: "up",
      }



    default:

      return {
        eye: "soft",
        energy: 0.5,
        aura: 0.4,
        head: "neutral",
      }

  }

}