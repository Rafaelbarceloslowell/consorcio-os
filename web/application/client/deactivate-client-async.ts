import {
  executeClientStatusTransitionAsync,
} from "./shared/client-status-transition-async"

import type {
  ClientStatusTransitionAsyncDependencies,
  ClientStatusTransitionAsyncInput,
  ClientStatusTransitionAsyncOptions,
  ClientStatusTransitionAsyncOutput,
} from "./shared/client-status-transition-async"

export type DeactivateClientAsyncInput =
  ClientStatusTransitionAsyncInput

export type DeactivateClientAsyncOutput =
  ClientStatusTransitionAsyncOutput

export type DeactivateClientAsyncOptions =
  ClientStatusTransitionAsyncOptions

export type DeactivateClientAsyncDependencies =
  ClientStatusTransitionAsyncDependencies

export class DeactivateClientAsync {
  constructor(
    private readonly dependencies:
      DeactivateClientAsyncDependencies,
    private readonly options:
      DeactivateClientAsyncOptions = {},
  ) {}

  async execute(
    input:
      DeactivateClientAsyncInput,
  ): Promise<DeactivateClientAsyncOutput> {
    return executeClientStatusTransitionAsync(
      this.dependencies,
      input,
      {
        targetStatus:
          "inactive",

        allowedCurrentStatuses: [
          "active",
          "blocked",
        ],

        alreadyInTargetStatusMessage:
          "O cliente já está inativo.",

        invalidCurrentStatusMessage:
          "Somente clientes ativos ou bloqueados podem ser desativados.",
      },
      this.options,
    )
  }
}
