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
  
  export type BlockClientInput =
    ClientStatusTransitionInput
  
  export type BlockClientOutput =
    ClientStatusTransitionOutput
  
  export type BlockClientOptions =
    ClientStatusTransitionOptions
  
  export class BlockClient {
    constructor(
      private readonly crmRepository: CrmRepository,
      private readonly options: BlockClientOptions = {},
    ) {}
  
    execute(
      input: BlockClientInput,
    ): BlockClientOutput {
      return executeClientStatusTransition(
        this.crmRepository,
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