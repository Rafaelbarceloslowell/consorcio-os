export type R2IntroState =
  | "sleeping"
  | "curious"
  | "laughing"
  | "revealing"
  | "welcoming"
  | "complete"


export type R2IntroEvent =
  | "mouse_near"
  | "mouse_idle"
  | "click"
  | "finished"


export function nextR2IntroState(
  state: R2IntroState,
  event: R2IntroEvent
): R2IntroState {

  switch(state) {


    case "sleeping":

      if (
        event === "mouse_near"
      ) {
        return "curious"
      }

      return state



    case "curious":

      if (
        event === "mouse_idle"
      ) {
        return "laughing"
      }

      if (
        event === "click"
      ) {
        return "revealing"
      }

      return state



    case "laughing":

      if (
        event === "click"
      ) {
        return "revealing"
      }

      return state



    case "revealing":

      if (
        event === "finished"
      ) {
        return "welcoming"
      }

      return state


    case "welcoming":

      if (
        event === "finished"
      ) {
        return "complete"
      }

      return state



    default:

      return state
  }
}