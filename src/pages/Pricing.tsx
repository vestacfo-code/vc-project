import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronDown, Sliders } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollReveal } from '@/hooks/useScrollReveal';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const Pricing = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isAnnual, setIsAnnual] = useState(true);
  
  // Scroll-triggered animations
  const enterpriseReveal = useScrollReveal({ threshold: 0.15 });
  const faqReveal = useScrollReveal({ threshold: 0.1 });

  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (tier: 'scale' | 'ceo') => {
    if (!session) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { tier, isAnnual }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error(error.message || 'Failed to open customer portal');
    }
  };

  const handleFounderAccess = async () => {
    if (!session) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    setLoading('founder');
    try {
      const { error } = await supabase.functions.invoke('activate-founder', {
        body: { userId: session.user.id }
      });
      if (error) throw error;
      toast.success('Founder access activated! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error activating founder access:', error);
      toast.error(error.message || 'Failed to activate founder access');
    } finally {
      setLoading(null);
    }
  };

  const founderFeatures = ["30 AI credits per month", "5 monthly report downloads", "Basic financial analysis", "Email support"];
  const scaleFeatures = ["150 AI credits per month", "25 monthly report downloads", "Advanced financial analysis", "Priority email support", "Up to 2 team collaborators", "Credit add-ons available"];
  const ceoFeatures = ["250 AI credits per month", "Unlimited report downloads", "Advanced financial analysis & forecasting", "Priority support", "Up to 6 team collaborators", "Credit add-ons available"];
  const enterpriseFeatures = ["Custom AI credits", "Unlimited report downloads", "Custom team collaborators", "Dedicated account manager", "Custom integrations & APIs", "SLA guarantee & 24/7 support"];

  const getMonthlyPrice = (basePrice: number) => isAnnual ? (basePrice * 0.9).toFixed(2) : basePrice.toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff] flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
      
      <Header />
      
      <div className="relative z-10 flex-1">
        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16 max-w-7xl">
          <div className="text-center mb-12 md:mb-16 px-4">
            {/* NEW Badge Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-sm mb-6 cursor-pointer hover:shadow-md transition-shadow opacity-0 animate-fadeIn" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
              <span className="bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">NEW</span>
              <span className="text-gray-700 text-sm font-medium">Free Plan Starting at $0/mo</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            
            {/* Animated headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-gray-900 leading-tight mb-4 md:mb-6 tracking-tight">
              <span className="inline-block opacity-0 animate-wordReveal" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>Win</span>{' '}
              <span className="inline-block opacity-0 animate-wordReveal" style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}>more</span>{' '}
              <span className="inline-block opacity-0 animate-wordReveal" style={{ animationDelay: '220ms', animationFillMode: 'forwards' }}>with</span>{' '}
              <span className="inline-block italic text-[#1a237e] opacity-0 animate-wordReveal" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>Vesta</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 md:mb-10 max-w-2xl mx-auto opacity-0 animate-fadeIn" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              Plans designed to grow with your business
            </p>

            {/* Annual/Monthly Toggle - Annual first */}
            <div className="opacity-0 animate-fadeIn" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-full mb-3 md:mb-4">
                <button 
                  onClick={() => setIsAnnual(true)} 
                  className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Annual
                </button>
                <button 
                  onClick={() => setIsAnnual(false)} 
                  className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Monthly
                </button>
              </div>
              <p className="text-base md:text-lg text-gray-600 italic font-light">
                Save up to 10% with annual plans
              </p>
            </div>
          </div>

          {/* Pricing Cards - 3 main cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 md:mb-16 max-w-5xl mx-auto opacity-0 animate-fadeIn" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
            {/* Founder Plan */}
            <Card className="relative bg-white/50 backdrop-blur-2xl border border-white/60 rounded-2xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-shadow">
              <CardHeader className="pb-4 pt-6 px-6 flex flex-col">
                {/* Spacer to match POPULAR badge height */}
                <div className="h-7 mb-3"></div>
                <CardTitle className="text-lg font-bold mb-1 text-gray-900">Founder</CardTitle>
                <div className="mb-4 h-[88px]">
                  <div className="mb-1">
                    <span className="text-6xl font-bold tracking-tight text-gray-900">$0</span>
                  </div>
                  <p className="text-sm text-gray-500 h-5">Forever free</p>
                </div>
                {subscription?.tier === 'founder' ? (
                  <Button className="w-full h-11 rounded-lg font-medium border-gray-200" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-11 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium shadow-sm border-none" 
                    onClick={handleFounderAccess} 
                    disabled={loading === 'founder'}
                  >
                    {loading === 'founder' ? 'Activating...' : 'Try for free'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col px-6 pb-8">
                <p className="text-base font-bold text-gray-900">Perfect for getting started.</p>
                <div className="pt-4 border-t border-gray-100/50 flex-1">
                  <p className="text-xs font-semibold text-gray-500 tracking-wide mb-4">Included in all Vesta plans:</p>
                  <ul className="space-y-3">
                    {founderFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-[#0d9488] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Scale Plan - POPULAR */}
            <Card className="relative bg-white/50 backdrop-blur-2xl border-2 border-[#3b82f6] rounded-2xl flex flex-col shadow-[0_8px_32px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.2)] transition-shadow">
              <CardHeader className="pb-4 pt-6 px-6 flex flex-col">
                <Badge className="bg-[#3b82f6] text-white px-3 py-1.5 rounded-full font-semibold text-xs border-none mb-3 w-fit h-7 flex items-center">POPULAR</Badge>
                <CardTitle className="text-lg font-bold mb-1 text-gray-900">Scale</CardTitle>
                <div className="mb-4 h-[88px]">
                  <div className="mb-1">
                    <span className="text-6xl font-bold tracking-tight text-gray-900">${getMonthlyPrice(25.99)}</span>
                  </div>
                  <p className="text-sm text-gray-500 h-5">
                    Per month. Billed {isAnnual ? 'annually' : 'monthly'}.
                  </p>
                </div>
                {subscription?.tier === 'scale' ? (
                  <Button className="w-full h-11 rounded-lg font-medium border-gray-200" variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-11 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium shadow-sm border-none" 
                    onClick={() => handleSubscribe('scale')} 
                    disabled={loading === 'scale'}
                  >
                    {loading === 'scale' ? 'Processing...' : 'Get started'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col px-6 pb-8">
                <p className="text-base font-bold text-gray-900">For growing businesses.</p>
                <div className="pt-4 border-t border-gray-100/50 flex-1">
                  <p className="text-xs font-semibold text-gray-500 tracking-wide mb-4">Everything in Founder plus:</p>
                  <ul className="space-y-3">
                    {scaleFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-[#0d9488] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* CFO Plan */}
            <Card className="relative bg-white/50 backdrop-blur-2xl border border-white/60 rounded-2xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-shadow">
              <CardHeader className="pb-4 pt-6 px-6 flex flex-col">
                {/* Spacer to match POPULAR badge height */}
                <div className="h-7 mb-3"></div>
                <CardTitle className="text-lg font-bold mb-1 text-gray-900">CFO</CardTitle>
                <div className="mb-4 h-[88px]">
                  <div className="mb-1">
                    <span className="text-6xl font-bold tracking-tight text-gray-900">${getMonthlyPrice(39.99)}</span>
                  </div>
                  <p className="text-sm text-gray-500 h-5">
                    Per month. Billed {isAnnual ? 'annually' : 'monthly'}.
                  </p>
                </div>
                {subscription?.tier === 'ceo' ? (
                  <Button className="w-full h-11 rounded-lg font-medium border-gray-200" variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-11 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium shadow-sm border-none" 
                    onClick={() => handleSubscribe('ceo')} 
                    disabled={loading === 'ceo'}
                  >
                    {loading === 'ceo' ? 'Processing...' : 'Get started'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col px-6 pb-8">
                <p className="text-base font-bold text-gray-900">For established businesses.</p>
                <div className="pt-4 border-t border-gray-100/50 flex-1">
                  <p className="text-xs font-semibold text-gray-500 tracking-wide mb-4">Everything in Scale plus:</p>
                  <ul className="space-y-3">
                    {ceoFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-[#0d9488] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enterprise Section - Separate Card */}
          <div ref={enterpriseReveal.ref} className={`max-w-3xl mx-auto mb-16 ${enterpriseReveal.isVisible ? 'animate-floatUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
            <div className="bg-gradient-to-br from-[#ede9ff]/80 via-[#e4dfff]/80 to-[#ddd6ff]/80 backdrop-blur-xl border border-white/40 rounded-2xl p-8 md:p-10 text-center shadow-[0_8px_32px_rgba(139,92,246,0.1)]">
              <div className={`flex justify-center mb-4 ${enterpriseReveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Sliders className="w-6 h-6 text-[#3b82f6]" />
                </div>
              </div>
              <h3 className={`text-2xl font-bold text-gray-900 mb-2 ${enterpriseReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '300ms', animationFillMode: 'forwards', opacity: 0 }}>Custom pricing for large teams</h3>
              <p className={`text-gray-600 mb-6 max-w-md mx-auto ${enterpriseReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '400ms', animationFillMode: 'forwards', opacity: 0 }}>
                Have 10+ users or complex needs? We can help with custom integrations, dedicated support, and enterprise security.
              </p>
              <div className={`flex flex-wrap justify-center gap-4 mb-6 ${enterpriseReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '500ms', animationFillMode: 'forwards', opacity: 0 }}>
                {enterpriseFeatures.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-[#0d9488]" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button 
                className={`bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg px-8 py-3 font-medium shadow-sm ${enterpriseReveal.isVisible ? 'animate-scaleIn' : 'opacity-0'}`}
                style={{ animationDelay: '600ms', animationFillMode: 'forwards', opacity: 0 }}
                onClick={() => window.open('https://calendar.app.google/PWqhmizMxqUnRNpP9', '_blank')}
              >
                Talk to sales
              </Button>
            </div>
          </div>

          {/* FAQs Section */}
          <div ref={faqReveal.ref} className={`max-w-4xl mx-auto mb-12 px-4 ${faqReveal.isVisible ? 'animate-fadeSlideUp' : 'opacity-0'}`} style={{ animationDelay: '100ms', animationFillMode: 'forwards', opacity: 0 }}>
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-gray-900 ${faqReveal.isVisible ? 'animate-wordReveal' : 'opacity-0'}`} style={{ animationDelay: '200ms', animationFillMode: 'forwards', opacity: 0 }}>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  What are AI credits?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">AI credits power your financial analysis and insights. Each action consumes 1 credit: when the AI returns a message, when you upload a document for processing, or when you generate insights or strategic alerts. Credits reset monthly based on your plan and do not roll over.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  Can I upgrade or downgrade my plan?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the charges accordingly.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  What happens if I run out of credits?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">When you run out of credits, the Settings modal will open automatically, allowing you to upgrade your plan or purchase credit add-ons. Scale and CFO plans can purchase additional credits ($10 per 100 credits). Credits reset monthly and do not roll over.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  Is there a free plan?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">Yes! We offer a free Founder plan that's free forever with 30 AI credits per month, 5 monthly report downloads, basic financial analysis, and email support. It's perfect for getting started and exploring Vesta's capabilities.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  How secure is my financial data?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">Your data security is built on AWS's enterprise-grade infrastructure. We use military-grade encryption (AES-256) for data at rest and in transit. We never share your data with third parties.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  Can I add team members?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">Scale plans support up to 2 team collaborators, and CFO plans support up to 6. Enterprise plans offer unlimited team members. Each member gets their own secure login.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  What integrations are available?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">We integrate with QuickBooks, Xero, Wave, Zoho Books, and support manual data uploads (CSV, Excel, PDF). Enterprise plans can request custom integrations.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-6">
                <AccordionTrigger className="text-left text-base sm:text-lg text-gray-900 hover:no-underline">
                  Do you offer refunds?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-left text-gray-600">Yes, we offer a 30-day money-back guarantee on all annual plans. If you're not satisfied, contact us for a full refund within 30 days of purchase.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;
