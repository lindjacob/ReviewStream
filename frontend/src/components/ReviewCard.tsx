import type { ReviewDto } from '@reviewstream/shared/api'
import { formatSubmittedAt } from '../lib/date'
import { StarRating } from './StarRating'

type ReviewCardProps = {
  review: ReviewDto
}

export function ReviewCard({ review }: ReviewCardProps) {
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
