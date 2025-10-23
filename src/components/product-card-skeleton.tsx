
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3 flex flex-col flex-grow">
        {/* Title Skeleton */}
        <Skeleton className="h-5 w-4/5 mb-2" />
        <Skeleton className="h-5 w-3/5" />

        <div className="flex-grow" />

        {/* Price and Stock Skeleton */}
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-5 w-1/4" />
        </div>

        {/* Button Skeleton */}
        <Skeleton className="h-9 w-full mt-3" />
      </CardContent>
    </Card>
  );
}
