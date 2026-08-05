import {
  executeClientStatusTransitionAsync,
} from "./shared/client-status-transition-async"

import type {
  ClientStatusTransitionAsyncDependencies,
  ClientStatusTransitionAsyncInput,
  ClientStatusTransitionAsyncOptions,
  ClientStatusTransitionAsyncOutput,
} from "./shared/client-status-transition-async"

export type ReactivateClientAsyncInput =
  ClientStatusTransitionAsyncInput

export type ReactivateClientAsyncOutput =
  ClientStatusTransitionAsyncOutput

export type ReactivateClientAsyncOptions =
  ClientStatusTransitionAsyncOptions

export type ReactivateClientAsyncDependencies =
  ClientStatusTransitionAsyncDependencies

export class ReactivateClientAsync {
  constructor(
    private readonly dependencies:
      ReactivateClientAsyncDependencies,
    private readonly options:
      ReactivateClientAsyncOptions = {},
  ) {}

  async execute(
    input:
      ReactivateClientAsyncInput,
  ): Promise<ReactivateClientAsyncOutput> {
    return executeClientStatusTransitionAsync(
      this.dependencies,
      input,
      {
        targetStatus:
          "active",

        allowedCurrentStatuses: [
          "inactive",
        ],

        alreadyInTargetStatusMessage:
          "O cliente já está ativo.",

        invalidCurrentStatusMessage:
          "Somente clientes inativos podem ser reativados.",
      },
      this.options,
    )
  }
}
