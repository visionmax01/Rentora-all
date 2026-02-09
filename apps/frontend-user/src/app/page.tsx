import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { ServiceCategories } from '@/components/home/ServiceCategories';
import { FeaturedMarketplace } from '@/components/home/FeaturedMarketplace';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CTASection } from '@/components/home/CTASection';

export default function Home() {
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <FeaturedProperties />
      <ServiceCategories />
      <FeaturedMarketplace />
      <HowItWorks />
      <CTASection />
    </div>
  );
}