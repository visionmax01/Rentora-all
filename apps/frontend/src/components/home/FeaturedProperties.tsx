'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { propertyApi } from '@/lib/api';
import { PropertyCard } from '@/components/cards/PropertyCard';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function FeaturedProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ['featuredProperties'],
    queryFn: () => propertyApi.getFeatured().then((res) => res.data.data),
  });

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Featured Properties
            </h2>
            <p className="text-gray-600 text-lg">
              Hand-picked rentals with the best value
            </p>
          </div>
          <Link href="/properties" className="hidden md:block">
            <Button variant="outline">
              View All <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-xl h-96 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.map((property: any) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/properties">
                <Button variant="outline">
                  View All Properties <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}