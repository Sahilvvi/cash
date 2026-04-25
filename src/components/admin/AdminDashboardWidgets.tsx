import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    MousePointerClick,
    Receipt,
    Hourglass,
    CheckCircle2,
    AlertTriangle,
    IndianRupee,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type DashboardMetrics = {
    clicks_today: number;
    conversions_today: number;
    pending_today: number;
    approved_today: number;
    confirmed_today: number;
    reversed_today: number;
    pending_amount: number;
    approved_amount: number;
    confirmed_amount: number;
    reversed_amount: number;
    errors_24h: number;
};

type PostbackError = {
    id: string;
    occurred_at: string;
    status_code: number;
    reason: string;
    message: string | null;
    query: string | null;
    session_id: string | null;
    order_id: string | null;
    network: string | null;
    ip: string | null;
};

const REASON_LABEL: Record<string, string> = {
    bad_token: "Bad/missing token",
    missing_session: "Missing session_id",
    invalid_session: "Unknown session_id",
    click_expired: "Click >90d old",
    network_mismatch: "Network mismatch",
    store_mismatch: "Store mismatch",
    rpc_error: "RPC error",
    unhandled: "Unhandled error",
};

const formatAmount = (n: number) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const AdminDashboardWidgets = () => {
    const { data: metrics } = useQuery<DashboardMetrics | null>({
        queryKey: ["admin_dashboard_metrics"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("admin_dashboard_metrics" as never)
                .select("*")
                .single();
            if (error) {
                console.error("admin_dashboard_metrics:", error);
                return null;
            }
            return data as unknown as DashboardMetrics;
        },
        refetchInterval: 30_000,
    });

    const { data: errors = [] } = useQuery<PostbackError[]>({
        queryKey: ["admin_postback_errors"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("postback_errors" as never)
                .select("*")
                .order("occurred_at", { ascending: false })
                .limit(25);
            if (error) {
                console.error("postback_errors:", error);
                return [];
            }
            return (data ?? []) as unknown as PostbackError[];
        },
        refetchInterval: 30_000,
    });

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Cashback &amp; Postback (live)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-6 shadow-card">
                    <MousePointerClick className="w-7 h-7 text-primary mb-2" />
                    <p className="text-3xl font-bold">{metrics?.clicks_today ?? 0}</p>
                    <p className="text-muted-foreground">Clicks today</p>
                </div>
                <div className="bg-card rounded-xl p-6 shadow-card">
                    <Receipt className="w-7 h-7 text-primary mb-2" />
                    <p className="text-3xl font-bold">{metrics?.conversions_today ?? 0}</p>
                    <p className="text-muted-foreground">Conversions today</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {metrics?.pending_today ?? 0} pending · {metrics?.approved_today ?? 0} approved · {metrics?.confirmed_today ?? 0} confirmed · {metrics?.reversed_today ?? 0} reversed
                    </p>
                </div>
                <div className="bg-card rounded-xl p-6 shadow-card">
                    <Hourglass className="w-7 h-7 text-warning mb-2" />
                    <p className="text-3xl font-bold">{formatAmount(metrics?.pending_amount ?? 0)}</p>
                    <p className="text-muted-foreground">Pending balance</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Cashback we owe but haven't received from networks yet.
                    </p>
                </div>
                <div className="bg-card rounded-xl p-6 shadow-card">
                    <CheckCircle2 className="w-7 h-7 text-success mb-2" />
                    <p className="text-3xl font-bold">{formatAmount(metrics?.confirmed_amount ?? 0)}</p>
                    <p className="text-muted-foreground">Confirmed balance</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Network paid out — safe to release for withdrawal.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-6 shadow-card md:col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                        <IndianRupee className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Lifetime cashback split</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pending</span>
                            <span className="font-medium">{formatAmount(metrics?.pending_amount ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved</span>
                            <span className="font-medium">{formatAmount(metrics?.approved_amount ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Confirmed</span>
                            <span className="font-medium">{formatAmount(metrics?.confirmed_amount ?? 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Reversed</span>
                            <span className="font-medium">{formatAmount(metrics?.reversed_amount ?? 0)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl shadow-card md:col-span-2 overflow-hidden">
                    <div className="px-6 pt-6 pb-3 flex items-center gap-2 border-b border-border/50">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <h3 className="font-semibold">Failed postbacks (last 24h)</h3>
                        <span className="ml-auto text-sm text-muted-foreground">
                            {metrics?.errors_24h ?? 0} total
                        </span>
                    </div>
                    {errors.length === 0 ? (
                        <p className="px-6 py-8 text-sm text-muted-foreground">
                            No failed postbacks in the last 25 records. If conversions are
                            missing, check your Offer18 postback URL and POSTBACK_SECRET.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3 font-medium">When</th>
                                        <th className="text-left p-3 font-medium">Status</th>
                                        <th className="text-left p-3 font-medium">Reason</th>
                                        <th className="text-left p-3 font-medium">Session</th>
                                        <th className="text-left p-3 font-medium">Order</th>
                                        <th className="text-left p-3 font-medium">Network</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errors.map((e) => (
                                        <tr key={e.id} className="border-t border-border/30">
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                {format(new Date(e.occurred_at), "MMM d, HH:mm")}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={
                                                        "inline-block px-2 py-0.5 rounded text-xs font-medium " +
                                                        (e.status_code >= 500
                                                            ? "bg-destructive/10 text-destructive"
                                                            : e.status_code === 401
                                                            ? "bg-warning/10 text-warning"
                                                            : "bg-muted text-muted-foreground")
                                                    }
                                                >
                                                    {e.status_code}
                                                </span>
                                            </td>
                                            <td className="p-3" title={e.message ?? ""}>
                                                {REASON_LABEL[e.reason] ?? e.reason}
                                            </td>
                                            <td className="p-3 font-mono text-xs text-muted-foreground">
                                                {e.session_id?.slice(0, 14) ?? "—"}
                                                {e.session_id && e.session_id.length > 14 ? "…" : ""}
                                            </td>
                                            <td className="p-3 font-mono text-xs">{e.order_id ?? "—"}</td>
                                            <td className="p-3">{e.network ?? "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardWidgets;
