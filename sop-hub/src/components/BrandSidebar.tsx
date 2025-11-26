import { Brand, BrandFilter } from '@/types/sop';
import { cn } from '@/lib/utils';
import { Building2, Home } from 'lucide-react';

interface BrandSidebarProps {
  selectedBrand: BrandFilter;
  onSelectBrand: (brand: BrandFilter) => void;
}

const brands: { value: Brand; label: string; color: string }[] = [
  { value: 'knitwell', label: 'Knitwell', color: 'brand-knitwell' },
  { value: 'chicos', label: "Chico's", color: 'brand-chicos' },
  { value: 'talbots', label: 'Talbots', color: 'brand-talbots' },
];

export function BrandSidebar({ selectedBrand, onSelectBrand }: BrandSidebarProps) {
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="px-8 py-5 flex items-center gap-8">
        <nav className="flex gap-2">
          <button
            onClick={() => onSelectBrand('home')}
            className={cn(
              'px-4 py-2 rounded-md transition-all duration-200',
              'flex items-center gap-2 font-medium text-sm',
              selectedBrand === 'home'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <div className="w-px h-6 bg-border mx-2 self-center" />
          {brands.map(brand => (
            <button
              key={brand.value}
              onClick={() => onSelectBrand(brand.value)}
              className={cn(
                'px-4 py-2 rounded-md transition-all duration-200',
                'flex items-center gap-2 font-medium text-sm',
                selectedBrand === brand.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  selectedBrand === brand.value ? 'bg-primary-foreground' : `bg-${brand.color}`
                )}
              />
              <span>{brand.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
