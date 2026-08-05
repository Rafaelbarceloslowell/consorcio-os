export type R2IntimacyLevel =
  | "professional"
  | "friendly"
  | "close"


export type R2UserProfile = {

  name: string

  nickname?: string

  intimacy:
    R2IntimacyLevel

}



export function getR2DisplayName(
  profile: R2UserProfile
) {


  if (
    profile.nickname
  ) {

    return profile.nickname

  }


  return profile.name

}