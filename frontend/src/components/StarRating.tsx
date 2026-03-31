interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((ratingValue) => (
        <button
          key={ratingValue}
          type="button"
          className={`star ${ratingValue <= value ? "filled" : ""}`}
          style={{ fontSize: size }}
          onClick={(event) => {
            event.stopPropagation();
            onChange?.(ratingValue);
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
