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
  
  export type DeactivateClientInput =
    ClientStatusTransitionInput
  
  export type DeactivateClientOutput =
    ClientStatusTransitionOutput
  
  export type DeactivateClientOptions =
    ClientStatusTransitionOptions
  
  export class DeactivateClient {
    constructor(
      private readonly crmRepository: CrmRepository,
      private readonly options: DeactivateClientOptions = {},
    ) {}
  
    execute(
      input: DeactivateClientInput,
    ): DeactivateClientOutput {
      return executeClientStatusTransition(
        this.crmRepository,
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
            "O cliente não pode ser inativado a partir do status atual.",
        },
        this.options,
      )
    }
  }