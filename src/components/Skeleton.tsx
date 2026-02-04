export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="flex-1 h-12 bg-gray-200 rounded" />
          <div className="flex-1 h-12 bg-gray-200 rounded" />
          <div className="w-24 h-12 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-4/5" />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}
