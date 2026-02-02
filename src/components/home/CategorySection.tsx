import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useHomepage";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import categoryRow1 from "@/assets/categories/category-row-1.png";
import categoryRow2 from "@/assets/categories/category-row-2.png";

// Mapping from category slug to sprite image position
const categoryImageMap: Record<string, { image: string; position: number; totalItems: number }> = {
  "most-popular": { image: categoryRow1, position: 0, totalItems: 9 },
  "electronics": { image: categoryRow1, position: 1, totalItems: 9 },
  "fashion": { image: categoryRow1, position: 2, totalItems: 9 },
  "home-kitchen": { image: categoryRow1, position: 3, totalItems: 9 },
  "home-living": { image: categoryRow1, position: 3, totalItems: 9 },
  "cashback-offers": { image: categoryRow1, position: 4, totalItems: 9 },
  "credit-cards": { image: categoryRow1, position: 5, totalItems: 9 },
  "mobiles": { image: categoryRow1, position: 6, totalItems: 9 },
  "beauty-grooming": { image: categoryRow1, position: 7, totalItems: 9 },
  "beauty": { image: categoryRow1, position: 7, totalItems: 9 },
  "travel": { image: categoryRow1, position: 8, totalItems: 9 },
  "food-grocery": { image: categoryRow2, position: 0, totalItems: 8 },
  "food-dining": { image: categoryRow2, position: 0, totalItems: 8 },
  "pharmacy": { image: categoryRow2, position: 1, totalItems: 8 },
  "health": { image: categoryRow2, position: 1, totalItems: 8 },
  "new-stores": { image: categoryRow2, position: 2, totalItems: 8 },
  "education": { image: categoryRow2, position: 3, totalItems: 8 },
  "loans": { image: categoryRow2, position: 4, totalItems: 8 },
  "health-wellness": { image: categoryRow2, position: 5, totalItems: 8 },
  "departmental": { image: categoryRow2, position: 6, totalItems: 8 },
  "entertainment": { image: categoryRow2, position: 6, totalItems: 8 },
  "bonus-cashback": { image: categoryRow2, position: 7, totalItems: 8 },
  "sports": { image: categoryRow2, position: 7, totalItems: 8 },
  "books": { image: categoryRow2, position: 3, totalItems: 8 },
  "mens-fashion": { image: categoryRow1, position: 2, totalItems: 9 }, // Use fashion image
};

// Default fallback for unmapped categories
const defaultImageConfig = { image: categoryRow1, position: 0, totalItems: 9 };

const CategorySection = () => {
  const { data: categories, isLoading } = useCategories();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 10);
      setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -250 : 250,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-5">
          Top Categories
        </h2>
        <div className="flex gap-5 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <h2 className="text-xl md:text-2xl font-bold font-heading text-foreground mb-5">
        Top Categories
      </h2>
      
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 translate-y-4 z-20 w-10 h-10 bg-card shadow-xl rounded-full items-center justify-center hover:bg-muted transition-all border border-border ${
          showLeft ? 'flex' : 'hidden'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 translate-y-4 z-20 w-10 h-10 bg-card shadow-xl rounded-full items-center justify-center hover:bg-muted transition-all border border-border ${
          showRight ? 'flex' : 'hidden'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Single Row Slider */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide scroll-smooth py-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories?.map((category) => {
          const imageConfig = categoryImageMap[category.slug] || defaultImageConfig;
          return (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="flex flex-col items-center gap-2.5 flex-shrink-0 group"
            >
              {/* Circular Image Container */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-muted/30 shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 ring-2 ring-transparent group-hover:ring-primary/20">
                {/* Category Image - cropped from composite */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${imageConfig.image})`,
                    backgroundSize: `${imageConfig.totalItems * 100}% auto`,
                    backgroundPosition: `${(imageConfig.position / (imageConfig.totalItems - 1)) * 100}% center`,
                  }}
                />
              </div>
              
              {/* Category Name */}
              <span className="text-xs md:text-sm font-medium text-center text-foreground/70 group-hover:text-foreground transition-colors w-20 md:w-24 leading-tight line-clamp-2">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>

    </section>
  );
};

export default CategorySection;
