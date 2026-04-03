import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Building2, Sparkles, ChevronDown, Mic, Plus, Link, Square, Copy, Check, ThumbsUp, ThumbsDown, CornerDownRight, Download, MoreHorizontal, Globe, ExternalLink } from 'lucide-react';
import { useQuickBooksIntegration } from '@/hooks/useQuickBooksIntegration';
import { useQuickBooksChat } from '@/hooks/useQuickBooksChat';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMath } from '@/utils/mathPreprocessor';
import TypingAnimation from '@/components/TypingAnimation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TypewriterText } from '@/components/TypewriterText';
import { ThinkingIndicator } from '@/components/ThinkingIndicator';
import { ModelSelector, getModelById } from '@/components/chat/ModelSelector';
import { AgentProgressIndicator } from '@/components/chat/AgentProgressIndicator';
import { DeepResearchProgress } from '@/components/chat/DeepResearchProgress';
import SettingsModal from '@/components/SettingsModal';
import { FileUploadButton } from '@/components/chat/FileUploadButton';
import { VoiceInputButton } from '@/components/chat/VoiceInputButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client-wrapper';
import { useDashboardReference } from '@/contexts/DashboardReferenceContext';
import { MentionDropdown } from '@/components/chat/MentionDropdown';
import { ReferenceTag } from '@/components/chat/ReferenceTag';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { VestaLogo } from '@/components/VestaLogo';
import { useConsumerFeatures } from '@/hooks/useConsumerFeatures';
import { useAgentChat } from '@/hooks/useAgentChat';

interface IntegrationChatProps {
  conversationId?: string;
  /** `hotel` = inside HotelLayout; Vesta CFO chrome, matches dashboard shell. */
  variant?: 'default' | 'hotel';
}

/* Strip inline citation brackets like [1](url), 【6†source】, [^1], etc. from AI text */
const stripInlineCitations = (text: string): string => {
  return text
    // Remove [text](url) markdown links that are citations (numbered)
    .replace(/\[\d+\]\([^)]+\)/g, '')
    // Remove 【...†...】 style citations
    .replace(/【[^】]*†[^】]*】/g, '')
    // Remove [^1] footnote-style refs
    .replace(/\[\^\d+\]/g, '')
    // Remove standalone [1], [2] etc. that are just reference markers
    .replace(/\[(\d+)\]/g, '')
    // Clean up any resulting double spaces
    .replace(/  +/g, ' ')
    .trim();
};

