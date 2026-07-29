import type {
  R2UserProfile,
} from "./r2-user-profile"


export type R2Tone =
  | "professional"
  | "friendly"
  | "celebration"


export function getR2Tone(
  profile: R2UserProfile
): R2Tone {


  switch(profile.intimacy) {


    case "professional":

      return "professional"



    case "friendly":

      return "friendly"



    case "close":

      return "celebration"



    default:

      return "professional"

  }

}