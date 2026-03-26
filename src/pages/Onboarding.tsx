import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowRight, ArrowLeft, Check, Sparkles, Target, Users, Briefcase, TrendingUp, PieChart, AlertCircle, Rocket, ScrollText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import OnboardingBackground from '@/components/OnboardingBackground';
interface OnboardingData {
  companyName: string;
  industry: string;
  companySize: string;
  businessType: string;
  description: string;
  mainGoals: string[];
  currentChallenges: string[];
  experienceLevel: string;
  termsAccepted: boolean;
}
const Onboarding = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    industry: '',
    companySize: '',
    businessType: '',
    description: '',
    mainGoals: [],
    currentChallenges: [],
    experienceLevel: '',
    termsAccepted: false
  });
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  const updateData = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const toggleArrayItem = (field: 'mainGoals' | 'currentChallenges', item: string) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
    }));
  };
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleComplete = async () => {
    if (!user) return;

    // Require terms acceptance
    if (!data.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Service to continue.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        id: user.id,
        user_id: user.id,
        email: user.email,
        company_name: data.companyName,
        industry: data.industry,
        company_size: data.companySize,
        business_type: data.businessType,
        description: data.description,
        terms_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any, {
        onConflict: 'id'
      });
      if (error) throw error;
      toast({
        title: "Welcome to Finlo!",
        description: "You're all set with your free Founder plan."
      });

      // Go directly to chat as a free founder user
      navigate('/chat');
    } catch (error) {
      console.error('Error in handleComplete:', error);
      toast({
        title: "Setup failed",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const steps = [{
    id: 'welcome',
    component: <motion.div initial={{
      opacity: 0,
      scale: 0.9
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      duration: 0.6,
      ease: "easeOut"
    }} className="flex flex-col items-center justify-center min-h-screen text-center space-y-8 px-6">
          <motion.div initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.2,
        duration: 0.5
      }} className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-bold text-gray-900">
                Welcome to Finlo!
              </h1>
              <p className="text-2xl md:text-3xl text-gray-600 max-w-2xl mx-auto font-light">
                Let's set up your personalized financial intelligence platform
              </p>
            </div>
          </motion.div>
          <motion.div initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.4,
        duration: 0.5
      }}>
            <Button onClick={nextStep} size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
  }, {
    id: 'company-name',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-8 px-6">
          <div className="w-full max-w-2xl text-center space-y-8">
            <motion.h1 initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="text-5xl md:text-6xl font-bold text-gray-800">
              What's your company name?
            </motion.h1>
            <motion.div initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="relative glass-card rounded-3xl p-2">
              <Input placeholder="Type your company name..." value={data.companyName} onChange={e => updateData('companyName', e.target.value)} className="text-3xl py-8 text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800 placeholder:text-gray-400" autoFocus onKeyDown={e => {
            if (e.key === 'Enter' && data.companyName.trim()) {
              nextStep();
            }
          }} />
            </motion.div>
            <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3,
          duration: 0.5
        }} className="text-gray-500 text-lg">
              Press <kbd className="px-2 py-1 bg-white/50 rounded text-sm">Enter ↵</kbd>
            </motion.p>
          </div>
        </motion.div>
  }, {
    id: 'industry',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-8 px-6">
          <div className="w-full max-w-3xl text-center space-y-8">
            <motion.h1 initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="text-5xl md:text-6xl font-bold text-gray-800">
              What industry are you in?
            </motion.h1>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Technology', 'Healthcare', 'Finance', 'Retail & E-commerce', 'Manufacturing', 'Consulting', 'Education', 'Real Estate', 'Hospitality', 'Agriculture', 'Other'].map((industry, idx) => <motion.button key={industry} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3 + idx * 0.05,
            duration: 0.3
          }} whileHover={{
            scale: 1.05,
            y: -5
          }} whileTap={{
            scale: 0.95
          }} onClick={() => {
            updateData('industry', industry.toLowerCase().replace(' & ', '-').replace(' ', '-'));
            setTimeout(nextStep, 400);
          }} className="glass-card p-6 text-left rounded-2xl hover:shadow-xl transition-all text-lg font-medium text-gray-800 hover:bg-gray-50">
                  {industry}
                </motion.button>)}
            </motion.div>
          </div>
        </motion.div>
  }, {
    id: 'company-size',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-8 px-6">
          <div className="w-full max-w-2xl text-center space-y-8">
            <motion.h1 initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="text-5xl md:text-6xl font-bold text-gray-800">
              How big is your business?
            </motion.h1>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="space-y-4">
              {[{
            value: '1',
            label: 'Just me (Solo entrepreneur)',
            icon: '👤'
          }, {
            value: '2-10',
            label: '2-10 employees',
            icon: '👥'
          }, {
            value: '11-50',
            label: '11-50 employees',
            icon: '🏢'
          }, {
            value: '51-200',
            label: '51-200 employees',
            icon: '🏬'
          }, {
            value: '200+',
            label: '200+ employees',
            icon: '🏭'
          }].map((option, idx) => <motion.button key={option.value} initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.3 + idx * 0.1,
            duration: 0.3
          }} whileHover={{
            scale: 1.03,
            x: 10
          }} whileTap={{
            scale: 0.98
          }} onClick={() => {
            updateData('companySize', option.value);
            setTimeout(nextStep, 400);
          }} className="w-full glass-card p-6 text-left rounded-2xl hover:shadow-xl transition-all">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{option.icon}</span>
                    <span className="text-xl font-medium text-gray-800">{option.label}</span>
                  </div>
                </motion.button>)}
            </motion.div>
          </div>
        </motion.div>
  }, {
    id: 'business-type',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-8 px-6">
          <div className="w-full max-w-3xl text-center space-y-8">
            <motion.h1 initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="text-5xl md:text-6xl font-bold text-gray-800">
              What type of business?
            </motion.h1>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Startup', 'Small Business', 'Medium Business', 'Enterprise', 'Freelancer/Consultant', 'Non-profit', 'Agency', 'E-commerce'].map((type, idx) => <motion.button key={type} initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.3 + idx * 0.05,
            duration: 0.3
          }} whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={() => {
            updateData('businessType', type.toLowerCase().replace('/', '-').replace(' ', '-'));
            setTimeout(nextStep, 400);
          }} className="glass-card p-6 text-center rounded-2xl hover:shadow-xl transition-all text-xl font-medium text-gray-800 hover:bg-gray-50">
                  {type}
                </motion.button>)}
            </motion.div>
          </div>
        </motion.div>
  }, {
    id: 'goals',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-8 px-6">
          <div className="w-full max-w-4xl text-center space-y-8">
            <motion.h1 initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="text-5xl md:text-6xl font-bold text-gray-800">
              What are your main goals?
            </motion.h1>
            <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="text-xl text-gray-600">
              Select all that apply
            </motion.p>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3,
          duration: 0.5
        }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{
            id: 'increase-revenue',
            label: 'Increase revenue',
            icon: TrendingUp
          }, {
            id: 'reduce-costs',
            label: 'Reduce costs',
            icon: Target
          }, {
            id: 'improve-cashflow',
            label: 'Improve cash flow',
            icon: PieChart
          }, {
            id: 'financial-planning',
            label: 'Better planning',
            icon: Briefcase
          }, {
            id: 'understand-metrics',
            label: 'Understand metrics',
            icon: AlertCircle
          }, {
            id: 'investor-ready',
            label: 'Become investor-ready',
            icon: Rocket
          }, {
            id: 'tax-optimization',
            label: 'Tax optimization',
            icon: Building2
          }, {
            id: 'growth-strategy',
            label: 'Growth strategy',
            icon: Users
          }].map((goal, idx) => {
            const Icon = goal.icon;
            const isSelected = data.mainGoals.includes(goal.id);
            return <motion.button key={goal.id} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4 + idx * 0.05,
              duration: 0.3
            }} whileHover={{
              scale: 1.03
            }} whileTap={{
              scale: 0.97
            }} onClick={() => toggleArrayItem('mainGoals', goal.id)} className={`glass-card p-6 rounded-2xl transition-all ${isSelected ? 'bg-gray-100 shadow-xl border-2 border-gray-800' : 'hover:shadow-lg'}`}>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`} />
                      <span className={`text-lg font-medium ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                        {goal.label}
                      </span>
                      {isSelected && <motion.div initial={{
                  scale: 0
                }} animate={{
                  scale: 1
                }} transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}>
                          <Check className="w-6 h-6 text-gray-900 ml-auto" />
                        </motion.div>}
                    </div>
                  </motion.button>;
          })}
            </motion.div>
            {data.mainGoals.length > 0 && <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.3
        }}>
                <Button onClick={nextStep} size="lg" className="text-lg px-10 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>}
          </div>
        </motion.div>
  }, {
    id: 'description',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-8 px-6">
          <div className="w-full max-w-3xl text-center space-y-8">
            <motion.h1 initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="text-5xl md:text-6xl font-bold text-gray-800">
              Tell us about your business
            </motion.h1>
            <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="text-xl text-gray-600">
              A brief description helps our AI provide better insights (minimum 20 characters)
            </motion.p>
            <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3,
          duration: 0.5
        }} className="relative glass-card rounded-3xl p-6">
              <Textarea placeholder="Describe what your business does, who you serve, and what makes you unique..." value={data.description} onChange={e => updateData('description', e.target.value)} className="text-lg min-h-40 border-0 bg-transparent focus-visible:ring-0 text-gray-800 placeholder:text-gray-400 resize-none" rows={8} />
              <div className="absolute bottom-8 right-8 text-sm font-medium text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                {data.description.trim().length}/20 min
              </div>
            </motion.div>
            {data.description.trim().length >= 20 ? <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.3
        }}>
                <Button onClick={nextStep} size="lg" className="text-lg px-10 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div> : <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="text-sm text-gray-500">
                Please write at least 20 characters to continue
              </motion.p>}
          </div>
        </motion.div>
  }, {
    id: 'terms',
    component: <motion.div initial={{
      opacity: 0,
      x: 50
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -50
    }} transition={{
      duration: 0.4
    }} className="flex flex-col items-center justify-center min-h-screen space-y-6 px-6 py-12">
          <div className="w-full max-w-2xl text-center space-y-6">
            <motion.div initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.1,
          duration: 0.5
        }} className="flex items-center justify-center gap-3">
              <ScrollText className="w-10 h-10 text-gray-700" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                Terms of Service
              </h1>
            </motion.div>
            <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2,
          duration: 0.5
        }} className="text-lg text-gray-600">
              Please review and accept our Terms of Service to continue
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card rounded-2xl p-6 text-left max-h-80 overflow-y-auto"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                if (isAtBottom) setHasScrolledTerms(true);
              }}
            >
              <div className="prose prose-sm prose-gray max-w-none space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">1. Acceptance of Terms</h3>
                <p className="text-gray-600 text-sm">
                  By accessing or using Finlo ("the Service"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Service.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">2. Description of Service</h3>
                <p className="text-gray-600 text-sm">
                  Finlo provides AI-powered financial intelligence and analytics tools designed to help businesses 
                  understand their financial data, generate insights, and make informed decisions.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">3. User Responsibilities</h3>
                <p className="text-gray-600 text-sm">
                  You are responsible for maintaining the confidentiality of your account credentials and for all 
                  activities that occur under your account. You agree to provide accurate and complete information 
                  when creating your account.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">4. Data Privacy</h3>
                <p className="text-gray-600 text-sm">
                  We take your data privacy seriously. Your financial data is encrypted and stored securely. 
                  We do not sell your data to third parties. For more details, please review our Privacy Policy.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">5. Intellectual Property</h3>
                <p className="text-gray-600 text-sm">
                  The Service and its original content, features, and functionality are owned by Finlo and are 
                  protected by international copyright, trademark, and other intellectual property laws.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">6. Limitation of Liability</h3>
                <p className="text-gray-600 text-sm">
                  Finlo provides AI-generated insights for informational purposes only. These insights should not 
                  be considered professional financial, legal, or tax advice. We recommend consulting with qualified 
                  professionals for important financial decisions.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">7. Termination</h3>
                <p className="text-gray-600 text-sm">
                  We reserve the right to terminate or suspend your account at any time for violations of these 
                  Terms of Service or for any other reason at our sole discretion.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800">8. Changes to Terms</h3>
                <p className="text-gray-600 text-sm">
                  We may modify these Terms of Service at any time. Continued use of the Service after changes 
                  constitutes acceptance of the modified terms.
                </p>
                
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <p className="text-xs text-gray-500 italic">
                    Last updated: February 2026. Scroll to the bottom to enable acceptance.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center justify-center gap-3 pt-4"
            >
              <Checkbox 
                id="terms" 
                checked={data.termsAccepted}
                onCheckedChange={(checked) => updateData('termsAccepted', checked === true)}
                disabled={!hasScrolledTerms}
                className="w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
              />
              <label 
                htmlFor="terms" 
                className={`text-sm ${hasScrolledTerms ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}
              >
                I have read and agree to the Terms of Service
              </label>
            </motion.div>
            
            {!hasScrolledTerms && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500"
              >
                Please scroll through the terms above to enable acceptance
              </motion.p>
            )}
            
            {data.termsAccepted && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Button 
                  onClick={nextStep} 
                  size="lg" 
                  className="text-lg px-10 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                >
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
  }, {
    id: 'complete',
    component: <motion.div initial={{
      opacity: 0,
      scale: 0.8
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      duration: 0.6
    }} className="flex flex-col items-center justify-center min-h-screen text-center space-y-8 px-6">
          <motion.div initial={{
        scale: 0
      }} animate={{
        scale: 1
      }} transition={{
        delay: 0.2,
        type: "spring",
        stiffness: 200,
        damping: 15
      }} className="space-y-6">
            <motion.div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl" animate={{
          rotate: [0, 360]
        }} transition={{
          duration: 0.6,
          ease: "easeOut"
        }}>
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <div className="space-y-4">
              <motion.h1 initial={{
            y: 20,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.4,
            duration: 0.5
          }} className="text-6xl md:text-7xl font-bold text-gray-900">
                Perfect!
              </motion.h1>
              <motion.p initial={{
            y: 20,
            opacity: 0
          }} animate={{
            y: 0,
            opacity: 1
          }} transition={{
            delay: 0.5,
            duration: 0.5
          }} className="text-2xl md:text-3xl text-gray-600 max-w-2xl mx-auto font-light">
                Your AI CFO is ready to help you grow your business
              </motion.p>
            </div>
          </motion.div>
          <motion.div initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.6,
        duration: 0.5
      }}>
            <Button onClick={handleComplete} disabled={isSubmitting} size="lg" className="text-lg px-10 py-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl disabled:opacity-50">
              {isSubmitting ? <>
                  <motion.div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-2" animate={{
              rotate: 360
            }} transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }} />
                  Setting up...
                </> : <>
                  Complete Setup <Rocket className="w-6 h-6 ml-2" />
                </>}
            </Button>
          </motion.div>
        </motion.div>
  }];
  const progress = (currentStep + 1) / steps.length * 100;
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <OnboardingBackground />
        <motion.div initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="text-center space-y-6">
          <motion.div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl" animate={{
          rotate: 360
        }} transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}>
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <p className="text-gray-600 text-xl font-medium">Setting up your experience...</p>
        </motion.div>
      </div>;
  }
  return <div className="min-h-screen relative overflow-hidden">
      <OnboardingBackground />
      
      {/* Progress bar */}
      <motion.div className="fixed top-0 left-0 w-full z-50" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }}>
        <Progress value={progress} className="h-1.5 rounded-none bg-white/30" />
      </motion.div>

      {/* Back button */}
      {currentStep > 0 && <motion.button initial={{
      opacity: 0,
      x: -20
    }} animate={{
      opacity: 1,
      x: 0
    }} exit={{
      opacity: 0,
      x: -20
    }} onClick={prevStep} className="fixed top-8 left-8 z-40 p-4 rounded-2xl glass-card hover:shadow-xl transition-all duration-300 hover:scale-110">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </motion.button>}

      {/* Step indicator */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="fixed top-8 right-8 z-40 text-sm font-semibold text-gray-700 glass-card px-5 py-3 rounded-full shadow-lg">
        {currentStep + 1} of {steps.length}
      </motion.div>

      {/* Main content */}
      <div className="px-6">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{
          opacity: 0,
          x: 50
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -50
        }} transition={{
          duration: 0.4
        }}>
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>;
};
export default Onboarding;