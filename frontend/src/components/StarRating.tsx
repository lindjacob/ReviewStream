import { clampRating } from '../lib/rating'

type StarRatingProps = {
  rating: number
}

export function StarRating({ rating }: StarRatingProps) {
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
