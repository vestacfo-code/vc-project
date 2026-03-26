import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bell, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  Zap, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle,
  Mail,
  MailCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getRedirectUrl } from '@/lib/constants';
import AIInsightsChatDialog from './AIInsightsChatDialog';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  email_sent: boolean;
  data?: any;
  created_at: string;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [emailLoading, setEmailLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification change:', payload);
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const sendNotificationEmail = async (notification: Notification) => {
    if (!user) return;

    setEmailLoading(prev => new Set(prev).add(notification.id));
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          userEmail: user.email,
          userName: profile?.full_name || user.email?.split('@')[0] || 'User',
          notificationTitle: notification.title,
          notificationMessage: notification.message,
          notificationType: notification.type,
          dashboardUrl: getRedirectUrl('/dashboard')
        }
      });

      if (error) throw error;

      // Check if the response indicates success
      if (data && !data.success) {
        if (data.errorType === 'smtp_configuration_required') {
          toast({
            title: "SMTP Configuration Required",
            description: "Email sending requires SMTP configuration in Supabase dashboard. Contact support for assistance.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.error || 'Failed to send email');
      }

      // Update notification to mark email as sent
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notification.id);

      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, email_sent: true } : n
      ));

      toast({
        title: "Email Sent",
        description: "Notification email sent successfully",
      });
    } catch (error: any) {
      console.error('Error sending notification email:', error);
      
      let errorMessage = "Failed to send notification email";
      
      if (error.message?.includes('SMTP') || error.message?.includes('smtp_configuration')) {
        errorMessage = "Email sending requires SMTP configuration in Supabase. Please contact support.";
      } else if (error.message?.includes('configuration')) {
        errorMessage = "Email service configuration issue. Please contact support.";
      }
      
      toast({
        title: "Email Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setEmailLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const openDetailDialog = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailDialog(true);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const openChatWithContext = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowChatDialog(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
      case 'warning':
      case 'strategic_alert':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'financial_report':
      case 'weekly_report':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'credit_depleted':
      case 'credit_low':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'credit_warning':
        return <Zap className="w-4 h-4 text-warning" />;
      case 'daily_limit_reached':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const truncateMessage = (message: string, maxLength: number = 120) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1 min-w-5 h-5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={loading}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </SheetTitle>
            <SheetDescription>
              Stay updated with your financial insights and alerts
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)] mt-6">
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground">
                    You'll see alerts and reports here
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const isExpanded = expandedNotifications.has(notification.id);
                  const shouldTruncate = notification.message.length > 120;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        notification.is_read 
                          ? 'bg-muted/30 border-muted' 
                          : 'bg-card border-primary/20 shadow-sm'
                      }`}
                      onClick={() => openDetailDialog(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {isExpanded || !shouldTruncate 
                                ? notification.message 
                                : truncateMessage(notification.message)
                              }
                            </p>
                            {shouldTruncate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 p-0 text-xs text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(notification.id);
                                }}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show more
                                  </>
                                )}
                              </Button>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                              <div className="flex items-center space-x-1">
                                {notification.email_sent && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    <MailCheck className="w-3 h-3 mr-1" />
                                    Emailed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Notification Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              <DialogTitle className="text-xl">
                {selectedNotification?.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {selectedNotification && new Date(selectedNotification.created_at).toLocaleString()}
                </span>
                <div className="flex items-center space-x-2">
                  {selectedNotification?.email_sent && (
                    <Badge variant="secondary" className="text-xs">
                      <MailCheck className="w-3 h-3 mr-1" />
                      Emailed
                    </Badge>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedNotification?.message}
              </p>
            </div>
            
            <div className="flex items-center space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => selectedNotification && openChatWithContext(selectedNotification)}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask AI about this
              </Button>
              
              {selectedNotification && !selectedNotification.email_sent && (
                <Button
                  variant="outline"
                  onClick={() => selectedNotification && sendNotificationEmail(selectedNotification)}
                  disabled={emailLoading.has(selectedNotification.id)}
                  className="flex-1"
                >
                  {emailLoading.has(selectedNotification.id) ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Email me this
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chat Dialog */}
      {selectedNotification && (
        <AIInsightsChatDialog
          isOpen={showChatDialog}
          onClose={() => {
            setShowChatDialog(false);
            setSelectedNotification(null);
          }}
          insights={[]}
          financialData={{}}
          initialMessage={`I received this notification: "${selectedNotification.title}". Can you explain what this means and what actions I should take? The details are: ${selectedNotification.message}`}
        />
      )}
    </>
  );
};

export default NotificationCenter;