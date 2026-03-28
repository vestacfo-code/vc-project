import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const StepByStepGuide = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Visit vesta.ai",
      description: "Navigate to our homepage to get started.",
      image: "/assets/5a419f92-d3d0-427f-a7b9-c9b2831afe31.png",
      details: "Start your journey by visiting our main website where you can learn about our AI-powered financial insights platform."
    },
    {
      number: 2,
      title: "Create Your Account",
      description: "Click Login at the top right, then click 'Click here to create an account' and enter your details.",
      image: "/assets/416182e4-fa07-422b-85bc-af980dccf579.png",
      details: "Enter your first name, last name, email address, and create a secure password for your new account."
    },
    {
      number: 3,
      title: "Confirm Your Email",
      description: "Check your email inbox for a message titled 'Confirm Your Account' and click 'Confirm Email'.",
      image: "/assets/a190eaa8-2cbc-4287-b974-6f83072292ed.png",
      details: "You'll receive an email verification message to ensure your account security. Click the confirmation button to verify your email address."
    },
    {
      number: 4,
      title: "Sign In to Your Account",
      description: "Return to vesta.ai and click Login to sign in with your new account credentials.",
      image: "/assets/213eee80-97a9-46a5-adcc-16ea2a790b37.png",
      details: "Enter the email and password you created in step 2 to access your new Vesta account."
    },
    {
      number: 5,
      title: "Begin Onboarding",
      description: "Click 'Sign In' and then 'Continue' to start the personalized onboarding process.",
      image: "/assets/d69a8f92-db68-4d4e-8274-42d11537d5ff.png",
      details: "We'll ask you a few quick questions to personalize your AI CFO and set up your dashboard for maximum effectiveness."
    },
    {
      number: 6,
      title: "Select Your Payment Plan",
      description: "Choose the plan that best fits your business needs.",
      image: "/assets/c6fd9404-ba1f-44b6-87fd-340a1f93e8a8.png",
      details: "Select from our flexible pricing options. Start with the free Founder plan or choose a paid plan for more credits and advanced features."
    },
    {
      number: 7,
      title: "Apply Your Discount Code (Optional)",
      description: "Have a discount code? Scroll to the bottom of the pricing page and click 'Have a discount code? Click here'.",
      image: "/assets/8594261b-8d73-43fd-a47d-b0ba3cabb794.png",
      details: "Enter your discount code and prices will automatically adjust. If your code provides a complimentary account, you'll be taken directly to your dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/10 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Getting Started with Vesta
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Follow these simple steps to create your account and start understanding your business like never before
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-16">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className={`${index % 2 === 0 ? 'order-1' : 'order-2'}`}>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {step.number}
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-primary mb-4 font-medium">{step.description}</p>
                  <p className="text-gray-300 leading-relaxed">{step.details}</p>
                </div>
                <div className={`${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                    <img 
                      src={step.image} 
                      alt={`Step ${step.number}: ${step.title}`}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 pt-16 border-t border-white/20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of small businesses already using Vesta to gain AI-powered insights from their financial data.
          </p>
          <Button 
            size="lg" 
            variant="hero"
            onClick={() => window.open('https://vesta.ai', '_blank')}
            className="text-lg px-8 py-4"
          >
            Get Started for Free
          </Button>
          <p className="text-sm text-gray-400 mt-4">Free Founder plan available forever • Upgrade anytime • 30-day money-back guarantee on annual plans</p>
        </div>
      </div>
    </div>
  );
};

export default StepByStepGuide;