import { 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  KeyIcon,
  StarIcon 
} from '@heroicons/react/24/outline';

const steps = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Search',
    description: 'Browse thousands of listings for properties, services, and items.',
  },
  {
    icon: CalendarIcon,
    title: 'Book',
    description: 'Schedule viewings, book services, or message sellers directly.',
  },
  {
    icon: KeyIcon,
    title: 'Move In / Get Service',
    description: 'Complete your booking and enjoy your new space or service.',
  },
  {
    icon: StarIcon,
    title: 'Review',
    description: 'Share your experience and help others make better decisions.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Simple steps to find what you need
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary-600" />
              </div>
              <div className="absolute top-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}