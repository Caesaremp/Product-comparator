interface StarRatingProps {
  value: number;
  size?: number;
}

export function StarRating({ value, size = 20 }: StarRatingProps) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((position) => {
        const fillPercent = Math.min(100, Math.max(0, (value - (position - 1)) * 100));
        return (
          <span key={position} className="star-container" style={{ fontSize: size, width: `${size * 0.85}px` }}>
            <span className="star star-bg">★</span>
            <span className="star star-fill" style={{ width: `${fillPercent}%` }}>★</span>
          </span>
        );
      })}
    </div>
  );
}
