import { useWithdrawals } from "@/hooks/useWithdrawals";
import { Clock, CheckCircle, XCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";

const WithdrawalHistory = () => {
  const { data: withdrawals = [], isLoading } = useWithdrawals();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "approved":
        return <ArrowDownCircle className="w-5 h-5 text-primary" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning",
      approved: "bg-primary/10 text-primary",
      completed: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive",
    };
    return styles[status] || styles.pending;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      upi: "UPI",
      paytm: "Paytm",
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowDownCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No withdrawal requests yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your withdrawal history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {withdrawals.map((withdrawal) => (
        <div
          key={withdrawal.id}
          className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(withdrawal.status)}
              <div>
                <p className="font-semibold">₹{withdrawal.amount}</p>
                <p className="text-sm text-muted-foreground">
                  {getPaymentMethodLabel(withdrawal.payment_method)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusBadge(withdrawal.status)}`}>
                {withdrawal.status}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(withdrawal.requested_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {withdrawal.admin_notes && (
            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border">
              {withdrawal.admin_notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default WithdrawalHistory;
