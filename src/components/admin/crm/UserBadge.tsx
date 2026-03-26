import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface UserBadgeProps {
  userId: string;
}

export const UserBadge = ({ userId }: UserBadgeProps) => {
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', userId)
        .single();

      if (data) {
        setUserInfo({
          name: data.full_name || data.email || 'Unknown',
          email: data.email || 'unknown'
        });
      }
    };

    fetchUser();
  }, [userId]);

  if (!userInfo) {
    return <Badge variant="outline">Loading...</Badge>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 cursor-help">
            <User className="h-3 w-3" />
            {userInfo.name}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{userInfo.email}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};