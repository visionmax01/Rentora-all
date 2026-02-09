import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Join thousands of users finding their perfect home, booking services, 
          and buying great deals in Nepal.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              Create Free Account
            </Button>
          </Link>
          <Link href="/list-property">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              List Your Property
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}