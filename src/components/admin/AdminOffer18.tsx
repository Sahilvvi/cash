import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Network,
    Settings,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Package,
    TrendingUp,
    Globe,
    DollarSign,
    Download,
    ExternalLink
} from "lucide-react";
import { offer18Service, type Offer18Offer, type Offer18Config } from "@/services/offer18Service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AdminOffer18() {
    const [config, setConfig] = useState<Offer18Config>({
        apiKey: '',
        affiliateId: '',
        merchantId: '',
    });
    const [isConfigured, setIsConfigured] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [offers, setOffers] = useState<Offer18Offer[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        authorized: 0,
        synced: 0,
    });

    // Load configuration from environment or database
    useEffect(() => {
        loadConfiguration();
    }, []);

    const loadConfiguration = () => {
        // Try to load from environment first
        const apiKey = import.meta.env.VITE_OFFER18_API_KEY;
        const affiliateId = import.meta.env.VITE_OFFER18_AFFILIATE_ID;
        const merchantId = import.meta.env.VITE_OFFER18_MERCHANT_ID;

        if (apiKey && affiliateId && merchantId) {
            const loadedConfig = { apiKey, affiliateId, merchantId };
            setConfig(loadedConfig);
            offer18Service.initialize(loadedConfig);
            setIsConfigured(true);
        }
    };

    const handleConfigSave = () => {
        if (!config.apiKey || !config.affiliateId || !config.merchantId) {
            toast.error('Please fill in all configuration fields');
            return;
        }

        offer18Service.initialize(config);
        setIsConfigured(true);
        toast.success('Offer18 configuration saved successfully');
    };

    const handleTestConnection = async () => {
        try {
            setIsSyncing(true);
            const response = await offer18Service.fetchOffers();

            if (response.response === '200') {
                toast.success(`Connection successful! Found ${Object.keys(response.data || {}).length} offers.`);
                return true;
            } else {
                toast.error('Connection test failed');
                return false;
            }
        } catch (error) {
            console.error('Connection test error:', error);
            toast.error('Connection test failed: ' + (error as Error).message);
            return false;
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFetchOffers = async (filters?: {
        activeOnly?: boolean;
        authorizedOnly?: boolean;
        model?: string;
        country?: string;
    }) => {
        try {
            setIsSyncing(true);

            let fetchedOffers: Offer18Offer[] = [];

            if (filters?.authorizedOnly) {
                fetchedOffers = await offer18Service.fetchAuthorizedOffers();
            } else if (filters?.activeOnly) {
                fetchedOffers = await offer18Service.fetchActiveOffers();
            } else {
                const response = await offer18Service.fetchOffers();
                fetchedOffers = Object.values(response.data);
            }

            setOffers(fetchedOffers);

            // Update stats
            setStats({
                total: fetchedOffers.length,
                active: fetchedOffers.filter(o => o.status === 'active').length,
                authorized: fetchedOffers.filter(o => o.authorized === 'true').length,
                synced: 0,
            });

            toast.success(`Fetched ${fetchedOffers.length} offers from Offer18`);
        } catch (error) {
            console.error('Fetch offers error:', error);
            toast.error('Failed to fetch offers: ' + (error as Error).message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncToDatabase = async (selectedOffers?: Offer18Offer[]) => {
        try {
            setIsSyncing(true);
            const offersToSync = selectedOffers || offers;

            if (offersToSync.length === 0) {
                toast.error('No offers to sync');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            for (const offer of offersToSync) {
                try {
                    const storeData = offer18Service.convertToStore(offer);

                    // Check if store already exists
                    const { data: existingStore } = await supabase
                        .from('stores')
                        .select('id')
                        .eq('slug', storeData.slug)
                        .maybeSingle();

                    if (existingStore) {
                        // Update existing store
                        const { error } = await supabase
                            .from('stores')
                            .update({
                                ...storeData,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', existingStore.id);

                        if (error) throw error;
                    } else {
                        // Insert new store
                        const { error } = await supabase
                            .from('stores')
                            .insert({
                                ...storeData,
                                is_active: true,
                                is_trending: false,
                                is_new: true,
                                offers_count: 1,
                            });

                        if (error) throw error;
                    }

                    successCount++;
                } catch (error) {
                    console.error(`Error syncing offer ${offer.offerid}:`, error);
                    errorCount++;
                }
            }

            setStats(prev => ({ ...prev, synced: successCount }));

            if (successCount > 0) {
                toast.success(`Successfully synced ${successCount} offers to database`);
            }

            if (errorCount > 0) {
                toast.error(`Failed to sync ${errorCount} offers`);
            }
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Failed to sync offers to database');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncActiveOffers = async () => {
        await handleFetchOffers({ activeOnly: true });
        await handleSyncToDatabase();
    };

    const handleSyncAuthorizedOffers = async () => {
        await handleFetchOffers({ authorizedOnly: true });
        await handleSyncToDatabase();
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
                        Manage Offer18 API integration and sync offers
                    </p>
                </div>
                {isConfigured && (
                    <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                    </Badge>
                )}
            </div>

            {/* Stats Cards */}
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

            <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="config">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuration
                    </TabsTrigger>
                    <TabsTrigger value="sync">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Offers
                    </TabsTrigger>
                    <TabsTrigger value="offers">
                        <Package className="h-4 w-4 mr-2" />
                        Browse Offers
                    </TabsTrigger>
                </TabsList>

                {/* Configuration Tab */}
                <TabsContent value="config">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Configuration</CardTitle>
                            <CardDescription>
                                Configure your Offer18 API credentials. Get them from{" "}
                                <a
                                    href="https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    Offer18 Documentation
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    You can also set these as environment variables: VITE_OFFER18_API_KEY, VITE_OFFER18_AFFILIATE_ID, VITE_OFFER18_MERCHANT_ID
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">API Key</Label>
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        placeholder="Your Offer18 API Key"
                                        value={config.apiKey}
                                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="affiliateId">Affiliate ID (AID)</Label>
                                    <Input
                                        id="affiliateId"
                                        type="text"
                                        placeholder="Your Affiliate ID"
                                        value={config.affiliateId}
                                        onChange={(e) => setConfig({ ...config, affiliateId: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="merchantId">Merchant ID (MID)</Label>
                                    <Input
                                        id="merchantId"
                                        type="text"
                                        placeholder="Your Merchant ID"
                                        value={config.merchantId}
                                        onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleConfigSave} className="flex-1">
                                    Save Configuration
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleTestConnection}
                                    disabled={!isConfigured || isSyncing}
                                >
                                    {isSyncing ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Test Connection
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sync Tab */}
                <TabsContent value="sync">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sync Offers to Database</CardTitle>
                            <CardDescription>
                                Fetch offers from Offer18 and sync them to your database
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isConfigured && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Please configure Offer18 API credentials first
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-3">
                                <Button
                                    onClick={handleSyncActiveOffers}
                                    disabled={!isConfigured || isSyncing}
                                    className="w-full justify-start"
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
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

                {/* Offers Tab */}
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
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.name)}&background=random`;
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
                                                            <div className="flex gap-2">
                                                                <Badge variant={offer.status === 'active' ? 'default' : 'secondary'}>
                                                                    {offer.status}
                                                                </Badge>
                                                                {offer.authorized === 'true' && (
                                                                    <Badge variant="outline">Authorized</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4 mt-3 text-sm">
                                                            <div className="flex items-center gap-1">
                                                                <DollarSign className="h-4 w-4 text-green-500" />
                                                                <span className="font-medium">{offer.payout[0]?.payout} {offer.currency}</span>
                                                                <Badge variant="secondary" className="ml-1">{offer.model}</Badge>
                                                            </div>
                                                            {offer.country_allow && (
                                                                <div className="flex items-center gap-1">
                                                                    <Globe className="h-4 w-4 text-blue-500" />
                                                                    <span className="text-muted-foreground">{offer.country_allow}</span>
                                                                </div>
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
            </Tabs>
        </div>
    );
}
