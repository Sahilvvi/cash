import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDeals } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";

const PromotionalCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { data: deals = [], isLoading } = useDeals();

  const promotionalDeals = deals.slice(0, 8);

  const gradients = [
    "from-pink-400 via-pink-300 to-pink-200",
    "from-purple-400 via-purple-300 to-pink-300",
    "from-orange-400 via-orange-300 to-yellow-200",
    "from-blue-400 via-blue-300 to-cyan-200",
    "from-emerald-400 via-emerald-300 to-teal-200",
    "from-rose-400 via-rose-300 to-pink-200",
    "from-indigo-400 via-indigo-300 to-purple-200",
    "from-amber-400 via-amber-300 to-yellow-200",
  ];

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', updateScrollButtons);
      return () => scrollEl.removeEventListener('scroll', updateScrollButtons);
    }
  }, [promotionalDeals]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="w-72 h-44 rounded-xl flex-shrink-0" />
        ))}
      </div>
    );
  }

  if (promotionalDeals.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card/90 hover:bg-card rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {promotionalDeals.map((deal, index) => (
          <a
            key={deal.id}
            href={`/stores/${deal.store?.slug || ''}`}
            className="flex-shrink-0 w-72 h-44 rounded-xl overflow-hidden relative group/card transition-transform hover:scale-[1.02]"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`} />
            
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full" />
            <div className="absolute -right-4 -bottom-10 w-24 h-24 bg-white/10 rounded-full" />
            
            {/* Content */}
            <div className="relative z-10 p-5 h-full flex flex-col justify-between">
              {/* Store Logo */}
              <div className="flex items-start justify-between">
                <div className="bg-white rounded-lg p-2 shadow-md">
                  <img
                    src={deal.store?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.store?.name || 'S')}&background=fff&color=333`}
                    alt={deal.store?.name || 'Store'}
                    className="w-12 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.store?.name || 'S')}&background=fff&color=333`;
                    }}
                  />
                </div>
                {deal.is_exclusive && (
                  <span className="bg-white/90 text-xs font-semibold px-2 py-1 rounded-full text-gray-800">
                    Exclusive
                  </span>
                )}
              </div>

              {/* Deal Info */}
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm line-clamp-2">
                  {deal.discount_text || deal.title}
                </h3>
                
                {/* Cashback Badge */}
                {deal.cashback_percent && (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    Flat {deal.cashback_percent}% Cashback
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card/90 hover:bg-card rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      )}
    </div>
  );
};

export default PromotionalCarousel;
