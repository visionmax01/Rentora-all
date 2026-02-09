'use client';

import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface PropertyFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

export function PropertyFilters({ filters, onChange }: PropertyFiltersProps) {
  const { data: types } = useQuery({
    queryKey: ['propertyTypes'],
    queryFn: () => propertyApi.getTypes().then((res) => res.data.data),
  });

  const { data: cities } = useQuery({
    queryKey: ['propertyCities'],
    queryFn: () => propertyApi.getCities().then((res) => res.data.data),
  });

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) delete newFilters[key];
    onChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
        
        {/* Property Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <div className="space-y-2">
            {types?.map((type: string) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={filters.type === type}
                  onChange={(e) => updateFilter('type', e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (per month)
          </label>
          <select
            value={filters.priceRange || ''}
            onChange={(e) => updateFilter('priceRange', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Any Price</option>
            <option value="0-10000">Under {formatPrice(10000)}</option>
            <option value="10000-25000">{formatPrice(10000)} - {formatPrice(25000)}</option>
            <option value="25000-50000">{formatPrice(25000)} - {formatPrice(50000)}</option>
            <option value="50000-100000">{formatPrice(50000)} - {formatPrice(100000)}</option>
            <option value="100000+">{formatPrice(100000)}+</option>
          </select>
        </div>

        {/* Bedrooms */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => updateFilter('bedrooms', num.toString())}
                className={`flex-1 py-2 rounded-lg border ${
                  filters.bedrooms === num.toString()
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                }`}
              >
                {num}+
              </button>
            ))}
          </div>
        </div>

        {/* City */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <select
            value={filters.city || ''}
            onChange={(e) => updateFilter('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Cities</option>
            {cities?.map((city: { name: string; count: number }) => (
              <option key={city.name} value={city.name}>
                {city.name} ({city.count})
              </option>
            ))}
          </select>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amenities
          </label>
          <div className="space-y-2">
            {['WiFi', 'Parking', 'AC', 'Furnished', 'Security'].map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.amenities?.includes(amenity)}
                  onChange={(e) => {
                    const current = filters.amenities?.split(',') || [];
                    if (e.target.checked) {
                      updateFilter('amenities', [...current, amenity].join(','));
                    } else {
                      updateFilter('amenities', current.filter(a => a !== amenity).join(','));
                    }
                  }}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => onChange({})}
          className="w-full py-2 text-primary-600 hover:text-primary-700 font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}