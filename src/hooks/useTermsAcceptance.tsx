import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTermsAcceptance = () => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { user } = useAuth();

  const checkTermsAcceptance = async () => {
    if (!user) {
      setHasAcceptedTerms(false);
      setIsLoading(false);
      return;
    }

    try {
      // Check if user has already accepted terms to avoid unnecessary re-checking
      if (hasAcceptedTerms) {
        setIsLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('terms_accepted_at, terms_version')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking terms acceptance:', error);
        setIsLoading(false);
        return;
      }

      const hasAccepted = profile?.terms_accepted_at && profile?.terms_version === '1.0';
      setHasAcceptedTerms(!!hasAccepted);
    } catch (error) {
      console.error('Error in checkTermsAcceptance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkTermsAcceptance();
    } else {
      setHasAcceptedTerms(false);
      setIsLoading(false);
    }
  }, [user]);

  const requireTermsAcceptance = () => {
    if (!hasAcceptedTerms && user) {
      setShowTermsModal(true);
      return false;
    }
    return true;
  };

  const handleTermsAccepted = () => {
    setHasAcceptedTerms(true);
    setShowTermsModal(false);
  };

  const handleTermsDeclined = () => {
    setShowTermsModal(false);
  };

  const showTermsForReview = () => {
    setShowTermsModal(true);
  };

  return {
    hasAcceptedTerms,
    isLoading,
    showTermsModal,
    requireTermsAcceptance,
    handleTermsAccepted,
    handleTermsDeclined,
    refreshTermsStatus: checkTermsAcceptance,
    showTermsForReview
  };
};