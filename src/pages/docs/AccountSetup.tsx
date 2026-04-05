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
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Create Your Account</h2>
        <p className="text-vesta-navy-muted mb-4">
          Sign up for Vesta using your email address or Google account:
        </p>
        <ol className="list-decimal list-inside text-vesta-navy-muted space-y-3">
          <li>Visit <a href="https://vesta.ai" target="_blank" rel="noopener noreferrer" className="text-vesta-navy-muted hover:underline font-semibold">vesta.ai</a> and click "Get Started"</li>
          <li>Choose to sign up with email or Google</li>
          <li>If using email, create a secure password</li>
          <li>(Optional) Add a referral code if you have one</li>
        </ol>
      </section>

      <section id="verify" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Verify Your Email</h2>
        <p className="text-vesta-navy-muted mb-4">
          If you signed up with email, you'll receive a verification link:
        </p>
        <div className="border border-vesta-navy/10 bg-white rounded-xl p-4 mb-4">
          <p className="text-sm text-vesta-navy-muted">
            💡 <strong className="text-vesta-navy">Tip:</strong> Check your spam folder if you don't see the verification email within a few minutes.
          </p>
        </div>
      </section>

      <section id="profile" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Complete Your Profile</h2>
        <p className="text-vesta-navy-muted mb-4">
          Help us personalize your experience by providing:
        </p>
        <ul className="list-disc list-inside text-vesta-navy-muted space-y-2">
          <li>Your name and company name</li>
          <li>Business industry</li>
          <li>Company size</li>
          <li>A brief description of your business (minimum 20 characters) — this helps our AI provide personalized insights to help your company thrive</li>
        </ul>
      </section>

      <section id="plan" className="mb-12">
        <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Choose Your Plan</h2>
        <p className="text-vesta-navy-muted mb-6">
          Vesta offers four plans designed to grow with your business. Choose the one that fits your needs:
        </p>
        <div className="grid gap-6">
          {/* Founder - Free */}
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-vesta-navy font-semibold text-lg">Founder</h4>
              <span className="text-sm text-vesta-navy-muted">$0 USD/month</span>
            </div>
            <p className="text-sm text-vesta-navy-muted mb-3">Perfect for individuals and early-stage businesses getting started</p>
            <ul className="text-sm text-vesta-navy-muted space-y-1.5">
              <li>• 30 AI credits per month</li>
              <li>• 5 monthly report downloads</li>
              <li>• Basic financial analysis</li>
              <li>• Email support</li>
            </ul>
          </div>
          
          {/* Scale */}
          <div className="border-2 border-vesta-navy-muted/50 bg-white rounded-xl p-5 relative">
            <span className="absolute -top-3 left-4 bg-vesta-navy-muted text-black text-xs font-semibold px-3 py-1 rounded-full">
              Most Popular
            </span>
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-vesta-navy-muted font-semibold text-lg">Scale</h4>
              <span className="text-sm text-vesta-navy-muted">$25.99 USD/month</span>
            </div>
            <p className="text-sm text-vesta-navy/60 mb-4">For growing businesses ready to scale their financial intelligence</p>
            <ul className="text-sm text-vesta-navy-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy-muted">✓</span>
                <span><strong className="text-vesta-navy">150 AI credits per month</strong> – 5x more queries for deeper insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy-muted">✓</span>
                <span><strong className="text-vesta-navy">25 monthly report downloads</strong> – Export more financial reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy-muted">✓</span>
                <span><strong className="text-vesta-navy">Advanced financial analysis</strong> – Deeper insights and trend detection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy-muted">✓</span>
                <span><strong className="text-vesta-navy">Priority email support</strong> – Faster response times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy-muted">✓</span>
                <span><strong className="text-vesta-navy">Up to 2 team collaborators</strong> – Work together on finances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy-muted">✓</span>
                <span><strong className="text-vesta-navy">Credit add-ons available</strong> – Purchase more credits as needed</span>
              </li>
            </ul>
          </div>
          
          {/* CFO */}
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-vesta-navy font-semibold text-lg">CFO</h4>
              <span className="text-sm text-vesta-navy-muted">$39.99 USD/month</span>
            </div>
            <p className="text-sm text-vesta-navy/60 mb-4">For established businesses needing comprehensive financial oversight</p>
            <ul className="text-sm text-vesta-navy-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">250 AI credits per month</strong> – Maximum AI-powered analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Unlimited report downloads</strong> – No limits on exports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Advanced analysis & forecasting</strong> – Predictive insights for planning</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Priority support</strong> – Top-tier assistance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Up to 6 team collaborators</strong> – Larger team access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Credit add-ons available</strong> – Scale as you grow</span>
              </li>
            </ul>
          </div>
          
          {/* Enterprise */}
          <div className="border border-vesta-navy/10 bg-white rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="text-vesta-navy font-semibold text-lg">Enterprise</h4>
              <span className="text-sm text-vesta-navy-muted">Custom USD pricing</span>
            </div>
            <p className="text-sm text-vesta-navy/60 mb-4">For large organizations with custom requirements</p>
            <ul className="text-sm text-vesta-navy-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Custom AI credits</strong> – Tailored to your usage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Unlimited report downloads</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Custom team collaborators</strong> – Unlimited seats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Dedicated account manager</strong> – Personalized support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">Custom integrations & APIs</strong> – Connect your systems</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-vesta-navy">✓</span>
                <span><strong className="text-vesta-navy">SLA guarantee & 24/7 support</strong> – Enterprise-grade reliability</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-vesta-navy-muted">
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
