import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BannerSlide {
  id: string;
  image: string;
  mobileImage?: string;
  alt: string;
  link?: string;
}

interface HeroCarouselProps {
  slides: BannerSlide[];
  autoPlayInterval?: number;
}

const HeroCarousel = ({ slides, autoPlayInterval = 5000 }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-muted">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full flex-shrink-0">
            <a href={slide.link || "#"} className="block">
              <img
                src={slide.image}
                alt={slide.alt}
                className="w-full h-48 md:h-64 lg:h-80 object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=400&fit=crop`;
                }}
              />
            </a>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/80 hover:bg-card rounded-full flex items-center justify-center shadow-lg transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/80 hover:bg-card rounded-full flex items-center justify-center shadow-lg transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-primary w-6' 
                : 'bg-card/60 hover:bg-card'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
