import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  brands: string[];
  countries: string[];
}

export function PricingFilters({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedCountry,
  onCountryChange,
  brands,
  countries,
}: PricingFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Brand Pills */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onBrandChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
            selectedBrand === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
          )}
        >
          All Brands
        </button>
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => onBrandChange(brand)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
              selectedBrand === brand
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
            )}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Country Pills */}
      {countries.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <span className="text-xs text-muted-foreground mr-1">Country:</span>
          <button
            onClick={() => onCountryChange('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
              selectedCountry === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
            )}
          >
            All
          </button>
          {countries.map((country) => (
            <button
              key={country}
              onClick={() => onCountryChange(country)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
                selectedCountry === country
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
              )}
            >
              {country}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vesta-navy-muted" />
        <Input
          placeholder="Search UPC or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-secondary border-border focus:ring-0 focus:border-muted focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );
}
