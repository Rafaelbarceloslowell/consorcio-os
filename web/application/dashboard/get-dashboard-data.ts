import {
  mockDashboardData,
} from "@/data/mock-dashboard"

import type {
  AsyncCommercialRepositories,
} from "@/repositories/commercial/async-commercial-repositories"

import type {
  CommercialRepository,
} from "@/repositories/commercial/commercial-repository"

import {
  mockCommercialRepository,
} from "@/repositories/commercial/mock-commercial-repository"

import type {
  CrmRepository,
} from "@/repositories/crm/crm-repository"

import {
  mockCrmRepository,
} from "@/repositories/crm/mock-crm-repository"

import type {
  DashboardData,
} from "@/types/dashboard"

import {
  getNextBestActions,
} from "../decision/get-next-best-actions"

import {
  mapOperationalDashboardData,
} from "./mapper"

export type GetDashboardDataInput = {
  consultantId?:
    string

  now?:
    Date
}

type GetDashboardDataCommonDependencies = {
  crmRepository:
    CrmRepository

  baseDashboardData:
    DashboardData
}

export type GetDashboardDataLegacyDependencies =
  GetDashboardDataCommonDependencies & {
    commercialRepository:
      CommercialRepository
  }

export type GetDashboardDataAsyncDependencies =
  GetDashboardDataCommonDependencies & {
    commercialRepository:
      AsyncCommercialRepositories
  }

export type GetDashboardDataDependencies =
  | GetDashboardDataLegacyDependencies
  | GetDashboardDataAsyncDependencies

const defaultDependencies:
  GetDashboardDataLegacyDependencies = {
    commercialRepository:
      mockCommercialRepository,

    crmRepository:
      mockCrmRepository,

    baseDashboardData:
      mockDashboardData,
  }

function isAsyncCommercialRepositories(
  commercialRepository:
    | CommercialRepository
    | AsyncCommercialRepositories,
): commercialRepository is AsyncCommercialRepositories {
  if (
    !(
      "journeys" in
      commercialRepository
    ) ||
    !(
      "nextBestActions" in
      commercialRepository
    )
  ) {
    return false
  }

  return (
    typeof commercialRepository
      .journeys
      .findAll ===
      "function" &&
    typeof commercialRepository
      .journeys
      .findByConsultantId ===
      "function" &&
    typeof commercialRepository
      .nextBestActions
      .findByJourneyId ===
      "function"
  )
}

function getLegacyDashboardData(
  {
    consultantId,
    now,
  }: GetDashboardDataInput,
  dependencies:
    GetDashboardDataLegacyDependencies,
): DashboardData {
  const operationalActions =
    getNextBestActions({
      commercialRepository:
        dependencies
          .commercialRepository,

      crmRepository:
        dependencies
          .crmRepository,

      consultantId,

      now,
    })

  return mapOperationalDashboardData({
    baseDashboardData:
      dependencies
        .baseDashboardData,

    operationalActions,
  })
}

async function getAsyncDashboardData(
  {
    consultantId,
    now,
  }: GetDashboardDataInput,
  dependencies:
    GetDashboardDataAsyncDependencies,
): Promise<DashboardData> {
  const operationalActions =
    await getNextBestActions({
      commercialRepository:
        dependencies
          .commercialRepository,

      crmRepository:
        dependencies
          .crmRepository,

      consultantId,

      now,
    })

  return mapOperationalDashboardData({
    baseDashboardData:
      dependencies
        .baseDashboardData,

    operationalActions,
  })
}

export function getDashboardData(
  input:
    GetDashboardDataInput,
  dependencies:
    GetDashboardDataAsyncDependencies,
): Promise<DashboardData>

export function getDashboardData(
  input:
    GetDashboardDataInput,
  dependencies:
    GetDashboardDataLegacyDependencies,
): DashboardData

export function getDashboardData(
  input:
    GetDashboardDataInput,
  dependencies:
    GetDashboardDataDependencies,
): DashboardData

export function getDashboardData(
  input?:
    GetDashboardDataInput,
  dependencies?:
    GetDashboardDataLegacyDependencies,
): DashboardData

export function getDashboardData(
  input:
    GetDashboardDataInput = {},
  dependencies:
    GetDashboardDataDependencies =
      defaultDependencies,
):
  | DashboardData
  | Promise<DashboardData> {
  if (
    isAsyncCommercialRepositories(
      dependencies
        .commercialRepository,
    )
  ) {
    return getAsyncDashboardData(
      input,
      {
        commercialRepository:
          dependencies
            .commercialRepository,

        crmRepository:
          dependencies
            .crmRepository,

        baseDashboardData:
          dependencies
            .baseDashboardData,
      },
    )
  }

  return getLegacyDashboardData(
    input,
    {
      commercialRepository:
        dependencies
          .commercialRepository,

      crmRepository:
        dependencies
          .crmRepository,

      baseDashboardData:
        dependencies
          .baseDashboardData,
    },
  )
}