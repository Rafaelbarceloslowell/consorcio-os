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
  
  export type ReactivateClientInput =
    ClientStatusTransitionInput
  
  export type ReactivateClientOutput =
    ClientStatusTransitionOutput
  
  export type ReactivateClientOptions =
    ClientStatusTransitionOptions
  
  export class ReactivateClient {
    constructor(
      private readonly crmRepository: CrmRepository,
      private readonly options: ReactivateClientOptions = {},
    ) {}
  
    execute(
      input: ReactivateClientInput,
    ): ReactivateClientOutput {
      return executeClientStatusTransition(
        this.crmRepository,
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