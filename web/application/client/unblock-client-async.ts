import {
  executeClientStatusTransitionAsync,
} from "./shared/client-status-transition-async"

import type {
  ClientStatusTransitionAsyncDependencies,
  ClientStatusTransitionAsyncInput,
  ClientStatusTransitionAsyncOptions,
  ClientStatusTransitionAsyncOutput,
} from "./shared/client-status-transition-async"

export type UnblockClientAsyncInput =
  ClientStatusTransitionAsyncInput

export type UnblockClientAsyncOutput =
  ClientStatusTransitionAsyncOutput

export type UnblockClientAsyncOptions =
  ClientStatusTransitionAsyncOptions

export type UnblockClientAsyncDependencies =
  ClientStatusTransitionAsyncDependencies

export class UnblockClientAsync {
  constructor(
    private readonly dependencies:
      UnblockClientAsyncDependencies,
    private readonly options:
      UnblockClientAsyncOptions = {},
  ) {}

  async execute(
    input:
      UnblockClientAsyncInput,
  ): Promise<UnblockClientAsyncOutput> {
    return executeClientStatusTransitionAsync(
      this.dependencies,
      input,
      {
        targetStatus:
          "active",

        allowedCurrentStatuses: [
          "blocked",
        ],

        alreadyInTargetStatusMessage:
          "O cliente já está ativo.",

        invalidCurrentStatusMessage:
          "Somente clientes bloqueados podem ser desbloqueados.",
      },
      this.options,
    )
  }
}
