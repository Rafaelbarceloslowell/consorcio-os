import type { EntityId, Timestamps } from "./common"

export type ConsultantRole = "consultant" | "manager" | "admin"

export type ConsultantStatus = "active" | "inactive" | "on_leave"

export type Consultant = {
  id: EntityId
  name: string
  email: string
  phone: string
  document: string
  role: ConsultantRole
  team: string
  region: string
  avatarUrl?: string
  status: ConsultantStatus
  monthlySalesTarget: number
  monthlyLeadsTarget: number
} & Timestamps
