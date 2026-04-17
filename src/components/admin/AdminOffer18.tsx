import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Network,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Package,
    TrendingUp,
    Download,
    ExternalLink,
    Activity,
    ShieldCheck,
} from "lucide-react";
import {
    offer18Service,
    type Offer18Offer,
    type Offer18Status,
} from "@/services/offer18Service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostbackRow {
    id: string;
    order_id: string | null;
    amount: number | null;
    status: string | null;
    description: string | null;
    created_at: string | null;
    store_id: string | null;
}

export function AdminOffer18() {
    const [status, setStatus] = useState<Offer18Status | null>(null);
    const [statusChecking, setStatusChecking] = useState(true);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [offers, setOffers] = useState<Offer18Offer[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        authorized: 0,
        synced: 0,
    });
    const [postbacks, setPostbacks] = useState<PostbackRow[]>([]);
    const [postbacksLoading, setPostbacksLoading] = useState(false);

    const isConfigured = !!status?.configured;

    useEffect(() => {
        refreshStatus();
        refreshPostbacks();
    }, []);

    const refreshStatus = async () => {
        setStatusChecking(true);
        setStatusError(null);
        try {
            const s = await offer18Service.getStatus();
            setStatus(s);
        } catch (err) {
            setStatus({ configured: false, affiliate_id: null, merchant_id: null });
            setStatusError((err as Error).message);
        } finally {
            setStatusChecking(false);
        }
    };

    const refreshPostbacks = async () => {
        setPostbacksLoading(true);
        try {
            // Conversions produced by the `track-conversion` edge function.
            // We filter down to the most recent ones; the tracking table
            // currently doesn't store the network name, so we also surface
            // rows whose description references an order (the shape the
            // edge function writes).
            const { data, error } = await supabase
                .from("cashback_transactions")
                .select("id, order_id, amount, status, description, created_at, store_id")
                .order("created_at", { ascending: false })
                .limit(25);

            if (error) throw error;
            setPostbacks((data ?? []) as PostbackRow[]);
        } catch (err) {
            console.error("Failed to load recent postbacks:", err);
            toast.error("Failed to load recent postbacks: " + (err as Error).message);
        } finally {
            setPostbacksLoading(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setIsSyncing(true);
            const response = await offer18Service.fetchOffers();

            if (response.response === "200") {
                const fetched = Object.values(response.data || {});
                setOffers(fetched);
                setStats({
                    total: fetched.length,
                    active: fetched.filter((o) => o.status === "active").length,
                    authorized: fetched.filter((o) => o.authorized === "true").length,
                    synced: 0,
                });
                toast.success(
                    `Connection successful! Loaded ${fetched.length} offers.`,
                );
            } else {
                toast.error("Connection test failed");
            }
        } catch (err) {
            console.error("Connection test error:", err);
            toast.error("Connection test failed: " + (err as Error).message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFetchOffers = async (filters?: {
        activeOnly?: boolean;
        authorizedOnly?: boolean;
    }) => {
        try {
            setIsSyncing(true);
            let fetched: Offer18Offer[] = [];

            if (filters?.authorizedOnly) {
                fetched = await offer18Service.fetchAuthorizedOffers();
            } else if (filters?.activeOnly) {
                fetched = await offer18Service.fetchActiveOffers();
            } else {
                const response = await offer18Service.fetchOffers();
                fetched = Object.values(response.data || {});
            }

            setOffers(fetched);
            setStats({
                total: fetched.length,
                active: fetched.filter((o) => o.status === "active").length,
                authorized: fetched.filter((o) => o.authorized === "true").length,
                synced: 0,
            });

            if (fetched.length > 0) {
                toast.success(`Fetched ${fetched.length} offers from Offer18`);
            } else {
                toast.info("No offers found matching criteria");
            }

            return fetched;
        } catch (err) {
            console.error("Fetch offers error:", err);
            toast.error("Failed to fetch offers: " + (err as Error).message);
            return [];
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncToDatabase = async (selected: Offer18Offer[]) => {
        try {
            setIsSyncing(true);
            if (!selected?.length) {
                toast.error("No offers to sync");
                return;
            }

            const mappedRows = selected.map((offer) => ({
                ...offer18Service.convertToStore(offer),
                updated_at: new Date().toISOString(),
                is_active: true,
                offer18_offer_id: offer.offerid,
                network_type: "offer18",
                offers_count: 1,
            }));

            // Dedupe by slug: Offer18's feed can have two different offers
            // that collapse to the same slug (e.g. "Angel One App" and
            // "Angel One_App" both → `angel-one-app`). Postgres rejects
            // an upsert batch that targets the same conflict row twice
            // ("ON CONFLICT DO UPDATE command cannot affect row a second
            // time"), so we keep the last occurrence of each slug.
            const bySlug = new Map<string, (typeof mappedRows)[number]>();
            for (const row of mappedRows) {
                if (row.slug) bySlug.set(row.slug, row);
            }
            const rows = Array.from(bySlug.values());

            if (rows.length < mappedRows.length) {
                const skipped = mappedRows.length - rows.length;
                toast.info(`Deduplicated ${skipped} offers that shared a slug`);
            }

            const BATCH = 50;
            let success = 0;
            let failures = 0;

            for (let i = 0; i < rows.length; i += BATCH) {
                const batch = rows.slice(i, i + BATCH);
                const { error } = await supabase
                    .from("stores")
                    .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });
                if (error) {
                    console.error("Batch sync error:", error);
                    failures += batch.length;
                    toast.error(`Batch failed: ${error.message}`);
                } else {
                    success += batch.length;
                }
            }

            setStats((prev) => ({ ...prev, synced: success }));
            if (success > 0) {
                toast.success(`Successfully synced ${success} offers to database`);
            }
            if (failures > 0) {
                toast.error(`Failed to sync ${failures} offers`);
            }
        } catch (err) {
            console.error("Sync error:", err);
            toast.error("Failed to sync offers to database");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncActiveOffers = async () => {
        const fetched = await handleFetchOffers({ activeOnly: true });
        if (fetched?.length) await handleSyncToDatabase(fetched);
    };

    const handleSyncAuthorizedOffers = async () => {
        const fetched = await handleFetchOffers({ authorizedOnly: true });
        if (fetched?.length) await handleSyncToDatabase(fetched);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Network className="h-6 w-6 text-primary" />
                        Offer18 Integration
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Calls are proxied through a Supabase Edge Function; the Offer18
                        API key lives only on the server.
                    </p>
                </div>
                {statusChecking ? (
                    <Badge variant="outline" className="gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Checking…
                    </Badge>
                ) : isConfigured ? (
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                    </Badge>
                ) : (
                    <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Not Configured
                    </Badge>
                )}
            </div>

            {/* Config status card (no secret material here) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Server Configuration
                    </CardTitle>
                    <CardDescription>
                        Offer18 credentials are stored as Supabase function secrets, not in
                        the frontend bundle. Set them with:{" "}
                        <code className="text-xs">
                            supabase secrets set OFFER18_API_KEY=… OFFER18_AFFILIATE_ID=…
                            OFFER18_MERCHANT_ID=…
                        </code>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">API Key</div>
                            <div className="font-mono text-sm">
                                {isConfigured ? "••••••••••••" : "not set"}
                            </div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">Affiliate ID</div>
                            <div className="font-mono text-sm">
                                {status?.affiliate_id ?? "not set"}
                            </div>
                        </div>
                        <div className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">Merchant ID</div>
                            <div className="font-mono text-sm">
                                {status?.merchant_id ?? "not set"}
                            </div>
                        </div>
                    </div>

                    {statusError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{statusError}</AlertDescription>
                        </Alert>
                    )}

                    {!isConfigured && !statusChecking && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                The <code>offer18-proxy</code> function is missing one or more
                                secrets. Once you've run{" "}
                                <code>supabase secrets set …</code> and redeployed, click
                                "Refresh Status".
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={refreshStatus} disabled={statusChecking}>
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${statusChecking ? "animate-spin" : ""}`}
                            />
                            Refresh Status
                        </Button>
                        <Button
                            onClick={handleTestConnection}
                            disabled={!isConfigured || isSyncing}
                        >
                            {isSyncing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Testing…
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Test Connection
                                </>
                            )}
                        </Button>
                        <a
                            href="https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                        >
                            <Button variant="ghost">
                                Docs
                                <ExternalLink className="h-3 w-3 ml-2" />
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            {isConfigured && stats.total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                Total Offers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Active Offers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                Authorized
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.authorized}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Download className="h-4 w-4 text-purple-500" />
                                Synced to DB
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.synced}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="sync" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sync">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Offers
                    </TabsTrigger>
                    <TabsTrigger value="offers">
                        <Package className="h-4 w-4 mr-2" />
                        Browse Offers
                    </TabsTrigger>
                    <TabsTrigger value="postbacks">
                        <Activity className="h-4 w-4 mr-2" />
                        Recent Postbacks
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sync">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sync Offers to Database</CardTitle>
                            <CardDescription>
                                Fetch offers from Offer18 (via the proxy) and upsert them into{" "}
                                <code>stores</code>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isConfigured && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Configure Offer18 secrets on the server before syncing.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-3">
                                <Button
                                    onClick={handleSyncActiveOffers}
                                    disabled={!isConfigured || isSyncing}
                                    className="w-full justify-start"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                                    />
                                    Sync All Active Offers
                                </Button>
                                <Button
                                    onClick={handleSyncAuthorizedOffers}
                                    disabled={!isConfigured || isSyncing}
                                    variant="secondary"
                                    className="w-full justify-start"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Sync Only Authorized Offers
                                </Button>
                                <Button
                                    onClick={() => handleFetchOffers()}
                                    disabled={!isConfigured || isSyncing}
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Package className="h-4 w-4 mr-2" />
                                    Fetch All Offers (Preview)
                                </Button>
                            </div>

                            {offers.length > 0 && (
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        {offers.length} offers fetched. Ready to sync to database.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="offers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Browse Offers ({offers.length})</CardTitle>
                            <CardDescription>
                                Preview offers from Offer18 before syncing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {offers.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No offers loaded. Use the Sync tab to fetch offers.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <ScrollArea className="h-[600px] pr-4">
                                    <div className="space-y-3">
                                        {offers.map((offer) => (
                                            <Card key={offer.offerid} className="p-4">
                                                <div className="flex gap-4">
                                                    <img
                                                        src={offer.logo}
                                                        alt={offer.name}
                                                        className="w-16 h-16 rounded object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                offer.name,
                                                            )}&background=random`;
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-semibold">{offer.name}</h4>
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {offer.offer_terms || offer.offer_kpi}
                                                                </p>
                                                            </div>
                                                            <Badge variant={offer.status === "active" ? "default" : "secondary"}>
                                                                {offer.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                            <span>ID: {offer.offerid}</span>
                                                            <span>Model: {offer.model}</span>
                                                            <span>
                                                                Payout:{" "}
                                                                {offer.payout?.[0]?.payout ?? "n/a"}{" "}
                                                                {offer.currency}
                                                            </span>
                                                            {offer.authorized === "true" && (
                                                                <Badge variant="outline" className="h-5">
                                                                    Authorized
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="postbacks">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recent Postbacks</CardTitle>
                                    <CardDescription>
                                        The 25 most recent rows inserted by the{" "}
                                        <code>track-conversion</code> edge function. Point your
                                        Offer18 postback to{" "}
                                        <code>
                                            {
                                                (import.meta.env.VITE_SUPABASE_URL as string) ||
                                                "https://&lt;supabase&gt;"
                                            }
                                            /functions/v1/track-conversion
                                        </code>
                                        .
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refreshPostbacks}
                                    disabled={postbacksLoading}
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 mr-2 ${postbacksLoading ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {postbacksLoading ? (
                                <p className="text-sm text-muted-foreground">Loading…</p>
                            ) : postbacks.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No conversions recorded yet. Fire a test postback at{" "}
                                        <code>/functions/v1/track-conversion</code> to see it
                                        here.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b">
                                                <th className="py-2 pr-4">When</th>
                                                <th className="py-2 pr-4">Order</th>
                                                <th className="py-2 pr-4">Amount</th>
                                                <th className="py-2 pr-4">Status</th>
                                                <th className="py-2 pr-4">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {postbacks.map((row) => (
                                                <tr key={row.id} className="border-b last:border-0">
                                                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                                                        {row.created_at
                                                            ? new Date(row.created_at).toLocaleString()
                                                            : "—"}
                                                    </td>
                                                    <td className="py-2 pr-4 font-mono text-xs">
                                                        {row.order_id ?? "—"}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        {row.amount !== null ? `₹${row.amount}` : "—"}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <Badge variant="outline">
                                                            {row.status ?? "pending"}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 pr-4 text-muted-foreground">
                                                        {row.description ?? "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
