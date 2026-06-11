import type { ReviewDto } from '@reviewstream/shared/api'

export type AppsLoad =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; apps: string[] }

export type ReviewsLoad =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; reviews: ReviewDto[] }
