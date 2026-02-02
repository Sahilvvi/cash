
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
    ExternalLink,
    IndianRupee,
    Search,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminTracking = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: clicks = [], isLoading: isLoadingClicks } = useQuery({
        queryKey: ["admin_affiliate_clicks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("affiliate_clicks")
                .select(`
          *,
          user:profiles!affiliate_clicks_user_id_fkey(full_name, email),
          store:stores(name, logo_url)
        `)
                .order("clicked_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            return data;
        },
    });

    const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
        queryKey: ["admin_cashback_transactions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("cashback_transactions")
                .select(`
          *,
          user:profiles!cashback_transactions_user_id_fkey(full_name, email),
          store:stores(name)
        `)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;
            return data;
        },
    });

    const filteredClicks = clicks.filter((click: any) =>
        click.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        click.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        click.store?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTransactions = transactions.filter((t: any) =>
        t.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.store?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold font-heading">Tracking & Conversions</h1>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search user, store..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Tabs defaultValue="transactions">
                <TabsList>
                    <TabsTrigger value="transactions">Conversions</TabsTrigger>
                    <TabsTrigger value="clicks">Click History</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                    <div className="bg-card rounded-xl shadow-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium">User</th>
                                        <th className="text-left p-4 font-medium">Store</th>
                                        <th className="text-left p-4 font-medium">Order ID</th>
                                        <th className="text-left p-4 font-medium">Amount</th>
                                        <th className="text-left p-4 font-medium">Status</th>
                                        <th className="text-left p-4 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingTransactions ? (
                                        <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions found</td></tr>
                                    ) : (
                                        filteredTransactions.map((t: any) => (
                                            <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium">{t.user?.full_name || "Unknown"}</p>
                                                        <p className="text-xs text-muted-foreground">{t.user?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">{t.store?.name || "N/A"}</td>
                                                <td className="p-4 font-mono text-sm">{t.order_id || "-"}</td>
                                                <td className="p-4 font-bold text-success">₹{t.amount}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs capitalize ${t.status === 'confirmed' ? 'bg-success/10 text-success' :
                                                            t.status === 'pending' ? 'bg-warning/10 text-warning' :
                                                                'bg-destructive/10 text-destructive'
                                                        }`}>
                                                        {t.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> :
                                                            t.status === 'pending' ? <Clock className="w-3 h-3" /> :
                                                                <XCircle className="w-3 h-3" />}
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground">
                                                    {format(new Date(t.created_at), "MMM d, HH:mm")}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="clicks" className="mt-4">
                    <div className="bg-card rounded-xl shadow-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium">User</th>
                                        <th className="text-left p-4 font-medium">Store</th>
                                        <th className="text-left p-4 font-medium">Session ID</th>
                                        <th className="text-left p-4 font-medium">Clicked At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingClicks ? (
                                        <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
                                    ) : filteredClicks.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No clicks found</td></tr>
                                    ) : (
                                        filteredClicks.map((click: any) => (
                                            <tr key={click.id} className="border-t border-border hover:bg-muted/30">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium">{click.user?.full_name || "Unknown"}</p>
                                                        <p className="text-xs text-muted-foreground">{click.user?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {click.store?.logo_url && <img src={click.store.logo_url} className="w-6 h-6 rounded object-cover" />}
                                                        <span>{click.store?.name || "Store"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs">{click.session_id || "N/A"}</td>
                                                <td className="p-4 text-sm text-muted-foreground">
                                                    {format(new Date(click.clicked_at), "MMM d, yyyy HH:mm")}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminTracking;
