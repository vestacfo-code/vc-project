import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Create Account", href: "#create" },
  { title: "Verify Email", href: "#verify" },
  { title: "Complete Profile", href: "#profile" },
  { title: "Choose Plan", href: "#plan" },
];

const AccountSetup = () => {
  return (
    <DocsLayout 
      title="Account Setup" 
      description="Get started with your Vesta account in minutes."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/getting-started/tour", title: "Quick Tour" }}
    >
      <section id="create" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Create Your Account</h2>
        <p className="text-slate-400 mb-4">
          Sign up for Vesta using your email address or Google account:
        </p>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li>Visit <a href="https://vesta.ai" target="_blank" rel="noopener noreferrer" className="text-[#7ba3e8] hover:underline font-semibold">vesta.ai</a> and click "Get Started"</li>
          <li>Choose to sign up with email or Google</li>
          <li>If using email, create a secure password</li>
          <li>(Optional) Add a referral code if you have one</li>
        </ol>
      </section>

      <section id="verify" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Verify Your Email</h2>
        <p className="text-slate-400 mb-4">
          If you signed up with email, you'll receive a verification link:
        </p>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-400">
            💡 <strong className="text-white">Tip:</strong> Check your spam folder if you don't see the verification email within a few minutes.
          </p>
        </div>
      </section>

      <section id="profile" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Complete Your Profile</h2>
        <p className="text-slate-400 mb-4">
          Help us personalize your experience by providing:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Your name and company name</li>
          <li>Business industry</li>
          <li>Company size</li>
          <li>A brief description of your business (minimum 20 characters) — this helps our AI provide personalized insights to help your company thrive</li>
        </ul>
      </section>

      <section id="plan" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Choose Your Plan</h2>
        <p className="text-slate-400 mb-6">
          Vesta offers four plans designed to grow with your business. Choose the one that fits your needs:
        </p>
        <div className="grid gap-6">
          {/* Founder - Free */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-white font-semibold text-lg">Founder</h4>
              <span className="text-sm text-slate-400">$0 USD/month</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">Perfect for individuals and early-stage businesses getting started</p>
            <ul className="text-sm text-slate-400 space-y-1.5">
              <li>• 30 AI credits per month</li>
              <li>• 5 monthly report downloads</li>
              <li>• Basic financial analysis</li>
              <li>• Email support</li>
            </ul>
          </div>
          
          {/* Scale */}
          <div className="bg-[#1a1a1a] border-2 border-[#7ba3e8]/50 rounded-xl p-5 relative">
            <span className="absolute -top-3 left-4 bg-[#7ba3e8] text-black text-xs font-semibold px-3 py-1 rounded-full">
              Most Popular
            </span>
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-[#7ba3e8] font-semibold text-lg">Scale</h4>
              <span className="text-sm text-slate-400">$25.99 USD/month</span>
            </div>
            <p className="text-sm text-slate-300 mb-4">For growing businesses ready to scale their financial intelligence</p>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#7ba3e8]">✓</span>
                <span><strong className="text-white">150 AI credits per month</strong> – 5x more queries for deeper insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7ba3e8]">✓</span>
                <span><strong className="text-white">25 monthly report downloads</strong> – Export more financial reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7ba3e8]">✓</span>
                <span><strong className="text-white">Advanced financial analysis</strong> – Deeper insights and trend detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7ba3e8]">✓</span>
                <span><strong className="text-white">Priority email support</strong> – Faster response times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7ba3e8]">✓</span>
                <span><strong className="text-white">Up to 2 team collaborators</strong> – Work together on finances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7ba3e8]">✓</span>
                <span><strong className="text-white">Credit add-ons available</strong> – Purchase more credits as needed</span>
              </li>
            </ul>
          </div>
          
          {/* CFO */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-white font-semibold text-lg">CFO</h4>
              <span className="text-sm text-slate-400">$39.99 USD/month</span>
            </div>
            <p className="text-sm text-slate-300 mb-4">For established businesses needing comprehensive financial oversight</p>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">250 AI credits per month</strong> – Maximum AI-powered analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Unlimited report downloads</strong> – No limits on exports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Advanced analysis & forecasting</strong> – Predictive insights for planning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Priority support</strong> – Top-tier assistance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Up to 6 team collaborators</strong> – Larger team access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Credit add-ons available</strong> – Scale as you grow</span>
              </li>
            </ul>
          </div>
          
          {/* Enterprise */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-white font-semibold text-lg">Enterprise</h4>
              <span className="text-sm text-slate-400">Custom USD pricing</span>
            </div>
            <p className="text-sm text-slate-300 mb-4">For large organizations with custom requirements</p>
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Custom AI credits</strong> – Tailored to your usage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Unlimited report downloads</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Custom team collaborators</strong> – Unlimited seats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Dedicated account manager</strong> – Personalized support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">Custom integrations & APIs</strong> – Connect your systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white">✓</span>
                <span><strong className="text-white">SLA guarantee & 24/7 support</strong> – Enterprise-grade reliability</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">
                Contact our sales team for custom pricing tailored to your organization's needs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
};

export default AccountSetup;
