export const EntityCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-56 bg-background/95 backdrop-blur border rounded-xl shadow-md p-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-2.5 w-20 rounded bg-muted" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div className="h-4 w-14 rounded-full bg-muted" />
        <div className="h-4 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
}
