export type ClientListItemView = {
  id: string
  name: string
  typeLabel: string
  email: string
  phone: string
  document: string
  statusLabel: string
}

export type ClientListView = {
  clients: ClientListItemView[]
}
