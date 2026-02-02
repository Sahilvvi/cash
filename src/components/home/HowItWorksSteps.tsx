import howItWorksBanner from "@/assets/how-it-works-banner.jpg";

const HowItWorksSteps = () => {
  return (
    <section className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Banner Image */}
      <img
        src={howItWorksBanner}
        alt="How it works - Registration, Sign Up, Shop Now, Get Cashback"
        className="w-full h-44 md:h-56 lg:h-64 object-cover object-center"
        loading="lazy"
      />
    </section>
  );
};

export default HowItWorksSteps;
