"use client"

import {
  getR2Dialogue,
  type R2DialogueMoment,
} from "./r2-dialogue"


type R2DialogueControllerProps = {
  name: string
  moment: R2DialogueMoment
}


export function R2DialogueController({
  name,
  moment,
}: R2DialogueControllerProps) {


  const message =
    getR2Dialogue({
      name,
      moment,
    })


  return {
    message,
  }

}