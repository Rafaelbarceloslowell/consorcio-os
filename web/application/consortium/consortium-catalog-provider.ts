import type {
  Consortium,
  ConsortiumType,
} from "@/types/domain"

export type ListConsortiumCatalogInput =
  Readonly<{
    assetCategory?:
      ConsortiumType | null
  }>

export interface ConsortiumCatalogProvider {
  listCandidates(
    input?: ListConsortiumCatalogInput,
  ): Promise<readonly Consortium[]>
}
