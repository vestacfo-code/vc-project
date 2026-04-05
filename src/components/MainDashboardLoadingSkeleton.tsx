import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const MainDashboardLoadingSkeleton = () => {
  return (
    <div className="dashboard-light container mx-auto p-6 lg:p-8 min-h-screen bg-white animate-fade-in">
      {/* Header Skeleton */}
      <header className="mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-vesta-mist/40" />
            <Skeleton className="h-4 w-96 bg-vesta-mist/40" />
          </div>
          <Skeleton className="h-10 w-32 bg-vesta-mist/40" />
        </div>
      </header>

      {/* Tabs Skeleton */}
      <div className="mb-8 border-b border-vesta-navy/10">
        <div className="flex gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-24 bg-vesta-mist/40 mb-[-1px]" />
          ))}
        </div>
      </div>

      {/* Quick Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white border border-vesta-navy/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-10 w-10 rounded-lg bg-vesta-mist/40" />
                <Skeleton className="h-6 w-16 rounded-full bg-vesta-mist/40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 bg-vesta-mist/40" />
                <Skeleton className="h-8 w-32 bg-vesta-mist/40" />
                <Skeleton className="h-3 w-24 bg-vesta-mist/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Health Score */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-vesta-navy/10">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32 bg-vesta-mist/40" />
                <Skeleton className="h-6 w-20 rounded-full bg-vesta-mist/40" />
              </div>
              <div className="text-center space-y-4">
                <Skeleton className="h-24 w-24 mx-auto rounded-full bg-vesta-mist/40" />
                <Skeleton className="h-3 w-48 mx-auto bg-vesta-mist/40" />
                <Skeleton className="h-2 w-full bg-vesta-mist/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Large Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-vesta-navy/10">
            <CardContent className="pt-6">
              <Skeleton className="h-[400px] w-full bg-vesta-mist/40" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
