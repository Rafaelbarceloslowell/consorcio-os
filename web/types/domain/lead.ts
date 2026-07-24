import type { ConsortiumType, EntityId, Timestamps } from "./common"

export type LeadSource =
  | "referral"
  | "website"
  | "social_media"
  | "cold_call"
  | "event"
  | "partner"
  | "walk_in"
  | "other"

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiating"
  | "converted"
  | "lost"

export type Lead = {
  id: EntityId
  name: string
  email: string
  phone: string
  document?: string
  companyName?: string
  source: LeadSource
  status: LeadStatus
  consortiumType: ConsortiumType
  desiredCreditValue: number
  desiredTermMonths: number
  consultantId: EntityId
  pipelineStageId: EntityId
  score: number
  lostReason?: string
  notes?: string
  convertedClientId?: EntityId
  lastContactAt?: string
} & Timestamps
