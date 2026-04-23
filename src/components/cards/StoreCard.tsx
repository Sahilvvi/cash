import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCashbackShort } from "@/lib/cashback";

interface StoreCardProps {
  id: string;
  name: string;
  logo: string;
  // Accept the numeric percent + type the rest of the app already uses.
  // Older callers can still pass a pre-formatted `cashback` string.
  cashbackPercent?: number | string | null;
  cashback?: string;
  cashbackType: "percent" | "flat" | "voucher";
  offersCount: number;
  isNew?: boolean;
  isTrending?: boolean;
}

const StoreCard = ({
  id,
  name,
  logo,
  cashbackPercent,
  cashback,
  cashbackType,
  offersCount,
  isNew,
  isTrending,
}: StoreCardProps) => {
  const cashbackText =
    cashbackPercent !== undefined && cashbackPercent !== null
      ? formatCashbackShort(cashbackPercent, cashbackType)
      // Fallback for legacy callers that pass a preformatted string
      : cashback
      ? `${cashback} Cashback`
      : "Cashback Available";

  return (
    <Link to={`/store/${id}`} className="store-card group cursor-pointer block">
      <div className="relative">
        {/* Badges */}
        <div className="absolute -top-2 -right-2 flex flex-col gap-1 z-10">
          {isNew && (
            <span className="bg-success text-success-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
              NEW
            </span>
          )}
          {isTrending && (
            <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
              HOT
            </span>
          )}
        </div>

        {/* Logo */}
        <div className="h-20 flex items-center justify-center mb-3 relative">
          <img 
            src={logo} 
            alt={name} 
            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.substring(0, 2))}&background=F37022&color=fff&size=128&bold=true`;
            }}
          />
        </div>

        {/* Cashback Info */}
        <div className="text-center">
          <p className="text-primary font-semibold text-sm mb-1">
            {cashbackText}
          </p>
          <p className="text-muted-foreground text-xs">
            {offersCount} Offers
          </p>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            <ExternalLink className="w-3 h-3" />
            Shop Now
          </span>
        </div>
      </div>
    </Link>
  );
};

export default StoreCard;
