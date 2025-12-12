import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 border-b border-border p-4">
                <div className="grid grid-cols-5 gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </div>

            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-border last:border-0 p-4">
                    <div className="grid grid-cols-5 gap-4 items-center">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-28" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function BrandOverviewSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-5 w-32" />
                </div>
            ))}
        </div>
    );
}
