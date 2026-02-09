'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getConditionLabel } from '@/lib/utils';
import { MapPinIcon, TagIcon } from '@heroicons/react/24/outline';

interface MarketplaceCardProps {
  item: {
    id: string;
    title: string;
    price: number;
    isNegotiable: boolean;
    city: string;
    condition: string;
    category: string;
    images: { url: string }[];
  };
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
  const imageUrl = item.images?.[0]?.url || '/placeholder-item.jpg';

  return (
    <Link href={`/marketplace/${item.id}`} className="group card-hover block">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Condition Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            {getConditionLabel(item.condition)}
          </span>
        </div>

        {/* Negotiable Badge */}
        {item.isNegotiable && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
              Negotiable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <TagIcon className="w-3 h-3" />
          <span>{item.category}</span>
        </div>

        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mt-2">
          <MapPinIcon className="w-4 h-4" />
          <span>{item.city}</span>
        </div>

        <div className="mt-3">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}