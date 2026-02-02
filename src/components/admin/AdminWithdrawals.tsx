import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  IndianRupee,
  Building2,
  Smartphone,
  CreditCard,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_details: Record<string, string> | null;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
  };
}

const AdminWithdrawals = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch all withdrawals with user info
  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["admin_withdrawals"],
    queryFn: async () => {
      // First get withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .order("requested_at", { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Get unique user IDs
      const userIds = [...new Set(withdrawalsData.map(w => w.user_id))];

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      // Map profiles by user_id
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine data
      return withdrawalsData.map(w => ({
        ...w,
        user: profileMap.get(w.user_id) || null,
      })) as Withdrawal[];
    },
  });

  // Stats
  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === "pending").length,
    approved: withdrawals.filter(w => w.status === "approved").length,
    completed: withdrawals.filter(w => w.status === "completed").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length,
    totalAmount: withdrawals.reduce((sum, w) => sum + Number(w.amount), 0),
    pendingAmount: withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0),
  };

  // Update withdrawal status mutation
  const updateWithdrawal = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: Record<string, unknown> = {
        status,
        admin_notes: notes || null,
      };

      if (status === "completed" || status === "rejected") {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("withdrawals")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_withdrawals"] });
      setSelectedWithdrawal(null);
      setAdminNotes("");
      toast.success("Withdrawal updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = 
      w.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Building2 className="w-4 h-4" />;
      case "upi":
        return <CreditCard className="w-4 h-4" />;
      case "paytm":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <IndianRupee className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      upi: "UPI",
      paytm: "Paytm",
    };
    return labels[method] || method;
  };

  const handleApprove = (withdrawal: Withdrawal) => {
    updateWithdrawal.mutate({ id: withdrawal.id, status: "approved", notes: adminNotes });
  };

  const handleComplete = (withdrawal: Withdrawal) => {
    updateWithdrawal.mutate({ id: withdrawal.id, status: "completed", notes: adminNotes });
  };

  const handleReject = (withdrawal: Withdrawal) => {
    if (!adminNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    updateWithdrawal.mutate({ id: withdrawal.id, status: "rejected", notes: adminNotes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6">Withdrawal Requests</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Requests</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-2xl font-bold text-primary">{stats.approved}</p>
          <p className="text-sm text-muted-foreground">Approved</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
          <p className="text-sm text-muted-foreground">Rejected</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-2xl font-bold">₹{stats.pendingAmount}</p>
          <p className="text-sm text-muted-foreground">Pending Amount</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Method</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Requested</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{withdrawal.user?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{withdrawal.user?.email || withdrawal.user_id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-lg">₹{withdrawal.amount}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(withdrawal.payment_method)}
                        <span>{getPaymentMethodLabel(withdrawal.payment_method)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(withdrawal.requested_at), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setAdminNotes(withdrawal.admin_notes || "");
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Detail Modal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Withdrawal Request Details</DialogTitle>
            <DialogDescription>
              Review and process this withdrawal request
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">User</p>
                <p className="font-medium">{selectedWithdrawal.user?.full_name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{selectedWithdrawal.user?.email || selectedWithdrawal.user_id}</p>
              </div>

              {/* Amount & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="text-2xl font-bold">₹{selectedWithdrawal.amount}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm capitalize ${getStatusBadge(selectedWithdrawal.status)}`}>
                    {getStatusIcon(selectedWithdrawal.status)}
                    {selectedWithdrawal.status}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Payment Details</p>
                <div className="flex items-center gap-2 mb-2">
                  {getPaymentMethodIcon(selectedWithdrawal.payment_method)}
                  <span className="font-medium">{getPaymentMethodLabel(selectedWithdrawal.payment_method)}</span>
                </div>
                {selectedWithdrawal.payment_details && (
                  <div className="text-sm space-y-1">
                    {Object.entries(selectedWithdrawal.payment_details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p>{format(new Date(selectedWithdrawal.requested_at), "MMM d, yyyy HH:mm")}</p>
                </div>
                {selectedWithdrawal.processed_at && (
                  <div>
                    <p className="text-muted-foreground">Processed</p>
                    <p>{format(new Date(selectedWithdrawal.processed_at), "MMM d, yyyy HH:mm")}</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  placeholder="Add notes about this withdrawal (required for rejection)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              {selectedWithdrawal.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(selectedWithdrawal)}
                    disabled={updateWithdrawal.isPending}
                    className="flex-1"
                  >
                    {updateWithdrawal.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedWithdrawal)}
                    disabled={updateWithdrawal.isPending}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedWithdrawal.status === "approved" && (
                <Button
                  onClick={() => handleComplete(selectedWithdrawal)}
                  disabled={updateWithdrawal.isPending}
                  className="w-full bg-success hover:bg-success/90"
                >
                  {updateWithdrawal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark as Completed
                    </>
                  )}
                </Button>
              )}

              {(selectedWithdrawal.status === "completed" || selectedWithdrawal.status === "rejected") && (
                <div className="text-center text-sm text-muted-foreground">
                  This withdrawal has been {selectedWithdrawal.status}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
