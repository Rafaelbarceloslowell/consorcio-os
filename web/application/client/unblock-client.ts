import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  import {
    executeClientStatusTransition,
  } from "./shared/client-status-transition"
  
  import type {
    ClientStatusTransitionInput,
    ClientStatusTransitionOptions,
    ClientStatusTransitionOutput,
  } from "./shared/client-status-transition"
  
  export type UnblockClientInput =
    ClientStatusTransitionInput
  
  export type UnblockClientOutput =
    ClientStatusTransitionOutput
  
  export type UnblockClientOptions =
    ClientStatusTransitionOptions
  
  export class UnblockClient {
    constructor(
      private readonly crmRepository: CrmRepository,
      private readonly options: UnblockClientOptions = {},
    ) {}
  
    execute(
      input: UnblockClientInput,
    ): UnblockClientOutput {
      return executeClientStatusTransition(
        this.crmRepository,
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