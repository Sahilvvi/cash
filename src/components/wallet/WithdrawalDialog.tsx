import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRequestWithdrawal } from "@/hooks/useWithdrawals";
import { toast } from "sonner";
import { Loader2, Building2, Smartphone, CreditCard } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

const WithdrawalDialog = ({ open, onOpenChange, availableBalance }: WithdrawalDialogProps) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentDetails, setPaymentDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    accountName: "",
    upiId: "",
    paytmNumber: "",
  });

  const requestWithdrawal = useRequestWithdrawal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }

    if (withdrawalAmount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    let details: Json = {};
    
    if (paymentMethod === "bank_transfer") {
      if (!paymentDetails.accountNumber || !paymentDetails.ifscCode || !paymentDetails.accountName) {
        toast.error("Please fill all bank details");
        return;
      }
      details = {
        accountNumber: paymentDetails.accountNumber,
        ifscCode: paymentDetails.ifscCode,
        accountName: paymentDetails.accountName,
      };
    } else if (paymentMethod === "upi") {
      if (!paymentDetails.upiId) {
        toast.error("Please enter UPI ID");
        return;
      }
      details = { upiId: paymentDetails.upiId };
    } else if (paymentMethod === "paytm") {
      if (!paymentDetails.paytmNumber) {
        toast.error("Please enter Paytm number");
        return;
      }
      details = { paytmNumber: paymentDetails.paytmNumber };
    }

    try {
      await requestWithdrawal.mutateAsync({
        amount: withdrawalAmount,
        paymentMethod,
        paymentDetails: details,
      });
      toast.success("Withdrawal request submitted successfully!");
      onOpenChange(false);
      setAmount("");
      setPaymentDetails({
        accountNumber: "",
        ifscCode: "",
        accountName: "",
        upiId: "",
        paytmNumber: "",
      });
    } catch (error) {
      toast.error("Failed to submit withdrawal request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Available balance: ₹{availableBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="100"
              max={availableBalance}
              step="1"
              placeholder="Enter amount (min ₹100)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="bank_transfer" id="bank" />
                <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="w-4 h-4" />
                  Bank Transfer
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="w-4 h-4" />
                  UPI
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="paytm" id="paytm" />
                <Label htmlFor="paytm" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="w-4 h-4" />
                  Paytm Wallet
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentMethod === "bank_transfer" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  placeholder="Enter account holder name"
                  value={paymentDetails.accountName}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Enter account number"
                  value={paymentDetails.accountNumber}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  placeholder="Enter IFSC code"
                  value={paymentDetails.ifscCode}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value })}
                />
              </div>
            </div>
          )}

          {paymentMethod === "upi" && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="yourname@upi"
                value={paymentDetails.upiId}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
              />
            </div>
          )}

          {paymentMethod === "paytm" && (
            <div className="space-y-2">
              <Label htmlFor="paytmNumber">Paytm Mobile Number</Label>
              <Input
                id="paytmNumber"
                placeholder="Enter mobile number"
                value={paymentDetails.paytmNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, paytmNumber: e.target.value })}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={requestWithdrawal.isPending}
          >
            {requestWithdrawal.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Withdrawal Request"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalDialog;
