import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
}

const TermsOfServiceModal = ({ isOpen, onAccept, onDecline }: TermsOfServiceModalProps) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAccept = async () => {
    if (!hasAccepted) return;

    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, try to update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: new Date().toISOString(),
          terms_version: '1.0'
        })
        .eq('user_id', user.id);

      // If update fails (profile doesn't exist), create new profile
      if (updateError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            terms_accepted_at: new Date().toISOString(),
            terms_version: '1.0'
          } as any);

        if (insertError && insertError.code !== '23505') {
          // Ignore duplicate key errors (23505) as they mean profile already exists
          throw insertError;
        }
      }

      // Log the acceptance for audit trail
      const { error: logError } = await supabase
        .from('terms_acceptance_log')
        .insert({
          user_id: user.id,
          terms_version: '1.0',
          user_agent: navigator.userAgent
        });

      if (logError && logError.code !== '23505') {
        // Ignore duplicate key errors for log as well
        console.warn('Log insertion warning:', logError);
      }

      onAccept();
      
      toast({
        title: "Terms accepted",
        description: "You can now access all financial features.",
      });
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: "Failed to accept terms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onDecline?.()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Terms of Service</DialogTitle>
          <DialogDescription>
            Please read and accept our Terms of Service before using Finlo's financial features.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96 w-full border rounded-md p-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. AI Financial Analysis Disclaimer</h3>
              <p>
                Finlo provides AI-powered financial analysis and insights for informational purposes only. 
                These analyses, predictions, and recommendations are not professional financial advice and 
                should not be considered as such.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Accuracy Limitations</h3>
              <p>
                AI predictions and analyses may contain inaccuracies or errors. Results are based on the 
                data provided and AI algorithms, which may not capture all financial nuances or market 
                conditions. You acknowledge that:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>AI-generated insights may be incomplete or incorrect</li>
                <li>Financial predictions are estimates and not guarantees</li>
                <li>Market conditions and business circumstances can change rapidly</li>
                <li>Historical data does not guarantee future performance</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Professional Consultation Recommended</h3>
              <p className="mb-2">
                Finlo’s analysis is designed to give you clear, data-driven insights into your business performance. While our reports can guide your decision-making, we recommend consulting with a qualified financial advisor, accountant, or other professional for major financial decisions, such as investments, loans, business expansion, or significant cost adjustments.
              </p>
              <p>
                Think of Finlo as your always-on financial analyst — providing you with the numbers, trends, and forecasts — so that any further expert advice you seek can be faster, more informed, and more cost-effective.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. User Responsibility</h3>
              <p>
                You are solely responsible for all financial decisions made using or based on information 
                from Finlo. By using our service, you acknowledge that you understand the limitations of 
                AI analysis and accept full responsibility for your business decisions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Data Privacy and Security</h3>
              <p>
                Your financial data is processed securely and used solely to provide analysis services. 
                We implement industry-standard security measures but cannot guarantee absolute security. 
                You are responsible for the accuracy of data you provide.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Limitation of Liability</h3>
              <p>
                Finlo and its affiliates shall not be liable for any direct, indirect, incidental, 
                special, or consequential damages resulting from the use of our AI analysis, including 
                but not limited to financial losses, business interruption, or missed opportunities.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Service Availability</h3>
              <p>
                We strive to provide continuous service but cannot guarantee uninterrupted access. 
                AI analysis features may be updated, modified, or temporarily unavailable without notice.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">8. Changes to Terms</h3>
              <p>
                These terms may be updated periodically. Continued use of Finlo's financial features 
                constitutes acceptance of any changes.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="accept-terms" 
              checked={hasAccepted}
              onCheckedChange={(checked) => setHasAccepted(checked === true)}
            />
            <label 
              htmlFor="accept-terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and agree to the Terms of Service
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            {onDecline && (
              <Button variant="outline" onClick={onDecline}>
                Decline
              </Button>
            )}
            <Button 
              onClick={handleAccept} 
              disabled={!hasAccepted || isSubmitting}
              className="min-w-24"
            >
              {isSubmitting ? "Accepting..." : "Accept & Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceModal;