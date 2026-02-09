'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '@/lib/api';
import { PropertyCard } from '@/components/cards/PropertyCard';
import { PropertyFilters } from '@/components/search/PropertyFilters';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setFilters(params);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertyApi.getAll(filters).then((res) => res.data),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search properties..."
                className="pl-10"
                defaultValue={filters.q}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
            <PropertyFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">
                {data?.meta?.total || 0} Properties found
              </h1>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Sort by: Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {data?.data?.map((property: any) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {data?.data?.length === 0 && (
                  <div className="text-center py-16">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-gray-500">
                      Try adjusting your filters or search criteria
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}