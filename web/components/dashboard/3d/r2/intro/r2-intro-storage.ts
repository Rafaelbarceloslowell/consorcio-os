const KEY =
  "gorilaos_r2_intro_completed"


export function hasSeenR2Intro() {

  if (
    typeof window === "undefined"
  ) {
    return false
  }

  return (
    localStorage.getItem(KEY)
    === "true"
  )
}


export function completeR2Intro() {

  if (
    typeof window === "undefined"
  ) {
    return
  }

  localStorage.setItem(
    KEY,
    "true"
  )
}