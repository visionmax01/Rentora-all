'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { serviceApi } from '@/lib/api';
import { 
  BoltIcon, 
  WrenchScrewdriverIcon, 
  SparklesIcon,
  UserIcon,
  SwatchIcon,
  SunIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'Electrical': BoltIcon,
  'Plumbing': WrenchScrewdriverIcon,
  'Cleaning': SparklesIcon,
  'Doctor': UserIcon,
  'Carpentry': SwatchIcon,
  'AC Repair': SunIcon,
  'Pest Control': BugAntIcon,
};

export function ServiceCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: () => serviceApi.getCategories().then((res) => res.data.data),
  });

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Home Services
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Book verified professionals for all your home maintenance needs
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-xl h-40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data?.map((category: any) => {
              const Icon = iconMap[category.name] || WrenchScrewdriverIcon;
              return (
                <Link
                  key={category.id}
                  href={`/services?category=${category.id}`}
                  className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.description}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}