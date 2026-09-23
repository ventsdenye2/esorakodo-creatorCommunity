type ArrowIconProps = {
  className?: string;
  direction?: "right" | "left";
};

export function ArrowIcon({ className, direction = "right" }: ArrowIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "right" ? "M5 12h13m-5-5 5 5-5 5" : "M19 12H6m5-5-5 5 5 5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
