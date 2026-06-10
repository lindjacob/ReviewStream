import { useEffect, useState } from 'react'
import type {
  AppsResponse,
  ReviewDto,
  ReviewsResponse,
} from '@reviewstream/shared/api'
import './App.css'

type AppsLoad =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; apps: string[] }

type ReviewsLoad =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; reviews: ReviewDto[] }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const message =
      body !== null &&
      typeof body === 'object' &&
      'error' in body &&
      body.error !== null &&
      typeof body.error === 'object' &&
      'message' in body.error &&
      typeof body.error.message === 'string'
        ? body.error.message
        : `Request failed (${res.status})`
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0
  return Math.min(5, Math.max(0, Math.round(rating)))
}

function formatAbsolute(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diffMs = date.getTime() - now
  const diffSec = Math.round(diffMs / 1000)
  const absSec = Math.abs(diffSec)

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (absSec < 60) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHour = Math.round(diffMin / 60)
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  const diffDay = Math.round(diffHour / 24)
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month')
  const diffYear = Math.round(diffMonth / 12)
  return rtf.format(diffYear, 'year')
}

function formatSubmittedAt(
  iso: string,
): { relative: string; absolute: string } | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return {
    relative: formatRelative(date),
    absolute: formatAbsolute(date),
  }
}

function StarRating({ rating }: { rating: number }) {
  const filled = clampRating(rating)
  const empty = 5 - filled
  const stars = '★'.repeat(filled) + '☆'.repeat(empty)

  return (
    <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
      <span className="star-rating__visual" aria-hidden="true">
        {stars}
      </span>
    </span>
  )
}

function ReviewCard({ review }: { review: ReviewDto }) {
  const submitted = formatSubmittedAt(review.submittedAt)

  return (
    <article className="review-card">
      <header className="review-card__header">
        <div className="review-card__meta">
          <span className="review-card__author">{review.author}</span>
          <StarRating rating={review.rating} />
        </div>
        {submitted ? (
          <time
            className="review-card__time"
            dateTime={review.submittedAt}
            title={submitted.absolute}
          >
            {submitted.relative} - {submitted.absolute}
          </time>
        ) : (
          <span className="review-card__time review-card__time--unknown">
            Unknown date
          </span>
        )}
      </header>
      {review.title ? (
        <h2 className="review-card__title">{review.title}</h2>
      ) : null}
      <p className="review-card__content">{review.content}</p>
    </article>
  )
}

function App() {
  const [appsLoad, setAppsLoad] = useState<AppsLoad>({ status: 'loading' })
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [reviewsLoad, setReviewsLoad] = useState<ReviewsLoad>({
    status: 'idle',
  })
  const [appsRetryKey, setAppsRetryKey] = useState(0)
  const [reviewsRetryKey, setReviewsRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const loadApps = async () => {
      try {
        const data = await fetchJson<AppsResponse>('/api/apps')
        if (controller.signal.aborted) return
        if (data.apps.length === 0) {
          setAppsLoad({ status: 'empty' })
          setSelectedAppId(null)
          setReviewsLoad({ status: 'idle' })
          return
        }
        setAppsLoad({ status: 'ready', apps: data.apps })
        setSelectedAppId((current) =>
          current !== null && data.apps.includes(current)
            ? current
            : data.apps[0],
        )
        setReviewsLoad({ status: 'loading' })
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'Failed to load configured apps'
        setAppsLoad({ status: 'error', message })
        setSelectedAppId(null)
        setReviewsLoad({ status: 'idle' })
      }
    }

    void loadApps()
    return () => controller.abort()
  }, [appsRetryKey])

  useEffect(() => {
    if (selectedAppId === null || reviewsLoad.status !== 'loading') {
      return
    }

    const controller = new AbortController()
    const appId = selectedAppId

    const loadReviews = async () => {
      try {
        const data = await fetchJson<ReviewsResponse>(
          `/api/apps/${encodeURIComponent(appId)}/reviews`,
        )
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
  }, [selectedAppId, reviewsLoad.status, reviewsRetryKey])

  const appsReady = appsLoad.status === 'ready' ? appsLoad.apps : []
  const showAppSelector = appsReady.length > 1

  return (
    <div className="app">
      <header className="app-header">
        <h1>ReviewStream</h1>
        <p className="app-header__subtitle">
          App Store reviews from the last 48 hours, newest first
        </p>
      </header>

      {appsLoad.status === 'loading' ? (
        <p className="state-message" role="status">
          Loading apps...
        </p>
      ) : null}

      {appsLoad.status === 'error' ? (
        <div className="state-panel state-panel--error" role="alert">
          <p>{appsLoad.message}</p>
          <button
            type="button"
            className="button"
            onClick={() => {
              setAppsLoad({ status: 'loading' })
              setAppsRetryKey((key) => key + 1)
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {appsLoad.status === 'empty' ? (
        <div className="state-panel" role="status">
          <p>No apps are configured. Add an app on the backend to see reviews.</p>
        </div>
      ) : null}

      {appsLoad.status === 'ready' ? (
        <section className="app-controls" aria-label="App selection">
          {showAppSelector ? (
            <label className="app-selector">
              <span className="app-selector__label">App</span>
              <select
                className="app-selector__select"
                value={selectedAppId ?? ''}
                onChange={(event) => {
                  setSelectedAppId(event.target.value)
                  setReviewsLoad({ status: 'loading' })
                }}
              >
                {appsReady.map((appId) => (
                  <option key={appId} value={appId}>
                    {appId}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="app-current" role="status">
              Viewing reviews for{' '}
              <code className="app-current__id">{appsReady[0]}</code>
            </p>
          )}
        </section>
      ) : null}

      {appsLoad.status === 'ready' && selectedAppId !== null ? (
        <section className="reviews" aria-label="Reviews">
          {reviewsLoad.status === 'loading' ? (
            <p className="state-message" role="status">
              Loading reviews...
            </p>
          ) : null}

          {reviewsLoad.status === 'error' ? (
            <div className="state-panel state-panel--error" role="alert">
              <p>{reviewsLoad.message}</p>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setReviewsLoad({ status: 'loading' })
                  setReviewsRetryKey((key) => key + 1)
                }}
              >
                Retry
              </button>
            </div>
          ) : null}

          {reviewsLoad.status === 'empty' ? (
            <div className="state-panel" role="status">
              <p>No reviews in the last 48 hours for this app.</p>
            </div>
          ) : null}

          {reviewsLoad.status === 'ready' ? (
            <ul className="review-list">
              {reviewsLoad.reviews.map((review) => (
                <li key={review.id}>
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

export default App
