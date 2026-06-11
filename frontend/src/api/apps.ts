import type { AppsResponse } from '@reviewstream/shared/api'
import { fetchJson } from './client'

export async function fetchApps(): Promise<AppsResponse> {
  return fetchJson<AppsResponse>('/api/apps')
}
