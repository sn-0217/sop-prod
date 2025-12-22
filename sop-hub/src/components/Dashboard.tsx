import { useState, useEffect } from 'react';
import { sopApi, approvalApi } from '@/services/sopApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Upload, FolderOpen, CheckCircle, Activity, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PendingApprovals } from './PendingApprovals';
import { ThemeToggle } from './ThemeToggle';

interface DashboardProps {
    onUploadClick: () => void;
    onBrandSelect: (brand: 'knitwell' | 'chicos' | 'talbots' | 'all') => void;
    onApprovalComplete: () => void;
}

interface Stats {
    total: number;
    knitwell: number;
    chicos: number;
    talbots: number;
    pendingApprovals: number;
}

interface RecentDocument {
    fileName: string;
    brand: string;
    modifiedAt: string;
    action: 'uploaded' | 'updated';
}

export function Dashboard({ onUploadClick, onBrandSelect, onApprovalComplete }: DashboardProps) {
    const [stats, setStats] = useState<Stats>({
        total: 0,
        knitwell: 0,
        chicos: 0,
        talbots: 0,
        pendingApprovals: 0,
    });
    const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [showPendingApprovals, setShowPendingApprovals] = useState(false);
    const [weeklyStats, setWeeklyStats] = useState<{ date: string, count: number, label: string }[]>([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async (silent = false) => {
        // Only show loading skeletons on initial load, not on refreshes
        if (!silent && !hasLoadedOnce) {
            setLoadingStats(true);
            setLoadingRecent(true);
        }

        try {
            // Load stats and recent docs in parallel
            const [allDocs, pendingOps] = await Promise.all([
                sopApi.getSOPs('knitwell'),
                approvalApi.getPendingOperations(),
            ]);

            // Update stats immediately
            const knitwellCount = allDocs.filter(d => d.brand === 'knitwell').length;
            const chicosCount = allDocs.filter(d => d.brand === 'chicos').length;
            const talbotsCount = allDocs.filter(d => d.brand === 'talbots').length;

            // Process recent documents
            const sorted = allDocs
                .filter(d => d.modifiedAt)
                .sort((a, b) => new Date(b.modifiedAt || 0).getTime() - new Date(a.modifiedAt || 0).getTime())
                .slice(0, 6)
                .map(d => ({
                    fileName: d.fileName,
                    brand: d.brand,
                    modifiedAt: d.modifiedAt || '',
                    action: 'updated' as const,
                }));

            // Calculate weekly stats
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d;
            }).reverse();

            const activityMap = allDocs.reduce((acc, doc) => {
                if (doc.modifiedAt) {
                    const dateStr = doc.modifiedAt.split('T')[0];
                    acc[dateStr] = (acc[dateStr] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const weeklyActivity = last7Days.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                return {
                    date: dateStr,
                    count: activityMap[dateStr] || 0,
                    label: date.toLocaleDateString('en-US', { weekday: 'short' })
                };
            });

            setWeeklyStats(weeklyActivity);

            // Update all states together
            setStats({
                total: allDocs.length,
                knitwell: knitwellCount,
                chicos: chicosCount,
                talbots: talbotsCount,
                pendingApprovals: pendingOps.length,
            });
            setRecentDocs(sorted);
            setLoadingStats(false);
            setLoadingRecent(false);
            setHasLoadedOnce(true);

            // Auto-hide pending approvals section if all cleared
            if (pendingOps.length === 0) {
                setShowPendingApprovals(false);
            }

        } catch (error) {
            console.error('Failed to load stats:', error);
            setLoadingStats(false);
            setLoadingRecent(false);
            setHasLoadedOnce(true);
        }
    };

    const handleApprovalComplete = () => {
        loadStats(true); // Silent refresh - don't show loading skeletons
        onApprovalComplete();
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const statCards = [
        {
            label: 'Total Documents',
            value: stats.total,
            icon: FileText,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            onClick: () => onBrandSelect('all'),
        },
        {
            label: 'Knitwell',
            value: stats.knitwell,
            icon: FolderOpen,
            color: 'bg-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
            onClick: () => onBrandSelect('knitwell'),
        },
        {
            label: "Chico's",
            value: stats.chicos,
            icon: FolderOpen,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-950/30',
            onClick: () => onBrandSelect('chicos'),
        },
        {
            label: 'Talbots',
            value: stats.talbots,
            icon: FolderOpen,
            color: 'bg-amber-500',
            bgColor: 'bg-amber-50 dark:bg-amber-950/30',
            onClick: () => onBrandSelect('talbots'),
        },
        {
            label: 'Pending Approvals',
            value: stats.pendingApprovals,
            icon: Clock,
            color: stats.pendingApprovals > 0 ? 'bg-orange-500' : 'bg-green-500',
            bgColor: stats.pendingApprovals > 0
                ? 'bg-orange-50 dark:bg-orange-950/30'
                : 'bg-green-50 dark:bg-green-950/30',
            highlight: stats.pendingApprovals > 0,
            onClick: () => {
                if (stats.pendingApprovals > 0) {
                    setShowPendingApprovals(!showPendingApprovals);
                }
            },
        },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome to SOP Management System</p>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Button onClick={onUploadClick} className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Document
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((card) => {
                    const isPendingCard = card.label === 'Pending Approvals';
                    const isDisabled = isPendingCard && typeof card.value === 'number' && card.value === 0;

                    return (
                        <button
                            key={card.label}
                            onClick={card.onClick}
                            disabled={isDisabled}
                            className={cn(
                                "p-4 rounded-xl border transition-all text-left",
                                !isDisabled && "hover:scale-[1.02] hover:shadow-md cursor-pointer",
                                isDisabled && "cursor-default opacity-80",
                                card.bgColor,
                                card.highlight && "ring-2 ring-orange-500/20"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", card.color)}>
                                    <card.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-2xl font-bold text-foreground">
                                        {loadingStats ? '...' : card.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{card.label}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Pending Approvals Section - Toggle */}
            {showPendingApprovals && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <h2 className="text-lg font-semibold">Pending Approvals</h2>
                            {stats.pendingApprovals > 0 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                                    {stats.pendingApprovals} pending
                                </span>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowPendingApprovals(false)}>
                            Hide
                        </Button>
                    </div>
                    <PendingApprovals onApprovalSuccess={handleApprovalComplete} />
                </div>
            )}
            {/* Call to action if no pending approvals shown */}
            {!showPendingApprovals && stats.pendingApprovals > 0 && (
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <div>
                                <p className="font-medium text-orange-700 dark:text-orange-300">
                                    {stats.pendingApprovals} document{stats.pendingApprovals !== 1 ? 's' : ''} awaiting approval
                                </p>
                                <p className="text-sm text-orange-600 dark:text-orange-400">
                                    Click to review and approve pending operations
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                            onClick={() => setShowPendingApprovals(true)}
                        >
                            Review
                        </Button>
                    </div>
                </div>
            )}
            {/* Recent Activity - Full Width */}
            <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold">Recent Documents</h3>
                </div>
                {loadingRecent ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col gap-2 p-4 border rounded-xl animate-pulse">
                                <div className="flex justify-between">
                                    <div className="h-8 w-8 bg-muted rounded-lg" />
                                    <div className="h-5 w-16 bg-muted rounded-full" />
                                </div>
                                <div className="space-y-2 mt-2">
                                    <div className="h-4 w-full bg-muted rounded" />
                                    <div className="h-3 w-20 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recentDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide">
                        {recentDocs.map((doc, i) => (
                            <div
                                key={i}
                                className="min-w-[85%] sm:min-w-[45%] lg:min-w-[calc(25%-0.75rem)] flex-shrink-0 snap-start group flex flex-col items-start gap-3 p-4 rounded-xl bg-muted/20 border border-transparent hover:border-border hover:bg-muted/40 hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => onBrandSelect(doc.brand as any)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        doc.brand === 'knitwell' ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60" :
                                            doc.brand === 'chicos' ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60" :
                                                "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60"
                                    )}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <Badge variant="secondary" className={cn(
                                        "text-[10px] px-1.5 py-0 h-5 font-normal border-0",
                                        doc.brand === 'knitwell' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" :
                                            doc.brand === 'chicos' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" :
                                                "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                                    )}>
                                        {doc.brand}
                                    </Badge>
                                </div>

                                <div className="w-full space-y-1">
                                    <p className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors" title={doc.fileName}>
                                        {doc.fileName}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatRelativeTime(doc.modifiedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Row: Quick Stats & Weekly Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Stats Summary */}
                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold">Quick Overview</h3>
                    </div>
                    {loadingStats ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-5 w-8 bg-muted rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-28 bg-muted rounded" />
                                <div className="h-5 w-8 bg-muted rounded" />
                            </div>
                            <div className="h-px bg-border" />
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-2 rounded-lg bg-muted/50">
                                        <div className="h-6 w-6 bg-muted rounded mx-auto mb-1" />
                                        <div className="h-3 w-12 bg-muted rounded mx-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Brand Distribution</span>
                                    <span className="font-medium">{stats.total} Total</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden flex">
                                    {stats.total > 0 && (
                                        <>
                                            <div
                                                style={{ width: `${(stats.knitwell / stats.total) * 100}%` }}
                                                className="bg-emerald-500 h-full"
                                            />
                                            <div
                                                style={{ width: `${(stats.chicos / stats.total) * 100}%` }}
                                                className="bg-purple-500 h-full"
                                            />
                                            <div
                                                style={{ width: `${(stats.talbots / stats.total) * 100}%` }}
                                                className="bg-amber-500 h-full"
                                            />
                                        </>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Knitwell</span>
                                    </div>
                                    <div className="flex items-center gap-1 justify-center">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span>Chico's</span>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span>Talbots</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border my-4" />

                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border text-center group">
                                    <p className="text-2xl font-bold text-emerald-600 group-hover:scale-110 transition-transform">{stats.knitwell}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Knitwell</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border text-center group">
                                    <p className="text-2xl font-bold text-purple-600 group-hover:scale-110 transition-transform">{stats.chicos}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Chico's</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border text-center group">
                                    <p className="text-2xl font-bold text-amber-600 group-hover:scale-110 transition-transform">{stats.talbots}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Talbots</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Weekly Activity */}
                <div className="p-6 rounded-xl border bg-card">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold">Weekly Activity</h3>
                    </div>
                    {loadingStats ? (
                        <div className="h-[150px] animate-pulse bg-muted/30 rounded-lg" />
                    ) : (
                        <div className="h-[150px] flex items-end justify-between gap-2 pt-4">
                            {weeklyStats.map((day, i) => {
                                const maxCount = Math.max(...weeklyStats.map(d => d.count), 1);
                                const heightStr = `${(day.count / maxCount) * 100}%`;
                                const isToday = i === 6;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                        <div className="relative w-full flex justify-center h-full items-end">
                                            <div
                                                className={cn(
                                                    "w-full max-w-[30px] rounded-t-sm transition-all duration-500",
                                                    isToday ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"
                                                )}
                                                style={{ height: day.count > 0 ? heightStr : '4px' }}
                                            >
                                                {day.count > 0 && (
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-popover px-1.5 py-0.5 rounded shadow-sm border">
                                                        {day.count}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-medium uppercase",
                                            isToday ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {day.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
