import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardLoadingSkeleton = () => {
  return (
    <div className="dashboard-light space-y-8 p-8 bg-white min-h-screen animate-fade-in">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 bg-vesta-mist/40" />
        <Skeleton className="h-4 w-96 bg-vesta-mist/40" />
      </div>

      {/* Runway Alert Skeleton */}
      <Card className="bg-white border border-vesta-navy/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full bg-vesta-mist/40" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 bg-vesta-mist/40" />
                <Skeleton className="h-8 w-32 bg-vesta-mist/40" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-vesta-mist/40" />
          </div>
        </CardContent>
      </Card>

      {/* Large Chart Skeleton */}
      <Card className="bg-white border border-vesta-navy/10">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-48 bg-vesta-mist/40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full bg-vesta-mist/40" />
        </CardContent>
      </Card>

      {/* Two Chart Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-vesta-navy/10">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-40 bg-vesta-mist/40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full bg-vesta-mist/40" />
          </CardContent>
        </Card>
        <Card className="bg-white border border-vesta-navy/10">
          <CardHeader className="pb-4">
            <Skeleton className="h-5 w-40 bg-vesta-mist/40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full bg-vesta-mist/40" />
          </CardContent>
        </Card>
      </div>

      {/* Analytics Cards Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white border border-vesta-navy/10">
            <CardHeader className="pb-4">
              <Skeleton className="h-5 w-36 bg-vesta-mist/40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 bg-vesta-mist/40" />
                  <Skeleton className="h-8 w-32 bg-vesta-mist/40" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-3 w-20 bg-vesta-mist/40" />
                  <Skeleton className="h-8 w-24 bg-vesta-mist/40" />
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16 w-full bg-vesta-mist/40" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
