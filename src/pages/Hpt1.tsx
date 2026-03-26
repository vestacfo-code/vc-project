import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, BarChart3, Sparkles, Mic, MoreHorizontal, FileText, Zap, TrendingUp, TrendingDown, ChevronDown, MessageSquare, ArrowRight, FileSpreadsheet, Grid3X3, LayoutGrid, Settings, Phone, Mail, Inbox, Calendar, Users, AlertCircle, Search, Tags, Clock, ChevronRight, ChevronLeft, DollarSign, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import finloLogoBlack from '@/assets/finlo-logo-black-text.png';
import finloLogoWhite from '@/assets/finlo-logo-white-text.png';
import quickbooksLogo from '@/assets/quickbooks-logo.png';
import xeroLogo from '@/assets/xero-logo.png';
import waveLogo from '@/assets/wave-logo.png';
import zohoLogo from '@/assets/zoho-logo.png';
import lightTrailsBg from '@/assets/light-trails-bg.png';
const typingPhrases = ["How is our cash flow looking?", "What's driving our revenue growth?", "Show me expense trends this quarter", "Which customers are most profitable?"];
const Hpt1 = () => {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isDocsDropdownOpen, setIsDocsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFeatureDropdownOpen, setIsMobileFeatureDropdownOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [liveStats, setLiveStats] = useState({ totalRevenue: 0, userCount: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const productDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const docsDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll-triggered animations for each section
  const section2Reveal = useScrollReveal({ threshold: 0.15 });
  const section3Reveal = useScrollReveal({ threshold: 0.1 });
  const section4Reveal = useScrollReveal({ threshold: 0.15 });
  const section5Reveal = useScrollReveal({ threshold: 0.15 });
  const testimonialReveal = useScrollReveal({ threshold: 0.1 });
  const section6Reveal = useScrollReveal({ threshold: 0.15 });
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Testimonials data with fake names and placeholder avatars
  const testimonials = [
    {
      title: "Finally understand where our money goes",
      quote: "Before Finlo, I spent hours in spreadsheets trying to figure out our cash flow. Now I just ask a question and get instant clarity. It has transformed how I run my business.",
      author: "Jennifer Walsh",
      role: "Founder, Evergreen Design Co.",
      initials: "JW",
      color: "from-violet-500 to-purple-600"
    },
    {
      title: "Like having a CFO in my pocket",
      quote: "As a solo founder, I could not afford a finance team. Finlo gives me the same insights a CFO would, but at a fraction of the cost. It has been a game-changer for strategic decisions.",
      author: "Michael Torres",
      role: "CEO, Brightpath Tech",
      initials: "MT",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Cut our financial review time by 80%",
      quote: "What used to take our team a full day now happens in minutes. The AI understands our data and surfaces exactly what we need to know. I wish we had found this sooner.",
      author: "Rachel Kim",
      role: "Operations Manager, Urban Bites Group",
      initials: "RK",
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "The insights are incredibly actionable",
      quote: "Finlo does not just show me numbers. It tells me what they mean and what to do about them. Last month it flagged a supplier issue that was costing us thousands.",
      author: "David Okonkwo",
      role: "Owner, Summit Consulting",
      initials: "DO",
      color: "from-amber-500 to-orange-600"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleProductMouseEnter = () => {
    if (productDropdownTimeout.current) {
      clearTimeout(productDropdownTimeout.current);
    }
    setIsProductDropdownOpen(true);
  };

  const handleProductMouseLeave = () => {
    productDropdownTimeout.current = setTimeout(() => {
      setIsProductDropdownOpen(false);
    }, 150);
  };

  const handleDocsMouseEnter = () => {
    if (docsDropdownTimeout.current) {
      clearTimeout(docsDropdownTimeout.current);
    }
    setIsDocsDropdownOpen(true);
  };

  const handleDocsMouseLeave = () => {
    docsDropdownTimeout.current = setTimeout(() => {
      setIsDocsDropdownOpen(false);
    }, 150);
  };

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_stats');
        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }
        if (data && data.length > 0) {
          setLiveStats({
            totalRevenue: Number(data[0].total_revenue) || 0,
            userCount: Number(data[0].total_users) || 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatUsers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}+`;
  };

  // Typing animation effect
  useEffect(() => {
    const currentPhrase = typingPhrases[phraseIndex];
    if (isTyping) {
      if (displayedText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        }, 80);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, pause then start deleting
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, 40);
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, move to next phrase
        setPhraseIndex(prev => (prev + 1) % typingPhrases.length);
        setIsTyping(true);
      }
    }
  }, [displayedText, isTyping, phraseIndex]);
  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      setLastQuery(chatInput);
      setShowSignupPopup(true);
      setChatInput('');
    }
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleChatSubmit();
    }
  };

  // Generate personalized message based on user query
  const getPersonalizedMessage = () => {
    const query = lastQuery.toLowerCase();
    if (query.includes('revenue') || query.includes('income') || query.includes('sales')) {
      return "We're ready to analyze your revenue trends and help you identify growth opportunities.";
    } else if (query.includes('expense') || query.includes('cost') || query.includes('spending')) {
      return "We can help you track expenses and find cost-saving opportunities in your business.";
    } else if (query.includes('cash flow') || query.includes('cashflow')) {
      return "Let's dive into your cash flow patterns and help you plan for the future.";
    } else if (query.includes('profit') || query.includes('margin')) {
      return "We'll help you understand your profit margins and ways to improve them.";
    } else if (query.includes('tax') || query.includes('taxes')) {
      return "We can help you organize your finances for better tax planning.";
    } else if (query.includes('forecast') || query.includes('predict') || query.includes('projection')) {
      return "Let's build accurate financial forecasts tailored to your business.";
    } else {
      return "We're excited to help you with your financial analysis and insights.";
    }
  };
  return <div className="min-h-screen bg-white relative">
      {/* First section wrapper with gradient */}
      <div className="relative min-h-screen flex flex-col">
        {/* Upward blue gradient - positioned at bottom of this section, extending upward */}
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#7ba3e8] via-[#a8c4f5] to-transparent" />
      
      {/* Navigation - Using shared Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative text-center pt-10 md:pt-16 pb-8 md:pb-12 px-4">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-normal text-gray-900 leading-tight mb-4 md:mb-6 tracking-tight">
          {/* Line 1: The World's First */}
          <span className="inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '100ms', animationFillMode: 'forwards' }}>The</span>{' '}
          <span className="inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '160ms', animationFillMode: 'forwards' }}>World's</span>{' '}
          <span className="inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '220ms', animationFillMode: 'forwards' }}>First</span>
          <br />
          {/* Line 2: AI CFO For Startups (italic, blue) */}
          <span className="italic text-[#1a237e] inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '300ms', animationFillMode: 'forwards' }}>AI</span>{' '}
          <span className="italic text-[#1a237e] inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '360ms', animationFillMode: 'forwards' }}>CFO</span>{' '}
          <span className="italic text-[#1a237e] inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '420ms', animationFillMode: 'forwards' }}>For</span>{' '}
          <span className="italic text-[#1a237e] inline-block animate-wordReveal" style={{ opacity: 0, animationDelay: '480ms', animationFillMode: 'forwards' }}>Startups</span>
        </h1>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed px-2 animate-fadeSlideUp" style={{ opacity: 0, animationDelay: '600ms', animationFillMode: 'forwards' }}>
          Stop guessing about your business financials. Finlo brings clarity
          to your finances so you can move fast and make decisions before it's too late.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-scaleIn" style={{ opacity: 0, animationDelay: '750ms', animationFillMode: 'forwards' }}>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-6 md:px-8 py-4 md:py-5 text-sm md:text-base font-medium min-w-[140px]" onClick={() => navigate('/auth')}>
            Try for free
          </Button>
          <Button variant="outline" className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg px-6 md:px-8 py-4 md:py-5 text-sm md:text-base font-medium min-w-[140px]" onClick={() => window.open('https://calendar.app.google/PWqhmizMxqUnRNpP9', '_blank')}>
            Book demo
          </Button>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard-preview" className="relative pt-4 md:pt-8 pb-0 flex-1 flex flex-col animate-riseUp" style={{ opacity: 0, animationDelay: '900ms', animationFillMode: 'forwards' }}>
        <div className="relative px-2 md:px-4 flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full">
            {/* Mockup with rounded top only */}
            <div 
              className="bg-slate-100 rounded-t-xl md:rounded-t-2xl overflow-hidden [&_*]:!cursor-[inherit] flex-1 flex flex-col"
              style={{ cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%231a237e' stroke='%23fff' stroke-width='1' d='M4 4l16 8-8 3-3 8z'/%3E%3C/svg%3E") 4 4, pointer` }}
            >
              <div className="flex flex-1">
                {/* Sidebar - Dark theme - Hidden on mobile */}
                <div className="hidden md:flex w-56 bg-slate-900 flex-col rounded-tl-2xl">
                  {/* Sidebar Header with Logo */}
                  <div className="px-4 py-4">
                    <div className="mb-5">
                      <img src={finloLogoWhite} alt="Finlo" className="h-5 w-auto" />
                    </div>
                    
                    {/* New Chat Button */}
                    <div className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 rounded-lg text-sm font-medium mb-1 cursor-default">
                      <Plus className="w-4 h-4" />
                      New Chat
                    </div>
                    
                    {/* Dashboard Button */}
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 transition-all duration-150 rounded-lg text-sm font-medium">
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </button>
                  </div>

                  {/* Connected Account Section */}
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Connected</span>
                      <MoreHorizontal className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-white font-medium text-sm">QuickBooks</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  {/* Recent Chats */}
                  <div className="px-4 py-2 flex-1 overflow-hidden">
                    <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Recent</span>
                    <div className="mt-2 space-y-1">
                      <div className="w-full flex flex-col px-2 py-1 text-slate-300 rounded-lg text-sm text-left cursor-default">
                        <span className="truncate text-sm">Who are my top clients?</span>
                        <span className="text-slate-500 text-xs">2d ago</span>
                      </div>
                      <div className="w-full flex flex-col px-2 py-1 text-slate-400 rounded-lg text-sm text-left cursor-default">
                        <span className="truncate text-sm">Help me find new suppliers</span>
                        <span className="text-slate-500 text-xs">5d ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-slate-100 relative rounded-t-xl md:rounded-none">
                  <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6 md:py-0">
                    {/* Typing Animation Text */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-gray-800 mb-4 md:mb-6 text-center min-h-[2em]">
                      {displayedText}<span className="animate-pulse text-indigo-500">|</span>
                    </h2>

                    {/* Chat Input Box */}
                    <div className="w-full max-w-2xl">
                      <div 
                        className="bg-white rounded-2xl shadow-lg border border-slate-200 px-5 py-4"
                        onMouseEnter={() => setIsInputHovered(true)}
                        onMouseLeave={() => setIsInputHovered(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Input 
                            ref={inputRef} 
                            type="text" 
                            placeholder={isInputHovered ? "Start typing..." : "Ask anything..."} 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            className="flex-1 bg-transparent border-0 text-gray-800 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base !cursor-text" 
                          />
                          <Plus className="w-5 h-5 text-slate-400" />
                          <Mic className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>

      {/* Section 2: Features - Screenshot Style */}
      <section ref={section2Reveal.ref} className="min-h-[auto] lg:min-h-screen py-12 md:py-16 lg:py-24 px-4 flex items-start relative overflow-hidden">
        {/* Base background */}
        <div className="absolute inset-0 bg-white" />
        {/* Dissipating blue gradient from right side and bottom-right - stops before center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_130%_at_100%_100%,_#1e3a8a_0%,_rgba(30,58,138,0.5)_18%,_rgba(59,130,246,0.2)_40%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_150%_at_100%_55%,_rgba(30,58,138,0.3)_0%,_rgba(59,130,246,0.12)_35%,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_180%_80%_at_50%_100%,_rgba(30,58,138,0.4)_0%,_rgba(59,130,246,0.15)_30%,_transparent_55%)]" />
        
        <div className="max-w-5xl mx-auto w-full relative z-10">
          {/* Centered Headline */}
          <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif text-gray-900 text-center mb-8 md:mb-12 leading-tight px-2 ${section2Reveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
            <span className={`inline-block ${section2Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>Know</span>{' '}
            <span className={`inline-block ${section2Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '160ms', animationFillMode: 'forwards', opacity: 0 }}>Your</span>{' '}
            <span className={`inline-block ${section2Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '220ms', animationFillMode: 'forwards', opacity: 0 }}>Business</span>
            <br />
            <span className={`inline-block italic ${section2Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>Beneath</span>{' '}
            <span className={`inline-block italic ${section2Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '360ms', animationFillMode: 'forwards', opacity: 0 }}>The</span>{' '}
            <span className={`inline-block italic ${section2Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '420ms', animationFillMode: 'forwards', opacity: 0 }}>Surface</span>
          </h2>
          
          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-16">
            {/* Left: Feature List */}
            <div className="lg:w-2/5 space-y-5">
              {/* Feature 1 */}
              <div className={`flex items-start gap-3 ${section2Reveal.isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: '500ms', animationFillMode: 'forwards', opacity: 0 }}>
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">One place for all your data</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Connect your accounting tools, upload spreadsheets, and get insights from your CRM — so your team can spend more time growing and less time digging.
                  </p>
                </div>
              </div>
              
              {/* Feature 2 */}
              <div className={`flex items-start gap-3 ${section2Reveal.isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: '600ms', animationFillMode: 'forwards', opacity: 0 }}>
                <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">Automate the tedious stuff</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Don't make humans do what AI can do. Finlo automates reports, forecasts, and analysis — all enhanced with AI to surface what matters.
                  </p>
                </div>
              </div>
              
              {/* Feature 3 */}
              <div className={`flex items-start gap-3 ${section2Reveal.isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: '700ms', animationFillMode: 'forwards', opacity: 0 }}>
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">Built for decisions (not data entry)</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Your finances shouldn't be a glorified spreadsheet. Finlo is built to accelerate your strategy and keep you ahead 24/7.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right: Dark Customer Profitability Mockup */}
            <div className={`lg:w-1/2 lg:ml-auto ${section2Reveal.isVisible ? 'animate-floatUp' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards', opacity: 0 }}>
              <div 
                className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden transform scale-[0.95] origin-top-right max-w-md ml-auto [&_*]:!cursor-[inherit]"
                style={{ cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%231a237e' stroke='%23fff' stroke-width='1' d='M4 4l16 8-8 3-3 8z'/%3E%3C/svg%3E") 4 4, pointer` }}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">Customer Profitability</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-white text-xs rounded">
                      <Users className="w-3 h-3" />
                      <span>Revenue</span>
                    </div>
                  </div>
                </div>
                
                {/* Revenue Concentration */}
                <div className="px-4 py-4 border-b border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Revenue Concentration</span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">High</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-white">68%</span>
                    <span className="text-xs text-slate-400">from top 4 customers</span>
                  </div>
                </div>
                
                {/* Customer List */}
                <div className="divide-y divide-slate-800">
                  {/* Customer 1 */}
                  <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">N</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#1</span>
                        <span className="text-white text-xs font-medium truncate">Nexora Labs</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>$124,500</span>
                        <span>•</span>
                        <span>18 invoices</span>
                        <span>•</span>
                        <span>3d ago</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer 2 */}
                  <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">F</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#2</span>
                        <span className="text-white text-xs font-medium truncate">Fort Capital</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>$89,200</span>
                        <span>•</span>
                        <span>12 invoices</span>
                        <span>•</span>
                        <span>15d ago</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer 3 - At Risk */}
                  <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">Z</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#3</span>
                        <span className="text-white text-xs font-medium truncate">Zentrax Solutions</span>
                        <TrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>$67,800</span>
                        <span>•</span>
                        <span>8 invoices</span>
                        <span>•</span>
                        <span className="text-red-400">45d ago</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer 4 */}
                  <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">B</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#4</span>
                        <span className="text-white text-xs font-medium truncate">Bluehaven Inc</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>$52,100</span>
                        <span>•</span>
                        <span>6 invoices</span>
                        <span>•</span>
                        <span>7d ago</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Insight Footer */}
                <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-amber-400 font-medium">Insight:</span> Consider diversifying revenue sources — top 4 customers account for 68% of total revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: AI Features Showcase */}
      <section ref={section3Reveal.ref} className="pt-12 pb-16 md:pt-16 md:pb-24 lg:pb-32 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          {/* Top Icon */}
          <div className={`flex justify-center mb-6 md:mb-8 ${section3Reveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-transparent bg-clip-text" style={{ stroke: 'url(#sparkle-gradient)' }} />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Main Headline */}
          <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white mb-8 md:mb-12 leading-tight tracking-tight text-center px-2`}>
            <span className={`inline-block ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>The</span>{' '}
            <span className={`inline-block ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '260ms', animationFillMode: 'forwards', opacity: 0 }}>Go-to</span>{' '}
            <span className={`inline-block ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '320ms', animationFillMode: 'forwards', opacity: 0 }}>Financial</span>{' '}
            <span className={`inline-block ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '380ms', animationFillMode: 'forwards', opacity: 0 }}>Tool</span>
            <br />
            <span className={`inline-block italic ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '440ms', animationFillMode: 'forwards', opacity: 0 }}>for</span>{' '}
            <span className={`inline-block italic ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '500ms', animationFillMode: 'forwards', opacity: 0 }}>Your</span>{' '}
            <span className={`inline-block italic ${section3Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '560ms', animationFillMode: 'forwards', opacity: 0 }}>Business</span>
          </h2>

          {/* Mobile: Dropdown selector */}
          <div className="md:hidden flex justify-center mb-8 relative">
            <button 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white"
              onClick={() => setIsMobileFeatureDropdownOpen(!isMobileFeatureDropdownOpen)}
            >
              {activeFeatureTab === 0 && <Sparkles className="w-4 h-4" />}
              {activeFeatureTab === 1 && <TrendingUp className="w-4 h-4" />}
              {activeFeatureTab === 2 && <BarChart3 className="w-4 h-4" />}
              {activeFeatureTab === 3 && <Users className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {activeFeatureTab === 0 && 'Smart Insights'}
                {activeFeatureTab === 1 && 'Cash Flow AI'}
                {activeFeatureTab === 2 && 'Expense Intelligence'}
                {activeFeatureTab === 3 && 'Customer Insights'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isMobileFeatureDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isMobileFeatureDropdownOpen && (
              <div className="absolute top-full mt-2 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[200px]">
                <button 
                  className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${activeFeatureTab === 0 ? 'text-white bg-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  onClick={() => { setActiveFeatureTab(0); setIsMobileFeatureDropdownOpen(false); }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Smart Insights</span>
                </button>
                <button 
                  className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${activeFeatureTab === 1 ? 'text-white bg-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  onClick={() => { setActiveFeatureTab(1); setIsMobileFeatureDropdownOpen(false); }}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Cash Flow AI</span>
                </button>
                <button 
                  className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${activeFeatureTab === 2 ? 'text-white bg-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  onClick={() => { setActiveFeatureTab(2); setIsMobileFeatureDropdownOpen(false); }}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Expense Intelligence</span>
                </button>
                <button 
                  className={`w-full flex items-center gap-2 px-4 py-3 text-left transition-colors ${activeFeatureTab === 3 ? 'text-white bg-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  onClick={() => { setActiveFeatureTab(3); setIsMobileFeatureDropdownOpen(false); }}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Customer Insights</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop: Full tab bar */}
          <div className="hidden md:flex justify-center mb-12">
            <div className="inline-flex items-center gap-1 p-1.5 bg-slate-900 border border-slate-700 rounded-xl">
              {/* Tab 0: Smart Insights */}
              <button 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${activeFeatureTab === 0 ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveFeatureTab(0)}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Smart Insights</span>
              </button>
              {/* Tab 1: Cash Flow AI */}
              <button 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${activeFeatureTab === 1 ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveFeatureTab(1)}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Cash Flow AI</span>
              </button>
              {/* Tab 2: Expense Intelligence */}
              <button 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${activeFeatureTab === 2 ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveFeatureTab(2)}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Expense Intelligence</span>
              </button>
              {/* Tab 3: Customer Insights */}
              <button 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${activeFeatureTab === 3 ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveFeatureTab(3)}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Customer Insights</span>
              </button>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
            {/* Left Column - Feature Description */}
            <div className={`flex flex-col justify-center pt-4 ${section3Reveal.isVisible ? 'animate-slideInLeft' : 'opacity-0'}`} style={{ animationDelay: '700ms', animationFillMode: 'forwards', opacity: 0 }}>
              {/* Smart Insights */}
              {activeFeatureTab === 0 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Smart Insights</h3>
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Finlo automatically scans your financial data and surfaces the insights that matter most. Get proactive alerts about revenue trends, expense anomalies, and cash flow patterns—before they become problems.
                  </p>
                </>
              )}
              {/* Cash Flow AI */}
              {activeFeatureTab === 1 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Cash Flow AI</h3>
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Get AI-powered cash flow forecasts that predict your runway, identify upcoming cash crunches, and help you make smarter decisions about when to spend and when to save.
                  </p>
                </>
              )}
              {/* Expense Intelligence */}
              {activeFeatureTab === 2 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Expense Intelligence</h3>
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Finlo automatically detects spending anomalies and tracks your top vendors. Get instant visibility into where your money goes and receive AI-powered recommendations to optimize costs.
                  </p>
                </>
              )}
              {/* Customer Insights */}
              {activeFeatureTab === 3 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Customer Insights</h3>
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Understand your customer profitability at a glance. Track revenue concentration, identify at-risk accounts, and get AI-powered insights to strengthen your most valuable relationships.
                  </p>
                </>
              )}
            </div>

            {/* Right Column - UI Mockup */}
            <div 
              className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden pointer-events-none [&_*]:!cursor-[inherit] ${section3Reveal.isVisible ? 'animate-floatUp' : 'opacity-0'}`}
              style={{ animationDelay: '600ms', animationFillMode: 'forwards', opacity: 0, cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%231a237e' stroke='%23fff' stroke-width='1' d='M4 4l16 8-8 3-3 8z'/%3E%3C/svg%3E") 4 4, pointer` }}
            >
              {/* Tab 0: Smart Insights Mockup - Matches StrategicAlerts.tsx */}
              {activeFeatureTab === 0 && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-400" />
                      <span className="text-white font-medium text-sm">Strategic Alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">3 unread</span>
                    </div>
                  </div>

                  {/* Alert Cards */}
                  <div className="p-3 space-y-2">
                    {/* Critical Alert */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm font-semibold">Cash Runway Alert</span>
                            <span className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-medium">critical</span>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">Cash runway has dropped below 3 months. Consider reducing expenses or accelerating receivables.</p>
                          <p className="text-slate-500 text-[10px] mt-1.5">Jan 12, 2026</p>
                        </div>
                      </div>
                    </div>

                    {/* Warning Alert */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm font-semibold">Expense Anomaly</span>
                            <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium">warning</span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">Marketing spend 40% higher than 3-month average. Review recent campaigns.</p>
                          <p className="text-slate-500 text-[10px] mt-1.5">Jan 10, 2026</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Alert */}
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm font-semibold">Revenue Milestone</span>
                            <span className="text-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded font-medium">info</span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">Q4 revenue increased 23% compared to Q3. Top performing quarter this year.</p>
                          <p className="text-slate-500 text-[10px] mt-1.5">Jan 8, 2026</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 1: Cash Flow AI Mockup */}
              {activeFeatureTab === 1 && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <span className="text-white font-medium text-sm">Cash Flow Forecast</span>
                    <span className="text-xs text-slate-500">Next 90 days</span>
                  </div>

                  {/* Primary Metrics */}
                  <div className="px-4 py-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Current Cash</p>
                        <p className="text-2xl font-medium text-white">$284,500</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Monthly Burn</p>
                        <p className="text-2xl font-medium text-white">$42,300</p>
                      </div>
                    </div>
                  </div>

                  {/* Runway */}
                  <div className="px-4 py-4 border-b border-slate-800">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-medium text-emerald-400">6.7</span>
                      <span className="text-sm text-slate-400">months runway</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                    </div>
                  </div>

                  {/* Forecast Periods */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-slate-400 w-12">Feb</span>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="text-slate-500">In</span>
                        <span className="font-medium text-emerald-400 w-16 text-right">$89,200</span>
                        <span className="text-slate-500">Out</span>
                        <span className="font-medium text-red-400 w-16 text-right">$45,100</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-slate-400 w-12">Mar</span>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="text-slate-500">In</span>
                        <span className="font-medium text-emerald-400 w-16 text-right">$76,800</span>
                        <span className="text-slate-500">Out</span>
                        <span className="font-medium text-red-400 w-16 text-right">$41,200</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-slate-400 w-12">Apr</span>
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="text-slate-500">In</span>
                        <span className="font-medium text-emerald-400 w-16 text-right">$92,400</span>
                        <span className="text-slate-500">Out</span>
                        <span className="font-medium text-red-400 w-16 text-right">$43,800</span>
                      </div>
                    </div>
                  </div>

                  {/* Insight Footer */}
                  <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Runway is healthy. Consider investing in growth initiatives while maintaining 4+ month buffer.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 2: Expense Intelligence Mockup */}
              {activeFeatureTab === 2 && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <span className="text-white font-medium text-sm">Expense Intelligence</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">AI-Powered</span>
                    </div>
                  </div>

                  {/* Anomaly Alert */}
                  <div className="px-4 py-3 border-b border-slate-800">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 text-xs font-medium">Spending Anomaly Detected</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-xs">Marketing & Advertising</span>
                        <span className="text-amber-400 text-xs font-bold">+47% above average</span>
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                        <span>Expected: $8,200</span>
                        <span>Actual: $12,050</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Vendors */}
                  <div className="px-4 py-3">
                    <p className="text-xs text-slate-500 mb-3">Top Spending by Vendor</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">1</span>
                          <span className="text-white text-xs">Amazon Web Services</span>
                        </div>
                        <span className="text-white text-xs font-medium">$24,500</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">2</span>
                          <span className="text-white text-xs">Salesforce</span>
                        </div>
                        <span className="text-white text-xs font-medium">$18,200</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">3</span>
                          <span className="text-white text-xs">Google Ads</span>
                        </div>
                        <span className="text-white text-xs font-medium">$12,050</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">4</span>
                          <span className="text-white text-xs">WeWork</span>
                        </div>
                        <span className="text-white text-xs font-medium">$8,400</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">5</span>
                          <span className="text-white text-xs">Gusto Payroll</span>
                        </div>
                        <span className="text-white text-xs font-medium">$6,800</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insight */}
                  <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-300 leading-relaxed">
                        SaaS costs increased 23% this quarter. Consider annual contracts for AWS and Salesforce to save ~$8K/year.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 3: Customer Insights Mockup */}
              {activeFeatureTab === 3 && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <span className="text-white font-medium text-sm">Customer Insights</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-400">Live</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="px-4 py-3 border-b border-slate-800 flex gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Top Customer</p>
                      <p className="text-xl font-medium text-white">$142K</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Active</p>
                      <p className="text-xl font-medium text-emerald-400">24</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">At Risk</p>
                      <p className="text-xl font-medium text-red-400">3</p>
                    </div>
                  </div>

                  {/* Customer List */}
                  <div className="divide-y divide-slate-800">
                    <div className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">AC</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium truncate">Acme Corp</span>
                          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Active</span>
                        </div>
                        <span className="text-xs text-slate-500">18 invoices • Last: 5 days ago</span>
                      </div>
                      <span className="text-white text-xs font-medium">$142,500</span>
                    </div>

                    <div className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">TI</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium truncate">TechInnovate Inc</span>
                          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Active</span>
                        </div>
                        <span className="text-xs text-slate-500">12 invoices • Last: 12 days ago</span>
                      </div>
                      <span className="text-white text-xs font-medium">$89,200</span>
                    </div>

                    <div className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">GS</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium truncate">GlobalSync Ltd</span>
                          <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Declining</span>
                        </div>
                        <span className="text-xs text-slate-500">8 invoices • Last: 45 days ago</span>
                      </div>
                      <span className="text-white text-xs font-medium">$67,800</span>
                    </div>

                    <div className="px-4 py-2.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">NV</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-medium truncate">Nexus Ventures</span>
                          <span className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">At Risk</span>
                        </div>
                        <span className="text-xs text-slate-500">5 invoices • Last: 78 days ago</span>
                      </div>
                      <span className="text-white text-xs font-medium">$54,300</span>
                    </div>
                  </div>

                  {/* Revenue Concentration Insight */}
                  <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="text-amber-400 font-medium">42% revenue concentration</span> in top 2 customers. Consider diversifying client base.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Light Trails CTA */}
      <section ref={section4Reveal.ref} className="relative pt-16 pb-16 md:pt-24 md:pb-56 lg:pt-32 lg:pb-72 px-4 bg-black overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${lightTrailsBg})`,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-2">
          <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white mb-4 md:mb-6 leading-tight tracking-tight`}>
            <span className={`inline-block ${section4Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>Your</span>{' '}
            <span className={`inline-block ${section4Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '160ms', animationFillMode: 'forwards', opacity: 0 }}>Financial</span>{' '}
            <span className={`inline-block ${section4Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '220ms', animationFillMode: 'forwards', opacity: 0 }}>Data,</span>
            <br />
            <span className={`inline-block italic ${section4Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>Finally</span>{' '}
            <span className={`inline-block italic ${section4Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '360ms', animationFillMode: 'forwards', opacity: 0 }}>Making</span>{' '}
            <span className={`inline-block italic ${section4Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '420ms', animationFillMode: 'forwards', opacity: 0 }}>Sense</span>
          </h2>
          
          <p className={`text-sm md:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-0 ${section4Reveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '500ms', animationFillMode: 'forwards', opacity: 0 }}>
            Finlo analyzes your financial data in real-time, delivering insights
            that would take a traditional CFO hours to uncover.
          </p>
        </div>

        {/* Mobile: Horizontal scrollable stats cards */}
        <div className="md:hidden relative z-10 mt-8 flex justify-center gap-3 px-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-center">
            <p className="text-white/60 text-[10px] uppercase tracking-wide mb-1">Revenue Analyzed</p>
            <p className="text-white text-lg font-semibold">
              {statsLoading ? '...' : formatCurrency(liveStats.totalRevenue)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-center">
            <p className="text-white/60 text-[10px] uppercase tracking-wide mb-1">Active Users</p>
            <p className="text-white text-lg font-semibold">
              {statsLoading ? '...' : formatUsers(liveStats.userCount)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-center">
            <p className="text-white/60 text-[10px] uppercase tracking-wide mb-1">User Rating</p>
            <p className="text-white text-lg font-semibold">4.9 ★</p>
          </div>
        </div>

        {/* Desktop: Glassmorphic Stats Cards - positioned along light trail lines */}
        {/* Revenue Card - left-center */}
        <div 
          className="hidden md:block absolute bottom-24 left-[20%] z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3"
          style={{ transform: 'rotate(-6deg)' }}
        >
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Revenue Analyzed</p>
          <p className="text-white text-2xl font-semibold">
            {statsLoading ? '...' : formatCurrency(liveStats.totalRevenue)}
          </p>
        </div>

        {/* Users Card - right side */}
        <div 
          className="hidden md:block absolute bottom-36 right-[12%] z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3"
          style={{ transform: 'rotate(5deg)' }}
        >
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Active Users</p>
          <p className="text-white text-2xl font-semibold">
            {statsLoading ? '...' : formatUsers(liveStats.userCount)}
          </p>
        </div>

        {/* Star Rating Card - center-right */}
        <div 
          className="hidden md:block absolute bottom-28 left-[55%] z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3"
          style={{ transform: 'rotate(2deg)' }}
        >
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">User Rating</p>
          <p className="text-white text-2xl font-semibold">4.9 ★</p>
        </div>
      </section>

      {/* Section 4: Integrations */}
      <section ref={section5Reveal.ref} className="py-12 md:py-16 px-4 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa]">
        <div className="max-w-4xl mx-auto relative md:min-h-[450px]">
          
          {/* Central Content - Header first on mobile */}
          <div className="flex flex-col items-center justify-start md:pt-12 md:pb-32 py-4 md:py-8 px-4 md:px-8">
            <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-3 md:mb-6 leading-tight text-center`}>
              <span className={`inline-block ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>Finlo</span>{' '}
              <span className={`inline-block ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '160ms', animationFillMode: 'forwards', opacity: 0 }}>integrates</span>{' '}
              <span className={`inline-block ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '220ms', animationFillMode: 'forwards', opacity: 0 }}>with</span>
              <br />
              <span className={`inline-block italic ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>what</span>{' '}
              <span className={`inline-block italic ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '360ms', animationFillMode: 'forwards', opacity: 0 }}>you</span>{' '}
              <span className={`inline-block italic ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '420ms', animationFillMode: 'forwards', opacity: 0 }}>already</span>{' '}
              <span className={`inline-block italic ${section5Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '480ms', animationFillMode: 'forwards', opacity: 0 }}>use</span>
            </h2>
            
            <p className={`text-sm md:text-base lg:text-lg text-white/80 mb-6 md:mb-8 max-w-md mx-auto text-center ${section5Reveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '550ms', animationFillMode: 'forwards', opacity: 0 }}>
              Accounting tools. Payment tools. Spreadsheets.<br className="hidden sm:block" />
              If it has your data, we can connect to it.
            </p>
          </div>
          
          {/* MOBILE: 2x2 Grid of integration cards - after header */}
          <div className="md:hidden grid grid-cols-2 gap-3 mb-6 max-w-[200px] mx-auto">
            <div 
              className="w-20 h-20 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl flex items-center justify-center"
              style={{ transform: 'rotate(-2deg)' }}
            >
              <img src={quickbooksLogo} alt="QuickBooks" className="w-10 h-10 object-contain" />
            </div>
            <div 
              className="w-20 h-20 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl flex items-center justify-center"
              style={{ transform: 'rotate(1.5deg)' }}
            >
              <img src={xeroLogo} alt="Xero" className="w-10 h-10 object-contain" />
            </div>
            <div 
              className="w-20 h-20 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl flex items-center justify-center"
              style={{ transform: 'rotate(-1deg)' }}
            >
              <img src={waveLogo} alt="Wave" className="w-10 h-10 object-contain" />
            </div>
            <div 
              className="w-20 h-20 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl flex items-center justify-center"
              style={{ transform: 'rotate(2deg)' }}
            >
              <img src={zohoLogo} alt="Zoho" className="w-10 h-10 object-contain" />
            </div>
          </div>
          
          {/* CTA Button - Mobile */}
          <div className="md:hidden flex justify-center mb-4">
            <Button 
              className="bg-white hover:bg-gray-100 text-blue-700 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg"
              onClick={() => navigate('/auth')}
            >
              Try our integrations free
            </Button>
          </div>
          
          {/* DESKTOP: Semi-circle arc at bottom */}
          {/* QuickBooks - outer left, higher */}
          <div 
            className="hidden md:flex absolute bottom-16 left-[10%] w-24 h-24 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl items-center justify-center pointer-events-none"
            style={{ transform: 'rotate(-3deg)' }}
          >
            <img src={quickbooksLogo} alt="QuickBooks" className="w-14 h-14 object-contain" />
          </div>
          
          {/* Xero - inner left, lower */}
          <div 
            className="hidden md:flex absolute bottom-4 left-[28%] w-24 h-24 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl items-center justify-center pointer-events-none isolate will-change-transform"
            style={{ transform: 'rotate(1.5deg) translateZ(0)' }}
          >
            <img src={xeroLogo} alt="Xero" className="w-14 h-14 object-contain" />
          </div>
          
          {/* Wave - inner right, lower */}
          <div 
            className="hidden md:flex absolute bottom-4 right-[28%] w-24 h-24 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl items-center justify-center pointer-events-none"
            style={{ transform: 'rotate(-1deg)' }}
          >
            <img src={waveLogo} alt="Wave" className="w-14 h-14 object-contain" />
          </div>
          
          {/* Zoho - outer right, higher */}
          <div 
            className="hidden md:flex absolute bottom-16 right-[10%] w-24 h-24 bg-white/15 backdrop-blur-2xl border border-white/30 rounded-3xl items-center justify-center pointer-events-none"
            style={{ transform: 'rotate(2deg)' }}
          >
            <img src={zohoLogo} alt="Zoho" className="w-14 h-14 object-contain" />
          </div>
          
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" ref={testimonialReveal.ref} className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-[#e8f0fc] via-[#c5d9f5] to-[#a8c4f5] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-2">
              <span className={`inline-block ${testimonialReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>Why</span>{' '}
              <span className={`inline-block ${testimonialReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '160ms', animationFillMode: 'forwards', opacity: 0 }}>Startups</span>{' '}
              <span className={`inline-block ${testimonialReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '220ms', animationFillMode: 'forwards', opacity: 0 }}>and</span>{' '}
              <span className={`inline-block ${testimonialReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '280ms', animationFillMode: 'forwards', opacity: 0 }}>SMBs</span>{' '}
              <span className={`inline-block ${testimonialReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '340ms', animationFillMode: 'forwards', opacity: 0 }}>love</span>{' '}
              <span className={`inline-block ${testimonialReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards', opacity: 0 }}>Finlo.</span>
            </h2>
            <p className={`font-serif text-xl sm:text-2xl md:text-3xl text-[#3b82f6] ${testimonialReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '450ms', animationFillMode: 'forwards', opacity: 0 }}>
              Yes, love. (Really.)
            </p>
          </div>

          {/* Testimonial Cards Container */}
          <div className="relative px-0 md:px-16 lg:px-20">
            {/* Navigation Arrows - Desktop - positioned outside cards */}
            <button 
              onClick={prevTestimonial}
              className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/80 backdrop-blur-xl border border-white/50 rounded-full items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all ${testimonialReveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`}
              style={{ animationDelay: '600ms', animationFillMode: 'forwards', opacity: 0 }}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button 
              onClick={nextTestimonial}
              className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/80 backdrop-blur-xl border border-white/50 rounded-full items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all ${testimonialReveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`}
              style={{ animationDelay: '650ms', animationFillMode: 'forwards', opacity: 0 }}
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>

            {/* Cards Container with overflow hidden for slide effect */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentTestimonialIndex * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index}
                    className="w-full flex-shrink-0 px-2 md:px-0"
                  >
                    {/* Desktop: Show 2 cards */}
                    <div className="hidden md:grid md:grid-cols-2 gap-6 md:gap-8">
                      {/* Card 1 */}
                      <div 
                        className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ${testimonialReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`}
                        style={{ 
                          animationDelay: '500ms', 
                          animationFillMode: 'forwards', 
                          opacity: 0 
                        }}
                      >
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                          &ldquo;{testimonials[index].title}&rdquo;
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                          {testimonials[index].quote}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonials[index].color} flex items-center justify-center text-white font-semibold text-sm`}>
                            {testimonials[index].initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{testimonials[index].author}</p>
                            <p className="text-gray-500 text-xs">{testimonials[index].role}</p>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ${testimonialReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`}
                        style={{ 
                          animationDelay: '600ms', 
                          animationFillMode: 'forwards', 
                          opacity: 0 
                        }}
                      >
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                          &ldquo;{testimonials[(index + 1) % testimonials.length].title}&rdquo;
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                          {testimonials[(index + 1) % testimonials.length].quote}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonials[(index + 1) % testimonials.length].color} flex items-center justify-center text-white font-semibold text-sm`}>
                            {testimonials[(index + 1) % testimonials.length].initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{testimonials[(index + 1) % testimonials.length].author}</p>
                            <p className="text-gray-500 text-xs">{testimonials[(index + 1) % testimonials.length].role}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile: Show 1 card */}
                    <div 
                      className={`md:hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ${testimonialReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`}
                      style={{ 
                        animationDelay: '500ms', 
                        animationFillMode: 'forwards', 
                        opacity: 0 
                      }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        &ldquo;{testimonial.title}&rdquo;
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        {testimonial.quote}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-semibold text-xs`}>
                          {testimonial.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{testimonial.author}</p>
                          <p className="text-gray-500 text-xs">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className={`flex justify-center gap-2 mt-8 ${testimonialReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '700ms', animationFillMode: 'forwards', opacity: 0 }}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonialIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentTestimonialIndex === index 
                      ? 'bg-gray-800 w-6' 
                      : 'bg-gray-400/50 hover:bg-gray-500 w-2.5'
                  }`}
                />
              ))}
            </div>

            {/* Mobile Navigation - positioned below dots */}
            <div className="flex md:hidden justify-center gap-4 mt-4">
              <button 
                onClick={prevTestimonial}
                className="w-10 h-10 bg-white/80 backdrop-blur-xl border border-white/50 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button 
                onClick={nextTestimonial}
                className="w-10 h-10 bg-white/80 backdrop-blur-xl border border-white/50 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={section6Reveal.ref} className="py-16 md:py-24 lg:py-32 bg-gradient-to-t from-slate-900 to-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Finlo Logo */}
          <img src={finloLogoWhite} alt="Finlo" className={`h-8 md:h-10 lg:h-12 mx-auto mb-6 md:mb-8 ${section6Reveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }} />
          
          {/* Headline */}
          <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-3 md:mb-4 leading-tight px-2`}>
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>Stop</span>{' '}
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '260ms', animationFillMode: 'forwards', opacity: 0 }}>juggling</span>{' '}
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '320ms', animationFillMode: 'forwards', opacity: 0 }}>spreadsheets.</span>{' '}
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '380ms', animationFillMode: 'forwards', opacity: 0 }}>Start</span>{' '}
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '440ms', animationFillMode: 'forwards', opacity: 0 }}>understanding</span>{' '}
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '500ms', animationFillMode: 'forwards', opacity: 0 }}>your</span>{' '}
            <span className={`inline-block ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '560ms', animationFillMode: 'forwards', opacity: 0 }}>finances.</span>{' '}
            <span className={`inline-block text-indigo-400 ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '620ms', animationFillMode: 'forwards', opacity: 0 }}>Try</span>{' '}
            <span className={`inline-block text-indigo-400 ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '680ms', animationFillMode: 'forwards', opacity: 0 }}>Finlo</span>{' '}
            <span className={`inline-block text-indigo-400 ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '740ms', animationFillMode: 'forwards', opacity: 0 }}>for</span>{' '}
            <span className={`inline-block text-indigo-400 ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '800ms', animationFillMode: 'forwards', opacity: 0 }}>free</span>{' '}
            <span className={`inline-block text-indigo-400 ${section6Reveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '860ms', animationFillMode: 'forwards', opacity: 0 }}>today.</span>
          </h2>
          
          {/* Subtitle */}
          <p className={`text-slate-400 text-base md:text-lg lg:text-xl mb-8 md:mb-10 max-w-2xl mx-auto px-2 ${section6Reveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '900ms', animationFillMode: 'forwards', opacity: 0 }}>
            Sign up, connect your data, and get AI-powered insights within minutes.
          </p>
          
          {/* Buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center ${section6Reveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{ animationDelay: '1000ms', animationFillMode: 'forwards', opacity: 0 }}>
            <Button 
              className="bg-white hover:bg-gray-100 text-gray-900 rounded-lg px-6 md:px-8 py-4 md:py-5 text-sm md:text-base font-medium min-w-[160px] sm:min-w-[180px]"
              onClick={() => navigate('/auth')}
            >
              Get started free
            </Button>
            <Button 
              className="border border-white/30 bg-transparent text-white hover:bg-white/10 rounded-lg px-6 md:px-8 py-4 md:py-5 text-sm md:text-base font-medium min-w-[160px] sm:min-w-[180px]"
              onClick={() => window.open('https://calendar.app.google/PWqhmizMxqUnRNpP9', '_blank')}
            >
              Book a demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Signup Popup - Glassmorphism Style */}
      <Dialog open={showSignupPopup} onOpenChange={setShowSignupPopup}>
        <DialogContent className="bg-slate-800/40 backdrop-blur-xl border border-white/10 text-white max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-serif text-center text-white">
              Let's Answer That Question
            </DialogTitle>
            <DialogDescription className="text-center text-slate-300 mt-2">
              {getPersonalizedMessage()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {lastQuery && <div className="bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600/50">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Your question</p>
                <p className="text-white text-sm">"{lastQuery}"</p>
              </div>}
            
            <p className="text-slate-300 text-sm text-center">
              Create a free account to get AI-powered insights.
            </p>
            
            <div className="space-y-3">
              <Button variant="hero" className="w-full rounded-full py-6 text-base font-medium" onClick={() => navigate('/auth')}>
                Create Free Account
              </Button>
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50" onClick={() => setShowSignupPopup(false)}>
                Maybe later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Hpt1;