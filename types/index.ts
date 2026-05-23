export type ItemType = 'food' | 'activity' | 'shop'

export interface Trip {
  id: string
  name: string
  code: string
  created_at: string
  start_date: string | null
  end_date: string | null
}

export interface Item {
  id: string
  trip_id: string
  type: ItemType
  name: string
  notes: string | null
  links: string[]
  added_by: string
  done: boolean
  created_at: string
  scheduled_date: string | null
}
