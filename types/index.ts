export type ItemType = 'food' | 'activity' | 'shop'

export interface Trip {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Item {
  id: string
  trip_id: string
  type: ItemType
  name: string
  notes: string | null
  link: string | null
  added_by: string
  done: boolean
  created_at: string
}
