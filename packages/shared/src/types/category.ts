export type CategoryGroupWithCategories = {
  id: string
  name: string
  icon: string | null
  color: string | null
  cost_type_id: string | null
  cost_type_code: string | null
  is_system: boolean
  categories: {
    id: string
    name: string
    icon: string | null
    default_behavior_type: string
    is_system: boolean
  }[]
}
