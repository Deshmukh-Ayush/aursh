export interface ClientTableItem {
  id: string
  name: string | null
  email: string
  image: string | null
  status: "active" | "invited"
  activeProjectsCount: number
  totalContractValue: number
  joinedDate: string | Date
  projectId: string | null
}
