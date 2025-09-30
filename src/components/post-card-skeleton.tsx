import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="bg-card p-4 rounded-lg border">
      <div className="flex items-center mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="ml-3 space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}
