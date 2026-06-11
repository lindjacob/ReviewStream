import type { ReviewsLoad } from '../types/load'
import { ReviewCard } from './ReviewCard'
import { StateMessage } from './StateMessage'
import { StatePanel } from './StatePanel'

type ReviewListProps = {
  reviewsLoad: ReviewsLoad
  onRetry: () => void
}

export function ReviewList({ reviewsLoad, onRetry }: ReviewListProps) {
  return (
    <section className="reviews" aria-label="Reviews">
      {reviewsLoad.status === 'loading' ? (
        <StateMessage message="Loading reviews..." />
      ) : null}

      {reviewsLoad.status === 'error' ? (
        <StatePanel
          variant="error"
          role="alert"
          message={reviewsLoad.message}
          onRetry={onRetry}
        />
      ) : null}

      {reviewsLoad.status === 'empty' ? (
        <StatePanel message="No reviews in the last 48 hours for this app." />
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
  )
}
