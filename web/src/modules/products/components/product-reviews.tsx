import { StarIcon } from "lucide-react";
import type { Product } from "@/types";
import "./ProductReviews.css";

interface ProductReviewsProps {
  product: Product;
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const ratings = product.reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Ensure all ratings (1-5) exist in the object
  const ratingCounts = {
    5: ratings[5] || 0,
    4: ratings[4] || 0,
    3: ratings[3] || 0,
    2: ratings[2] || 0,
    1: ratings[1] || 0,
  };

  const totalReviews = Object.values(ratingCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="reviews-overview">
      <div className="reviews-summary">
        <div className="reviews-rating-big">
          {product.rating.toFixed(1)}
        </div>
        <div className="reviews-summary-right">
          <div className="reviews-stars-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`reviews-star ${
                  i < Math.floor(product.rating) ? "filled" : ""
                }`}
              />
            ))}
          </div>
          <div className="reviews-count">
            Based on {product.numReviews} reviews
          </div>
        </div>
      </div>

      <div className="reviews-bars">
        {Object.entries(ratingCounts)
          .reverse()
          .map(([rating, count]) => (
            <div key={rating} className="reviews-bar-row">
              <div className="reviews-bar-label">{rating} stars</div>
              <div className="reviews-bar-track">
                <div
                  className="reviews-bar-fill"
                  style={{
                    width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : "0%",
                  }}
                />
              </div>
              <div className="reviews-bar-count">{count}</div>
            </div>
          ))}
      </div>

      <div className="reviews-list">
        {product.reviews.map((review, index) => (
          <div key={index} className="review-item">
            <div className="review-item-header">
              <div className="review-item-name">{review.name}</div>
              <div className="review-item-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="review-item-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  className={`reviews-star small ${
                    i < review.rating ? "filled" : ""
                  }`}
                />
              ))}
            </div>
            <p className="review-item-comment">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
