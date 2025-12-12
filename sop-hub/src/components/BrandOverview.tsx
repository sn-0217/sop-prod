import { SOPFile, Brand } from '@/types/sop';
import { cn } from '@/lib/utils';
import { FileText, HardDrive } from 'lucide-react';
import { formatBytes } from '@/lib/formatters';

interface BrandOverviewProps {
    files: SOPFile[];
    onSelectBrand: (brand: Brand) => void;
}

const brands: { value: Brand; label: string; color: string; bgColor: string; textColor: string }[] = [
    {
        value: 'knitwell',
        label: 'Knitwell',
        color: 'bg-brand-knitwell',
        bgColor: 'bg-[hsl(var(--brand-knitwell))]/10',
        textColor: 'text-[hsl(var(--brand-knitwell))]'
    },
    {
        value: 'chicos',
        label: "Chico's",
        color: 'bg-brand-chicos',
        bgColor: 'bg-[hsl(var(--brand-chicos))]/10',
        textColor: 'text-[hsl(var(--brand-chicos))]'
    },
    {
        value: 'talbots',
        label: 'Talbots',
        color: 'bg-brand-talbots',
        bgColor: 'bg-[hsl(var(--brand-talbots))]/10',
        textColor: 'text-[hsl(var(--brand-talbots))]'
    },
];

export function BrandOverview({ files, onSelectBrand }: BrandOverviewProps) {
    const getBrandStats = (brand: Brand) => {
        const brandFiles = files.filter(f => f.brand === brand);
        const count = brandFiles.length;
        const size = brandFiles.reduce((acc, f) => acc + f.fileSize, 0);
        return { count, size };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {brands.map((brand) => {
                const stats = getBrandStats(brand.value);

                return (
                    <button
                        key={brand.value}
                        onClick={() => onSelectBrand(brand.value)}
                        className="group relative overflow-hidden bg-card hover:bg-muted/50 border border-border rounded-xl p-5 text-left transition-all duration-300 hover:shadow-md hover:border-primary/20"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${brand.bgColor} opacity-50 group-hover:scale-150 transition-transform duration-500`} />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", brand.bgColor)}>
                                    <div className={cn("w-3 h-3 rounded-full", brand.color)} />
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50">
                                    <HardDrive className="w-3 h-3" />
                                    {formatBytes(stats.size)}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                {brand.label}
                            </h3>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                <span>{stats.count} Document{stats.count !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
