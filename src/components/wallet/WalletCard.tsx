import { useState } from "react";
import { Wallet, ArrowDownCircle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCashbackStats } from "@/hooks/useCashback";
import { useWithdrawalStats } from "@/hooks/useWithdrawals";
import WithdrawalDialog from "./WithdrawalDialog";

const WalletCard = () => {
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const { data: cashbackStats } = useCashbackStats();
  const { data: withdrawalStats } = useWithdrawalStats();

  const availableBalance = (cashbackStats?.available || 0) - (withdrawalStats?.pending || 0);
  const canWithdraw = availableBalance >= 100;

  return (
    <>
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-foreground/20 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Available Balance</p>
              <p className="text-3xl font-bold font-heading">₹{availableBalance.toFixed(2)}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowWithdrawal(true)}
            disabled={!canWithdraw}
            variant="secondary"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-xs opacity-70">Confirmed</p>
            <p className="font-semibold">₹{cashbackStats?.confirmed || 0}</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-xs opacity-70">Pending</p>
            <p className="font-semibold">₹{cashbackStats?.pending || 0}</p>
          </div>
          <div className="bg-primary-foreground/10 rounded-xl p-3 text-center">
            <ArrowDownCircle className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-xs opacity-70">Withdrawn</p>
            <p className="font-semibold">₹{withdrawalStats?.completed || 0}</p>
          </div>
        </div>

        {!canWithdraw && availableBalance > 0 && (
          <p className="text-xs text-center mt-4 opacity-80">
            Minimum withdrawal amount is ₹100
          </p>
        )}
      </div>

      <WithdrawalDialog
        open={showWithdrawal}
        onOpenChange={setShowWithdrawal}
        availableBalance={availableBalance}
      />
    </>
  );
};

export default WalletCard;