/* Sources collapsible for AI messages — compact pill row that expands to card grid */
const SourcesSection = ({ sources, dark }: { sources: { url: string; title: string }[]; dark: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch { return null; }
  };

  // Show first 4 as preview pills, rest hidden until expanded
  const previewCount = 4;
  const previewSources = sources.slice(0, previewCount);
  const remaining = sources.length - previewCount;

  return (
    <div className="mt-3">
      {/* Compact pill row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {previewSources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-xs transition-colors ${dark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700'}`}
            title={source.title}
          >
            <img src={getFavicon(source.url) || ''} alt="" className="w-3.5 h-3.5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="truncate max-w-[120px]">{getDomain(source.url)}</span>
          </a>
        ))}
        {(remaining > 0 || sources.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${dark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700'}`}
          >
            {expanded ? 'Hide' : remaining > 0 ? `+${remaining} more` : 'View all'}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Expanded grid */}
      {expanded && (
        <div className={`mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5`}>
          {sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start gap-2.5 p-2.5 rounded-lg text-sm transition-colors group ${dark ? 'bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50' : 'bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80'}`}
            >
              <img src={getFavicon(source.url) || ''} alt="" className="w-4 h-4 rounded mt-0.5 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs leading-snug line-clamp-2 ${dark ? 'text-zinc-300 group-hover:text-zinc-100' : 'text-zinc-700 group-hover:text-zinc-900'}`}>{source.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[10px] ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{getDomain(source.url)}</span>
                  <ExternalLink className={`w-2.5 h-2.5 ${dark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

/* Action bar with copy/thumbs below AI responses */
const MessageActionBar = ({ content, dark, sources }: { content: string; dark: boolean; sources?: { url: string; title: string }[] }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };
  
  const handleDownload = () => {
    try {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'response.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download', e);
    }
  };

  return (
    <>
      <div className={`flex items-center justify-between mt-3 ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className={`p-1.5 rounded-md transition-colors ${dark ? 'hover:text-zinc-300 hover:bg-white/5' : 'hover:text-zinc-600 hover:bg-zinc-100'}`} title="Copy">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDownload} className={`p-1.5 rounded-md transition-colors ${dark ? 'hover:text-zinc-300 hover:bg-white/5' : 'hover:text-zinc-600 hover:bg-zinc-100'}`} title="Download">
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setLiked(liked === 'up' ? null : 'up')} className={`p-1.5 rounded-md transition-colors ${liked === 'up' ? (dark ? 'text-zinc-200' : 'text-zinc-700') : ''} ${dark ? 'hover:text-zinc-300 hover:bg-white/5' : 'hover:text-zinc-600 hover:bg-zinc-100'}`} title="Helpful">
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setLiked(liked === 'down' ? null : 'down')} className={`p-1.5 rounded-md transition-colors ${liked === 'down' ? (dark ? 'text-zinc-200' : 'text-zinc-700') : ''} ${dark ? 'hover:text-zinc-300 hover:bg-white/5' : 'hover:text-zinc-600 hover:bg-zinc-100'}`} title="Not helpful">
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button className={`p-1.5 rounded-md transition-colors ${dark ? 'hover:text-zinc-300 hover:bg-white/5' : 'hover:text-zinc-600 hover:bg-zinc-100'}`} title="More">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {sources && sources.length > 0 && (
        <SourcesSection sources={sources} dark={dark} />
      )}
    </>
  );
};

/* Follow-up suggestions after the last AI response */
const FollowUpSuggestions = ({
  suggestions,
  loading,
  dark,
  onSelect,
}: {
  suggestions: string[];
  loading: boolean;
  dark: boolean;
  onSelect: (text: string) => void;
}) => {
  if (loading || suggestions.length === 0) {
    return (
      <div className="mt-4">
        <span className={`text-xs font-semibold mb-2 block ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Follow-ups</span>
        <div className={`text-sm ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Generating suggestions...</div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <span className={`text-xs font-semibold mb-2 block ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>Follow-ups</span>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className={`flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded-lg transition-colors ${dark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}
          >
            <CornerDownRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const IntegrationChat = ({ conversationId, variant = 'default' }: IntegrationChatProps) => {
  const { user } = useAuth();
  const { refreshAfterOAuth } = useQuickBooksIntegration();
  const { checkAndUseCredits, canUseCredits } = useCreditGuard();
  const { settings } = useSettings();
  const isHotelShell = variant === 'hotel';
  const dark = isHotelShell ? true : settings.chatDarkMode;
  const { toast } = useToast();
  const { hasFeature, getEnabledFeatures, isCustomSolution } = useConsumerFeatures();
  const { 
    messages, 
    setMessages,
    loading, 
    setLoading,
    sendMessage, 
    currentConversationId,
    setCurrentConversationId,
    isStreaming,
    setIsStreaming,
    attachedDocuments,
    pendingDocuments,
    setPendingDocuments,
    attachDocument,
    removeDocument,
    deepResearchStatus,
    isWaitingForResponse
  } = useQuickBooksChat(conversationId);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<string>('general');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState('Y');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionDropdownPosition, setMentionDropdownPosition] = useState({ top: 0, left: 0 });
  const [isTransitioningToChat, setIsTransitioningToChat] = useState(false);
  const [skipIntegrationOnboarding, setSkipIntegrationOnboarding] = useState<boolean | null>(null); // null = not yet loaded
  const [aiFollowUpsByMessageId, setAiFollowUpsByMessageId] = useState<Record<string, string[]>>({});
  const [loadingFollowUpsFor, setLoadingFollowUpsFor] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pinRetryRef = useRef<number>(0);
  const pinNextUserMessageRef = useRef(false);
  
  const { 
    pendingReference, 
    setPendingReference, 
    addedReferences, 
    addReference, 
    removeReference, 
    clearReferences,
    availableReferences 
  } = useDashboardReference();

  const { agentState, sendAgentMessage, cancelAgent } = useAgentChat();

  // Track when we're transitioning from welcome to chat view
  const showWelcomeScreen = messages.length === 0 && !isTransitioningToChat;

  // Fetch user avatar and initials
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', user.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      
      if (data?.full_name) {
        const names = data.full_name.trim().split(' ');
        const initials = names.length > 1 
          ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
          : names[0][0].toUpperCase();
        setUserInitials(initials);
      }
    };

    fetchProfile();

    // Subscribe to avatar updates
    const channel = supabase
      .channel('profile-avatar-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new?.avatar_url) {
            setAvatarUrl(payload.new.avatar_url);
          }
          if (payload.new?.full_name) {
            const names = payload.new.full_name.trim().split(' ');
            const initials = names.length > 1 
              ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
              : names[0][0].toUpperCase();
            setUserInitials(initials);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check for skip_integration_onboarding (custom solutions / admin skip)
  useEffect(() => {
    const checkSkipFlag = async () => {
      if (!user) {
        setSkipIntegrationOnboarding(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('skip_integration_onboarding')
        .eq('user_id', user.id)
        .single();
      setSkipIntegrationOnboarding(data?.skip_integration_onboarding ?? false);
    };
    checkSkipFlag();
  }, [user]);

  // Generate contextual questions based on enabled features
  const cfoQuestions = useMemo(() => {
    if (isHotelShell) {
      return [
        'What moved RevPAR and ADR this week?',
        'How does occupancy compare to the last few weeks?',
        'What do our channel mix and GOPPAR suggest?',
        'Any labor or F&B cost lines worth a closer look?',
        'Summarize what I should bring to owner stand-up.',
        'Where might we be leaving rate or upsell on the table?',
      ];
    }
    const enabledFeatures = getEnabledFeatures();
    
    // If this is a custom solution user with skip_integration_onboarding, show feature-specific questions
    if (skipIntegrationOnboarding === true && isCustomSolution && enabledFeatures.length > 0) {
      const featureQuestions: string[] = [];
      
      if (hasFeature('competitive_pricing')) {
        featureQuestions.push(
          "How do our prices compare to competitors?",
          "Which products have the best margins?",
          "What pricing opportunities are we missing?",
          "Show me supplier price variances"
        );
      }
      
      if (hasFeature('crm')) {
        featureQuestions.push(
          "Who are our most valuable customers?",
          "Which leads should we prioritize?",
          "What's our customer retention rate?"
        );
      }
      
      if (hasFeature('inventory')) {
        featureQuestions.push(
          "Which items are running low on stock?",
          "What's our inventory turnover rate?",
          "Which products should we reorder?"
        );
      }
      
      if (hasFeature('invoicing')) {
        featureQuestions.push(
          "Which invoices are overdue?",
          "What's our average collection period?",
          "Show me outstanding receivables"
        );
      }
      
      if (hasFeature('reporting_advanced')) {
        featureQuestions.push(
          "Generate a financial summary report",
          "What trends do you see in our data?",
          "Show me key performance metrics"
        );
      }
      
      // Add some general questions
      featureQuestions.push(
        "What insights can you give me about my business?",
        "How can I improve profitability?"
      );
      
      return featureQuestions.length > 0 ? featureQuestions : [
        "What insights can you share about my business?",
        "How can I improve my operations?",
        "What should I focus on this week?"
      ];
    }
    
    // Default CFO questions for users with integrations
    return [
      "How is our cash flow looking this quarter?", 
      "What are our biggest expense categories?", 
      "How can we improve our profit margins?", 
      "Which customers drive the most revenue?", 
      "Are we on track to meet our financial goals?", 
      "What trends do you see in our business performance?"
    ];
  }, [isHotelShell, skipIntegrationOnboarding, isCustomSolution, hasFeature, getEnabledFeatures]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);


  const generateAiFollowUps = async (userQuestion: string, assistantAnswer: string): Promise<string[]> => {
    const CHAT_URL = `https://qjgnbvrxpmspzfqlomjc.supabase.co/functions/v1/streaming-chat`;

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZG5vbWZpY3poamFjbG12b21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MDQwMjYsImV4cCI6MjA2NzI4MDAyNn0.zQ2F8TrhkgCtgyApwt0aIuUexXJWyFsRvU8Wx6wRdtU`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are helping a user who just received an AI answer. Generate exactly 3 short, specific follow-up questions that the USER would naturally want to ask next to dig deeper or explore related topics. Write them from the user\'s perspective (e.g. "How can I..." or "What about..."). Return ONLY a valid JSON array of strings, no markdown, no explanation.'
          },
          {
            role: 'user',
            content: `User question:\n${userQuestion}\n\nAssistant answer:\n${assistantAnswer}`
          }
        ]
      }),
    });

    if (!response.ok || !response.body) throw new Error('Failed to generate follow-ups');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let output = '';
    let done = false;

    while (!done) {
      const { done: readDone, value } = await reader.read();
      if (readDone) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (delta) output += delta;
        } catch {
          // wait for next chunk
        }
      }
    }

    const firstBracket = output.indexOf('[');
    const lastBracket = output.lastIndexOf(']');
    const jsonSlice = firstBracket !== -1 && lastBracket !== -1 ? output.slice(firstBracket, lastBracket + 1) : '[]';
    const parsed = JSON.parse(jsonSlice);

    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === 'string').slice(0, 3);
  };

  // Robust scroll-to-top: pin latest user bubble after each messages change
  useEffect(() => {
    if (!pinNextUserMessageRef.current || messages.length === 0) return;

    // Check if latest message is from user — if not yet, wait for next render
    const hasUserMsg = messages.some(m => m.role === 'user');
    if (!hasUserMsg) return;

    pinRetryRef.current = 0;

    const tryPin = () => {
      const container = scrollContainerRef.current;
      if (!container) {
        if (pinRetryRef.current++ < 30) {
          setTimeout(tryPin, 16);
        }
        return;
      }

      const userBubbles = container.querySelectorAll('[data-message-role="user"]');
      const bubble = userBubbles[userBubbles.length - 1] as HTMLElement | undefined;
      if (!bubble) {
        if (pinRetryRef.current++ < 30) {
          setTimeout(tryPin, 16);
        }
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const offsetFromTop = bubbleRect.top - containerRect.top;
      const targetScrollTop = container.scrollTop + offsetFromTop - 12;

      container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      pinNextUserMessageRef.current = false;
    };

    // Use setTimeout(0) to let React commit DOM first, then start retrying
    setTimeout(tryPin, 50);
  }, [messages]);

  useEffect(() => {
    if (loading || isStreaming || messages.length === 0) return;

    const lastAssistantIndex = [...messages].reverse().findIndex((m) => m.role === 'assistant');
    if (lastAssistantIndex === -1) return;

    const absoluteAssistantIndex = messages.length - 1 - lastAssistantIndex;
    const assistantMessage = messages[absoluteAssistantIndex];

    if (!assistantMessage?.id || aiFollowUpsByMessageId[assistantMessage.id] || loadingFollowUpsFor === assistantMessage.id) return;

    const userBefore = [...messages.slice(0, absoluteAssistantIndex)].reverse().find((m) => m.role === 'user');
    if (!userBefore) return;

    setLoadingFollowUpsFor(assistantMessage.id);

    generateAiFollowUps(userBefore.content, assistantMessage.content)
      .then((followUps) => {
        setAiFollowUpsByMessageId((prev) => ({
          ...prev,
          [assistantMessage.id]: followUps,
        }));
      })
      .catch((err) => {
        console.error('Failed to generate AI follow-ups', err);
        setAiFollowUpsByMessageId((prev) => ({
          ...prev,
          [assistantMessage.id]: [
            'Can you break that down step by step?',
            'What should I prioritize first?',
            'Can you give a concrete example for my case?'
          ],
        }));
      })
      .finally(() => setLoadingFollowUpsFor((current) => (current === assistantMessage.id ? null : current)));
  }, [messages, loading, isStreaming, aiFollowUpsByMessageId, loadingFollowUpsFor]);

  // Listen for persistent chat bar messages from other pages
  useEffect(() => {
    const handlePersistentMessage = (e: CustomEvent<{ text: string; pageContext?: string }>) => {
      const { text, pageContext } = e.detail;
      const contextPrefix = pageContext ? `[User was viewing: ${pageContext}] ` : '';
      setInput(contextPrefix + text);
      // Auto-send after a tick to allow state to settle
      setTimeout(() => {
        const syntheticInput = contextPrefix + text;
        if (syntheticInput.trim()) {
          setInput('');
          if (messages.length === 0) {
            setIsTransitioningToChat(true);
          }
          pinNextUserMessageRef.current = true;
          checkAndUseCredits('ai_message' as any);
          sendMessage(syntheticInput);
        }
      }, 200);
    };
    window.addEventListener('persistentChatMessage', handlePersistentMessage as EventListener);
    return () => window.removeEventListener('persistentChatMessage', handlePersistentMessage as EventListener);
  }, [messages.length, sendMessage, checkAndUseCredits]);

  // Handle pending reference from dashboard
  useEffect(() => {
    if (pendingReference) {
      addReference(pendingReference);
      setPendingReference(null);
    }
  }, [pendingReference, addReference, setPendingReference]);

  // Auto-focus textarea when response is completed
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Focus the textarea after a short delay to ensure DOM is updated
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [loading, messages.length]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      // User just typed @
      setShowMentionDropdown(true);
      setMentionQuery('');
      
      // Calculate dropdown position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setMentionDropdownPosition({
          top: rect.top - 280, // Position above the textarea
          left: rect.left
        });
      }
    } else if (lastAtIndex !== -1 && showMentionDropdown) {
      // User is typing after @
      const query = value.slice(lastAtIndex + 1);
      if (query.includes(' ')) {
        // Space closes the mention dropdown
        setShowMentionDropdown(false);
      } else {
        setMentionQuery(query);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (ref: any) => {
    addReference(ref);
    setShowMentionDropdown(false);
    
    // Remove the @ and query from input
    const lastAtIndex = input.lastIndexOf('@');
    setInput(input.slice(0, lastAtIndex));
    textareaRef.current?.focus();
  };

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;
    
    // Prepare message content first
    let messageText = trimmedInput;
    if (addedReferences.length > 0) {
      const referencesContext = addedReferences
        .map(ref => `[Referenced: ${ref.name}] ${ref.data}`)
        .join('\n');
      messageText = `${referencesContext}\n\n${messageText}`;
    }
    
    const isNewConversation = !currentConversationId && messages.length === 0;
    
    // Determine credit cost based on selected model
    const modelInfo = getModelById(selectedModel);
    const creditCost = modelInfo.credits || 1; // Best (auto) uses 1 credit minimum
    const creditAction = 'ai_message';
    
    // Check if user has enough credits
    if (!canUseCredits(creditCost)) {
      window.dispatchEvent(new CustomEvent('openSettings', { 
        detail: { tab: 'plan-credits' } 
      }));
      return;
    }
 
    // Start transition before clearing input for smooth visual change
    if (messages.length === 0) {
      setIsTransitioningToChat(true);
    }

     // Clear input IMMEDIATELY for instant feedback
     setInput('');
     clearReferences();
 
     // Deduct credits optimistically
     checkAndUseCredits(creditAction as any, `AI chat (${modelInfo.displayName})`, creditCost);

     // Arm deterministic user-bubble pinning for this send
     pinNextUserMessageRef.current = true;
 
     // Send message with selected model
     sendMessage(messageText, isNewConversation, selectedModel);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't send message if mention dropdown is visible - let dropdown handle Enter
      if (!showMentionDropdown) {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleSettingsChange = async (open: boolean) => {
    setSettingsOpen(open);
    if (!open) {
      await refreshAfterOAuth();
    }
  };

  const handleFileUploaded = async (fileName: string, storageUrl: string, documentId?: string, fileType?: string, extractedContent?: string) => {
    if (documentId) {
      await attachDocument(documentId, storageUrl, fileName, fileType || 'application/octet-stream', extractedContent);
    }
    // Document is now attached or pending - no pre-fill, user will ask their question
  };

  const handleTranscription = (text: string) => {
    setInput(prevInput => prevInput ? `${prevInput} ${text}` : text);
    textareaRef.current?.focus();
  };

  return (
    <div
      className={`flex flex-col overflow-hidden ${isHotelShell ? 'flex-1 min-h-0 h-full' : 'flex-1 h-full'} ${dark ? 'bg-slate-950 text-white' : 'bg-white text-zinc-900'}`}
    >
      {isHotelShell && (
        <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/90">
          <span className="w-1 self-stretch min-h-[2.25rem] rounded-full bg-amber-500 shrink-0" aria-hidden />
          <VestaLogo size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300/90">Vesta CFO</p>
            <h1 className="text-sm font-semibold text-white tracking-tight">Assistant</h1>
          </div>
          <p className="hidden md:block text-xs text-slate-500 max-w-xs text-right leading-snug">
            Plain-language answers over your metrics, uploads, and connected data.
          </p>
        </header>
      )}
      <SettingsModal open={settingsOpen} onOpenChange={handleSettingsChange} defaultTab={settingsDefaultTab} />
      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide relative">
       {showWelcomeScreen ? (
          /* Welcome Screen */
          (() => {
            return (
          <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 pb-16 animate-fade-in">
            <div className="text-center mb-6 md:mb-10 max-w-xl">
              {isHotelShell ? (
                <>
                  <p className="text-xs text-slate-500 mb-3 font-medium">Start with a question</p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-slate-100 leading-snug mb-4">
                    What should we look at first?
                  </h2>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                    <TypingAnimation messages={cfoQuestions} className="text-slate-400 text-base md:text-lg" />
                  </div>
                </>
              ) : (
                <h2 className="text-3xl md:text-[2.6rem] font-light min-h-[2.5rem] md:min-h-[3.5rem] tracking-tight leading-tight">
                  <TypingAnimation messages={cfoQuestions} className={dark ? 'text-zinc-400' : 'text-zinc-500'} />
                </h2>
              )}
            </div>

            {/* Input Area - Centered */}
            <div className="w-full max-w-2xl px-2 md:px-0">
              <div className={`relative rounded-xl transition-all duration-200 ${dark ? 'bg-slate-900 border border-slate-800' : 'bg-white/80 backdrop-blur-sm border border-zinc-200/60 shadow-xl'}`}>
                {/* Attached & Pending Documents */}
                {(attachedDocuments.length > 0 || pendingDocuments.length > 0) && (
                  <div className={`px-6 pt-4 pb-2 flex flex-wrap gap-2`}>
                    {attachedDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${dark ? 'bg-amber-950/30 border border-amber-900/40' : 'bg-amber-50 border border-amber-200/80'}`}
                      >
                        <span className={dark ? 'text-amber-200' : 'text-amber-900'}>📎 {doc.fileName}</span>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className={`transition-colors ${dark ? 'text-amber-500/80 hover:text-amber-300' : 'text-amber-700/70 hover:text-amber-900'}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {pendingDocuments.map((doc) => (
                      <div 
                        key={doc.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${dark ? 'bg-amber-950/30 border border-amber-900/40' : 'bg-amber-50 border border-amber-200/80'}`}
                      >
                        <span className={dark ? 'text-amber-200' : 'text-amber-900'}>📎 {doc.fileName}</span>
                        <button
                          onClick={() => setPendingDocuments(prev => prev.filter(d => d.id !== doc.id))}
                          className={`transition-colors ${dark ? 'text-amber-500/80 hover:text-amber-300' : 'text-amber-700/70 hover:text-amber-900'}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Reference Tags */}
                {addedReferences.length > 0 && (
                  <div className={`px-6 pt-4 pb-2 flex flex-wrap gap-2 border-b ${dark ? 'border-slate-800' : 'border-zinc-100'}`}>
                    {addedReferences.map((ref) => (
                      <ReferenceTag 
                        key={ref.id} 
                        reference={ref} 
                        onRemove={() => removeReference(ref.id)} 
                      />
                    ))}
                  </div>
                )}
                
                {/* Textarea area */}
                <div className="p-5 md:p-6">
                  <div className="flex-1 relative" data-walkthrough="chat-input">
                    <Textarea 
                      ref={textareaRef}
                      value={input} 
                      onChange={handleInputChange} 
                      onKeyDown={handleKeyPress}
                      placeholder={selectedModel === 'deep-research' ? "What would you like me to research?" : selectedModel === 'gpt-4o-search' ? "Search the web..." : "Ask anything..."}
                      disabled={loading || agentState.isRunning}
                      className={`min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-6 shadow-none text-base font-sans disabled:opacity-50 ${dark ? 'text-white placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'}`}
                      rows={1}
                    />
                  </div>
                </div>

                {/* Bottom toolbar row */}
                <div className={`flex items-center justify-between px-4 md:px-5 py-3 ${dark ? '' : 'border-t border-zinc-100'}`}>
                  {/* Left: file upload */}
                  <div className="flex items-center">
                    <FileUploadButton 
                      onFileUploaded={handleFileUploaded}
                      isUploading={isUploading}
                      setIsUploading={setIsUploading}
                      disabled={loading}
                      conversationId={currentConversationId}
                    />
                  </div>
                  
                  {/* Right: agent toggle, voice, send */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      disabled={loading || agentState.isRunning}
                    />
                    <VoiceInputButton 
                      onTranscription={handleTranscription}
                      disabled={loading}
                    />
                    {deepResearchStatus?.isPolling ? (
                      <Button 
                        onClick={() => {
                          setLoading(false);
                          setIsStreaming(false);
                        }}
                        size="sm" 
                        className={`h-8 w-8 p-0 rounded-full border-0 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                      >
                        <Square className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!input.trim() || loading || agentState.isRunning}
                        size="sm" 
                        className={`h-8 w-8 p-0 rounded-full disabled:opacity-30 border-0 ${dark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                      >
                        {(loading || agentState.isRunning) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
            );
          })()
        ) : (
          /* Chat Messages */
         <div className="max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8 animate-fade-in">
            {messages.map((message, index) => {
              return (
              <div key={message.id} className={message.role === 'user' ? 'mb-6' : 'mb-8'}>
                {message.role === 'user' ? (
                  /* Right-aligned user bubble, no avatar — inline-block so it shrink-wraps */
                  <div className="flex justify-end">
                    <div data-message-id={message.id} data-message-role="user" className={`inline-block rounded-2xl px-4 py-2 text-sm ${dark ? 'bg-slate-800 text-white border border-slate-700/80' : 'bg-zinc-100 text-zinc-900'}`}>
                      {message.content}
                    </div>
                  </div>
                ) : (
                  /* AI response — no avatar, full width */
                  <div>
                    <div className={`prose prose-sm max-w-none leading-relaxed font-serif [&>p]:mb-4 [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-base [&>h2]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-sm [&>h3]:font-semibold [&_ul]:mb-4 [&_ol]:mb-4 [&_ul]:space-y-2 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:pl-1 [&>table]:mb-4 [&>table]:mt-2 ${dark ? 'text-slate-200 prose-headings:text-white prose-strong:text-slate-100 prose-code:text-violet-200/90 prose-a:text-violet-400' : 'text-zinc-900'}`}>
                      {message.role === 'assistant' && isStreaming && index === messages.length - 1 ? (
                        <TypewriterText 
                          text={message.sources?.length ? stripInlineCitations(message.content) : message.content} 
                          isStreaming={true}
                        />
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{preprocessMath(message.sources?.length ? stripInlineCitations(message.content) : message.content)}</ReactMarkdown>
                      )}
                    </div>
                    {/* Action bar below AI responses */}
                    {!(isStreaming && index === messages.length - 1) && (
                      <MessageActionBar content={message.sources?.length ? stripInlineCitations(message.content) : message.content} dark={dark} sources={message.sources} />
                    )}
                    {/* Follow-up suggestions - only on last AI message */}
                    {index === messages.length - 1 && !loading && !isStreaming && (
                      <FollowUpSuggestions
                        suggestions={aiFollowUpsByMessageId[message.id] || []}
                        loading={loadingFollowUpsFor === message.id}
                        dark={dark}
                        onSelect={(text) => { setInput(text); }}
                      />
                    )}
                  </div>
                )}
               </div>
            );
            })}
            
            {/* Thinking / Agent Progress Animation */}
            {(isWaitingForResponse || deepResearchStatus?.isPolling) && (
              <div className="mb-6 md:mb-8">
                {agentState.isRunning ? (
                  <AgentProgressIndicator
                    currentStep={agentState.currentStep}
                    totalSteps={agentState.totalSteps}
                    currentLabel={agentState.currentLabel}
                    estimatedSecondsRemaining={agentState.estimatedSecondsRemaining}
                    thinkingLog={agentState.thinkingLog}
                    completedSteps={agentState.completedSteps}
                    onCancel={cancelAgent}
                  />
                ) : deepResearchStatus?.isPolling ? (
                  <DeepResearchProgress
                    elapsedSeconds={deepResearchStatus.elapsedSeconds}
                    statusMessage={deepResearchStatus.statusMessage}
                    dark={dark}
                  />
                ) : (
                  <ThinkingIndicator />
                )}
              </div>
            )}
            
          </div>
        )}
        
      </div>

      {/* Input area (conversation mode) */}
      {!showWelcomeScreen && (
        (() => {
          return (
        <div className={`relative shrink-0 ${dark ? 'bg-slate-950' : 'bg-white'} ${isHotelShell ? 'border-t border-slate-800' : ''}`}>
          <div className={`px-3 md:px-4 pb-3 md:pb-4 ${dark ? 'bg-slate-950' : 'bg-white'}`} style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto">
            <div className={`relative rounded-2xl transition-all duration-200 ${dark ? 'bg-slate-900 border border-slate-800 shadow-lg' : 'bg-white ring-1 ring-zinc-200 shadow-xl'}`}>
              {/* Attached Documents */}
              {attachedDocuments.length > 0 && (
                <div className={`px-4 pt-3 pb-2 flex flex-wrap gap-2`}>
                  {attachedDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${dark ? 'bg-amber-950/30 border border-amber-900/40' : 'bg-amber-50 border border-amber-200/80'}`}
                    >
                      <span className={dark ? 'text-amber-200' : 'text-amber-900'}>📎 {doc.fileName}</span>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className={`transition-colors ${dark ? 'text-amber-500/80 hover:text-amber-300' : 'text-amber-700/70 hover:text-amber-900'}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reference Tags */}
              {addedReferences.length > 0 && (
                <div className={`px-4 pt-3 pb-2 flex flex-wrap gap-2 border-b ${dark ? 'border-slate-800' : 'border-zinc-100'}`}>
                  {addedReferences.map((ref) => (
                    <ReferenceTag 
                      key={ref.id} 
                      reference={ref} 
                      onRemove={() => removeReference(ref.id)} 
                    />
                  ))}
                </div>
              )}
              
              {/* Top: Textarea */}
              <div className="px-4 pt-4 pb-2" data-walkthrough="chat-input">
                <Textarea 
                  ref={textareaRef}
                  value={input} 
                  onChange={handleInputChange} 
                  onKeyDown={handleKeyPress}
                  placeholder={selectedModel === 'gpt-4o-search' ? "Search the web..." : "Ask a follow-up..."}
                  disabled={false}
                  className={`min-h-[40px] max-h-[100px] md:max-h-[120px] resize-none border-0 bg-transparent focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-6 shadow-none text-base font-sans ${dark ? 'text-white placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'}`}
                  rows={1}
                />
              </div>

              {/* Bottom toolbar row */}
              <div className={`flex items-center justify-between px-3 py-2.5`}>
                {/* Left: file upload */}
                <div className="flex items-center">
                  <FileUploadButton 
                    onFileUploaded={handleFileUploaded}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    disabled={false}
                    conversationId={currentConversationId}
                  />
                </div>
                
                {/* Right: agent toggle, voice, send/stop */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    disabled={agentState.isRunning}
                  />
                  <VoiceInputButton 
                    onTranscription={handleTranscription}
                    disabled={false}
                  />
                  {(loading || isStreaming) ? (
                    <Button 
                      onClick={() => { setLoading(false); setIsStreaming(false); }}
                      size="sm" 
                      className={`h-8 w-8 p-0 rounded-full border-0 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                    >
                      <Square className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      size="sm" 
                      className={`h-8 w-8 p-0 rounded-full disabled:opacity-30 border-0 ${dark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
          );
        })()
      )}

      {/* Mention Dropdown */}
      {showMentionDropdown && (
        <MentionDropdown
          query={mentionQuery}
          references={availableReferences}
          onSelect={handleMentionSelect}
          position={mentionDropdownPosition}
        />
      )}
    </div>
  );
};

export default IntegrationChat;