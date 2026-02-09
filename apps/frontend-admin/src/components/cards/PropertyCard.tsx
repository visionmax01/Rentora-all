'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getPropertyTypeLabel, getPriceUnitLabel } from '@/lib/utils';
import { MapPinIcon, BedIcon, BathIcon, SquareIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    type: string;
    price: number;
    priceUnit: string;
    city: string;
    address: string;
    bedrooms?: number;
    bathrooms?: number;
    areaSqFt?: number;
    images: { url: string }[];
    isFeatured?: boolean;
    isVerified?: boolean;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const imageUrl = property.images?.[0]?.url || '/placeholder-property.jpg';

  return (
    <div className="group card-hover">
      {/* Image */}
      <Link href={`/properties/${property.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.isFeatured && (
            <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded">
              Featured
            </span>
          )}
          {property.isVerified && (
            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
              Verified
            </span>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
        >
          <HeartIcon
            className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>

        {/* Type Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            {getPropertyTypeLabel(property.type)}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
              <MapPinIcon className="w-4 h-4" />
              <span className="line-clamp-1">{property.city}, {property.address}</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1">
              <BedIcon className="w-4 h-4" />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1">
              <BathIcon className="w-4 h-4" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
          {property.areaSqFt && (
            <div className="flex items-center gap-1">
              <SquareIcon className="w-4 h-4" />
              <span>{property.areaSqFt} sqft</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary-600">
              {formatPrice(property.price)}
            </span>
            <span className="text-gray-500 text-sm">
              {getPriceUnitLabel(property.priceUnit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}