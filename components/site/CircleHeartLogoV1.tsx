import wordmark from "@/studio/presentation/brand/circleheart-wordmark.svg?raw";
import symbol from "@/studio/presentation/brand/circleheart-symbol.svg?raw";

/** Static, checked-in paths; the enclosing home link supplies the accessible name. */
export function CircleHeartLogoV1({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={compact ? "circleheart-symbol" : "circleheart-wordmark"}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: compact ? symbol : wordmark }}
    />
  );
}
