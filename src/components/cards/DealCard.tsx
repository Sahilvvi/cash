import { Copy, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DealCardProps {
  id: string;
  title: string;
  description: string;
  store: {
    name: string;
    logo: string;
  };
  couponCode?: string;
  cashback?: string;
  expiresAt?: string;
  isExclusive?: boolean;
  isVerified?: boolean;
}

const DealCard = ({
  id,
  title,
  description,
  store,
  couponCode,
  cashback,
  expiresAt,
  isExclusive,
  isVerified,
}: DealCardProps) => {
  const handleCopyCode = () => {
    if (couponCode) {
      navigator.clipboard.writeText(couponCode);
      toast.success("Coupon code copied!", {
        description: `Code "${couponCode}" copied to clipboard`,
      });
    }
  };

  return (
    <div className="deal-card">
      <div className="p-4">
        {/* Store Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 p-2">
            <img 
              src={store.logo} 
              alt={store.name} 
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name.substring(0, 2))}&background=F37022&color=fff&size=128&bold=true`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{store.name}</span>
              {isExclusive && (
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  EXCLUSIVE
                </span>
              )}
              {isVerified && (
                <span className="bg-success/10 text-success text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  VERIFIED
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 font-heading">
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>

        {/* Cashback & Expiry */}
        <div className="flex items-center justify-between mb-3">
          {cashback && (
            <span className="cashback-badge">
              {cashback} Cashback
            </span>
          )}
          {expiresAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {expiresAt}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {couponCode ? (
            <>
              <div className="flex-1 relative">
                <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-md px-3 py-2 text-center">
                  <span className="font-mono font-semibold text-primary text-sm tracking-wider">
                    {couponCode}
                  </span>
                </div>
              </div>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleCopyCode}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-1" />
              Get Deal
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealCard;
