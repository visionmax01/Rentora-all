'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { marketplaceApi } from '@/lib/api';
import { MarketplaceCard } from '@/components/cards/MarketplaceCard';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export function FeaturedMarketplace() {
  const { data, isLoading } = useQuery({
    queryKey: ['featuredMarketplace'],
    queryFn: () =>
      marketplaceApi.getAll({ limit: '4' }).then((res) => res.data.data),
  });

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Marketplace
            </h2>
            <p className="text-gray-600 text-lg">
              Buy and sell pre-owned items in your area
            </p>
          </div>
          <Link href="/marketplace" className="hidden md:block">
            <Button variant="outline">
              Browse All <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-xl h-72 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data?.map((item: any) => (
                <MarketplaceCard key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/marketplace">
                <Button variant="outline">
                  Browse All Items <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}