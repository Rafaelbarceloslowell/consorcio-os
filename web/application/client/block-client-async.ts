import {
  executeClientStatusTransitionAsync,
} from "./shared/client-status-transition-async"

import type {
  ClientStatusTransitionAsyncDependencies,
  ClientStatusTransitionAsyncInput,
  ClientStatusTransitionAsyncOptions,
  ClientStatusTransitionAsyncOutput,
} from "./shared/client-status-transition-async"

export type BlockClientAsyncInput =
  ClientStatusTransitionAsyncInput

export type BlockClientAsyncOutput =
  ClientStatusTransitionAsyncOutput

export type BlockClientAsyncOptions =
  ClientStatusTransitionAsyncOptions

export type BlockClientAsyncDependencies =
  ClientStatusTransitionAsyncDependencies

export class BlockClientAsync {
  constructor(
    private readonly dependencies:
      BlockClientAsyncDependencies,
    private readonly options:
      BlockClientAsyncOptions = {},
  ) {}

  async execute(
    input:
      BlockClientAsyncInput,
  ): Promise<BlockClientAsyncOutput> {
    return executeClientStatusTransitionAsync(
      this.dependencies,
      input,
      {
        targetStatus:
          "blocked",

        allowedCurrentStatuses: [
          "active",
        ],

        alreadyInTargetStatusMessage:
          "O cliente já está bloqueado.",

        invalidCurrentStatusMessage:
          "Somente clientes ativos podem ser bloqueados.",
      },
      this.options,
    )
  }
}
