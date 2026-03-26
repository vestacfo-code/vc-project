import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ConsumerFeature {
  id: string;
  feature_key: string;
  enabled: boolean;
  config: Json;
  enabled_at: string | null;
}

export const AVAILABLE_FEATURES = [
  { key: 'crm', name: 'Customer CRM', description: 'Customer relationship management tools', icon: 'Users' },
  { key: 'inventory', name: 'Inventory', description: 'Inventory tracking and management', icon: 'Package' },
  { key: 'invoicing', name: 'Invoicing', description: 'Invoice generation and tracking', icon: 'FileText' },
  { key: 'payroll', name: 'Payroll', description: 'Payroll management features', icon: 'DollarSign' },
  { key: 'reporting_advanced', name: 'Advanced Reporting', description: 'Enhanced analytics and reports', icon: 'BarChart3' },
  { key: 'competitive_pricing', name: 'Competitive Pricing', description: 'Multi-supplier price comparison & market analysis', icon: 'TrendingUp' },
  { key: 'hide_dashboard', name: 'Hide Dashboard', description: 'Hides the main dashboard from the sidebar', icon: 'EyeOff' },
] as const;

export type FeatureKey = typeof AVAILABLE_FEATURES[number]['key'];

// Simple in-memory cache to prevent redundant fetches
const cache: {
  [userId: string]: {
    features: ConsumerFeature[];
    isCustomSolution: boolean;
    customLogo: string | null;
    timestamp: number;
  };
} = {};

const CACHE_TTL = 30000; // 30 seconds

export function useConsumerFeatures(userId?: string) {
  const [features, setFeatures] = useState<ConsumerFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomSolution, setIsCustomSolution] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const loadUserFeatures = useCallback(async (targetUserId: string, forceRefresh = false) => {
    // Check cache first (unless force refresh)
    const cached = cache[targetUserId];
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFeatures(cached.features);
      setIsCustomSolution(cached.isCustomSolution);
      setCustomLogo(cached.customLogo);
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Fetch features and profile in parallel for speed
      const [featuresResult, profileResult] = await Promise.all([
        supabase
          .from('consumer_features')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('enabled', true),
        supabase
          .from('profiles')
          .select('is_custom_solution, custom_logo_url')
          .eq('user_id', targetUserId)
          .maybeSingle()
      ]);

      const featuresData = featuresResult.data || [];
      const profileData = profileResult.data;

      // Update state
      setFeatures(featuresData);
      setIsCustomSolution(profileData?.is_custom_solution || false);
      setCustomLogo(profileData?.custom_logo_url || null);

      // Update cache
      cache[targetUserId] = {
        features: featuresData,
        isCustomSolution: profileData?.is_custom_solution || false,
        customLogo: profileData?.custom_logo_url || null,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error loading user features:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const loadCurrentUserFeatures = useCallback(async (forceRefresh = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      await loadUserFeatures(user.id, forceRefresh);
    } catch (error) {
      console.error('Error loading current user features:', error);
      setLoading(false);
    }
  }, [loadUserFeatures]);

  useEffect(() => {
    if (!userId) {
      loadCurrentUserFeatures();
    } else {
      loadUserFeatures(userId);
    }
  }, [userId, loadCurrentUserFeatures, loadUserFeatures]);

  const hasFeature = useCallback((featureKey: FeatureKey): boolean => {
    return features.some(f => f.feature_key === featureKey && f.enabled);
  }, [features]);

  const getEnabledFeatures = useCallback((): FeatureKey[] => {
    return features
      .filter(f => f.enabled)
      .map(f => f.feature_key as FeatureKey);
  }, [features]);

  const refresh = useCallback(() => {
    if (userId) {
      loadUserFeatures(userId, true);
    } else {
      loadCurrentUserFeatures(true);
    }
  }, [userId, loadUserFeatures, loadCurrentUserFeatures]);

  return {
    features,
    loading,
    isCustomSolution,
    customLogo,
    hasFeature,
    getEnabledFeatures,
    refresh,
  };
}
