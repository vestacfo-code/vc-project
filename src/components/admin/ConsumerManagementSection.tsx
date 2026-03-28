import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Users, 
  Loader2, 
  Mail, 
  Building2, 
  Calendar,
  CreditCard,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ConsumerDetailsSheet } from './ConsumerDetailsSheet';
import { CreateConsumerDialog } from './CreateConsumerDialog';
import { FeatureManager } from './FeatureManager';
import { format } from 'date-fns';

interface Consumer {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  industry: string | null;
  created_at: string;
  is_custom_solution: boolean;
  custom_logo_url: string | null;
}

interface ConsumerWithSubscription extends Consumer {
  subscription_tier?: string;
  credits_remaining?: number;
  features_enabled?: string[];
}

export function ConsumerManagementSection() {
  const { toast } = useToast();
  const [consumers, setConsumers] = useState<ConsumerWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerWithSubscription | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadConsumers();
  }, []);

  const loadConsumers = async () => {
    setLoading(true);
    try {
      // Load all profiles (consumers)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Load subscription data for each consumer
      const consumersWithData: ConsumerWithSubscription[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get enabled features
          const { data: features } = await supabase
            .from('consumer_features')
            .select('feature_key')
            .eq('user_id', profile.user_id)
            .eq('enabled', true);

          return {
            ...profile,
            subscription_tier: 'free', // Default, can be enhanced later
            credits_remaining: 0, // Default, can be enhanced later
            features_enabled: features?.map(f => f.feature_key) || [],
          };
        })
      );

      setConsumers(consumersWithData);
    } catch (error: any) {
      console.error('Error loading consumers:', error);
      toast({
        title: 'Error loading consumers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConsumers = consumers.filter(consumer => {
    const matchesSearch = 
      !searchQuery ||
      consumer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consumer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consumer.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'custom') {
      return matchesSearch && consumer.is_custom_solution;
    }
    
    return matchesSearch;
  });

  const customSolutionCount = consumers.filter(c => c.is_custom_solution).length;

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'founder': return 'default';
      case 'pro': return 'secondary';
      case 'starter': return 'outline';
      default: return 'outline';
    }
  };

  const handleConsumerClick = (consumer: ConsumerWithSubscription) => {
    setSelectedConsumer(consumer);
    setShowDetailsSheet(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    loadConsumers();
    toast({
      title: 'Consumer invite created',
      description: 'The invite link has been generated successfully.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Consumer Management</h2>
          <p className="text-muted-foreground">
            View and manage all Vesta consumer accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadConsumers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Consumer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{consumers.length}</p>
                <p className="text-sm text-muted-foreground">Total Consumers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customSolutionCount}</p>
                <p className="text-sm text-muted-foreground">Custom Solutions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consumers.filter(c => c.subscription_tier !== 'free').length}
                </p>
                <p className="text-sm text-muted-foreground">Paid Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consumers.filter(c => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(c.created_at) > weekAgo;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">New This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Consumers ({consumers.length})</TabsTrigger>
            <TabsTrigger value="custom">Custom Solutions ({customSolutionCount})</TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-80"
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          <ConsumerList 
            consumers={filteredConsumers} 
            onConsumerClick={handleConsumerClick}
            getTierBadgeVariant={getTierBadgeVariant}
          />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <ConsumerList 
            consumers={filteredConsumers} 
            onConsumerClick={handleConsumerClick}
            getTierBadgeVariant={getTierBadgeVariant}
            showFeatures
          />
        </TabsContent>
      </Tabs>

      {/* Details Sheet */}
      <ConsumerDetailsSheet
        consumer={selectedConsumer}
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        onUpdate={loadConsumers}
      />

      {/* Create Dialog */}
      <CreateConsumerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

interface ConsumerListProps {
  consumers: ConsumerWithSubscription[];
  onConsumerClick: (consumer: ConsumerWithSubscription) => void;
  getTierBadgeVariant: (tier: string) => "default" | "secondary" | "outline" | "destructive";
  showFeatures?: boolean;
}

function ConsumerList({ consumers, onConsumerClick, getTierBadgeVariant, showFeatures }: ConsumerListProps) {
  if (consumers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No consumers found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {consumers.map((consumer) => (
        <Card 
          key={consumer.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onConsumerClick(consumer)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {consumer.full_name?.charAt(0)?.toUpperCase() || consumer.email?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      {consumer.full_name || 'No name'}
                    </p>
                    {consumer.is_custom_solution && (
                      <Badge variant="default" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {consumer.email || 'No email'}
                    </span>
                    {consumer.company_name && (
                      <span className="flex items-center gap-1 truncate hidden sm:flex">
                        <Building2 className="h-3 w-3" />
                        {consumer.company_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right side badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {showFeatures && consumer.features_enabled && consumer.features_enabled.length > 0 && (
                  <div className="hidden md:flex gap-1">
                    {consumer.features_enabled.slice(0, 3).map(feature => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {consumer.features_enabled.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{consumer.features_enabled.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <Badge variant={getTierBadgeVariant(consumer.subscription_tier || 'free')}>
                  {consumer.subscription_tier || 'free'}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {format(new Date(consumer.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
