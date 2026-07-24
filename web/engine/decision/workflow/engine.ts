import {
    executeWorkflowTransition,
  } from "./transition"
  
  import type {
    WorkflowEngineInput,
    WorkflowEngineOutput,
  } from "./types"
  
  import {
    validateWorkflowTransition,
  } from "./validator"
  
  export function runWorkflowEngine(
    input: WorkflowEngineInput,
  ): WorkflowEngineOutput {
    const validation =
      validateWorkflowTransition(
        input,
      )
  
    const transition =
      executeWorkflowTransition({
        validation,
        journey:
          input.journey,
        actorType:
          input.actorType,
        actorId:
          input.actorId,
        origin:
          input.origin,
        now:
          input.now,
        payload:
          input.payload,
      })
  
    return {
      journey:
        transition.journey,
      previousJourney:
        transition.previousJourney,
      event:
        transition.event,
      validation,
      matchedRules:
        transition.matchedRules,
      requestedActions:
        transition.requestedActions,
      changed:
        transition.changed,
      diagnostics:
        transition.diagnostics,
      warnings:
        transition.warnings,
    }
  }