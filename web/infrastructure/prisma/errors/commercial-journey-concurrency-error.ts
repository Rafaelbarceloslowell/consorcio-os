export type CommercialJourneyConcurrencyErrorInput = {
    workspaceId: string
    journeyId: string
    expectedVersion: number
    currentVersion: number | null
  }
  
  export class CommercialJourneyConcurrencyError extends Error {
    readonly workspaceId: string
  
    readonly journeyId: string
  
    readonly expectedVersion: number
  
    readonly currentVersion: number | null
  
    constructor({
      workspaceId,
      journeyId,
      expectedVersion,
      currentVersion,
    }: CommercialJourneyConcurrencyErrorInput) {
      const currentVersionDescription =
        currentVersion === null
          ? "indisponível"
          : String(currentVersion)
  
      super(
        [
          `Conflito de concorrência na jornada comercial "${journeyId}".`,
          `Workspace: "${workspaceId}".`,
          `Versão esperada: ${expectedVersion}.`,
          `Versão atual: ${currentVersionDescription}.`,
        ].join(" "),
      )
  
      this.name =
        "CommercialJourneyConcurrencyError"
  
      this.workspaceId =
        workspaceId
  
      this.journeyId =
        journeyId
  
      this.expectedVersion =
        expectedVersion
  
      this.currentVersion =
        currentVersion
  
      Object.setPrototypeOf(
        this,
        CommercialJourneyConcurrencyError.prototype,
      )
    }
  }