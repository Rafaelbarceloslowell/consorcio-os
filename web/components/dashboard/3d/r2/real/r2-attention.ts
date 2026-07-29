export type R2Attention = {
  x: number
  y: number
}


export function getR2Attention(
  mood?: string
): R2Attention {

  switch (mood) {

    case "thinking":
      return {
        x: 0.15,
        y: 0.1,
      }


    case "alert":
      return {
        x: 0,
        y: 0,
      }


    case "success":
      return {
        x: -0.1,
        y: 0.05,
      }


    default:
      return {
        x: 0,
        y: 0,
      }
  }
}