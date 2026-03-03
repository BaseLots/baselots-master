export interface ActionResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

