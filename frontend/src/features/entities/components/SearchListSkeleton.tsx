export const SearchListSkeleton = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="h-2.5 w-24 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="h-4 w-12 rounded-full bg-muted" />
            <div className="h-4 w-14 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
};
