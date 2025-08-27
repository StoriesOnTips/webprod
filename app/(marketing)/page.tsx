import LandingFeatures from "./_components/LandingFeatures";
import LandingHero from "./_components/LandingHero";
import LandingImageStyle from "./_components/LandingImageStyle";
import LandingPricing from "./_components/LandingPricing";
import LandingCallToAction from "./_components/LandingCallToAction";

export default function Home() {
  return (
    <div className="bg-black">
      <LandingHero />
      <LandingFeatures />
      <LandingImageStyle />
      <LandingPricing/>
      <LandingCallToAction/>
    </div>
  );
}
