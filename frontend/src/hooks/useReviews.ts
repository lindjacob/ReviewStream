import { useEffect, useState } from 'react'
import { fetchReviews } from '../api/reviews'
import type { ReviewsLoad } from '../types/load'

export function useReviews(appId: string | null) {
  const [reviewsLoad, setReviewsLoad] = useState<ReviewsLoad>({
    status: 'idle',
  })
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (appId === null) return

    const controller = new AbortController()

    const loadReviews = async () => {
      setReviewsLoad({ status: 'loading' })
      try {
        const data = await fetchReviews(appId)
        if (controller.signal.aborted) return
        if (data.reviews.length === 0) {
          setReviewsLoad({ status: 'empty' })
          return
        }
        setReviewsLoad({ status: 'ready', reviews: data.reviews })
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'Failed to load reviews'
        setReviewsLoad({ status: 'error', message })
      }
    }

    void loadReviews()
    return () => controller.abort()
  }, [appId, retryKey])

  const retry = () => setRetryKey((key) => key + 1)

  const effectiveLoad: ReviewsLoad =
    appId === null ? { status: 'idle' } : reviewsLoad

  return { reviewsLoad: effectiveLoad, retry }
}
