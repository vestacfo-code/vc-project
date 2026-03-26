import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralCodesModalProps {
  codes: string[];
  open: boolean;
  onClose: () => void;
}

export const ReferralCodesModal = ({ codes, open, onClose }: ReferralCodesModalProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success('Referral code copied!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShareAll = async () => {
    const message = `Join Finlo with my referral codes!\n\n${codes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nEach code gives you 14 days of full CFO tier access!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch (err) {
        await navigator.clipboard.writeText(message);
        toast.success('All codes copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(message);
      toast.success('All codes copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Your Referral Codes</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share these codes with 4 SMB owners. Each code gives 14 days of full CFO tier access.
            <span className="block mt-2 text-warning font-medium">
              ⚠️ Save these now! You won't be able to see them again.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {codes.map((code, index) => (
            <Card key={code} className="p-3 bg-muted/50 border-border">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Code {index + 1}</span>
                  <span className="text-lg font-mono font-bold text-foreground">{code}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(code, index)}
                  className="h-8 w-8 p-0"
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShareAll}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share All
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            I've Saved Them
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
