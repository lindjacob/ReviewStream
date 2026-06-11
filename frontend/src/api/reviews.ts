import type { ReviewsResponse } from '@reviewstream/shared/api'
import { fetchJson } from './client'

export async function fetchReviews(appId: string): Promise<ReviewsResponse> {
  return fetchJson<ReviewsResponse>(
    `/api/apps/${encodeURIComponent(appId)}/reviews`,
  )
}
