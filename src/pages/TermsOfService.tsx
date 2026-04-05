import { Link } from 'react-router-dom';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gradient section wrapper */}
      <div className="relative flex-1">
        {/* Purple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-vesta-cream via-vesta-mist/30 to-vesta-mist/50" />
        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
      
        <div className="relative z-10">
          <Header />
          
          <div className="container mx-auto px-4 py-16 max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-vesta-navy leading-tight mb-4 md:mb-6 tracking-tight">
                Terms of Service
              </h1>
              <p className="text-vesta-navy/80 text-lg">
                Last updated: January 2025 | Version 1.0
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <div className="prose prose-gray max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">1. AI Financial Analysis Disclaimer</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    Vesta provides AI-powered financial analysis and insights for <strong>informational purposes only</strong>. 
                    These analyses, predictions, and recommendations are not professional financial advice and 
                    should not be considered as such. Our AI systems are designed to help you understand your 
                    business financial data, but they cannot replace the expertise of qualified financial professionals.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">2. Accuracy Limitations</h2>
                  <p className="text-vesta-navy/80 leading-relaxed mb-3">
                    AI predictions and analyses may contain inaccuracies or errors. You acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 text-vesta-navy/80 space-y-1">
                    <li>AI-generated insights may be incomplete or incorrect</li>
                    <li>Financial predictions are estimates and not guarantees</li>
                    <li>Market conditions and business circumstances can change rapidly</li>
                    <li>Historical data does not guarantee future performance</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">3. Professional Consultation Recommended</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    Vesta's analysis is designed to give you clear, data-driven insights. While our reports can 
                    guide your decision-making, we recommend consulting with a qualified financial advisor, 
                    accountant, or other professional for major financial decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">4. User Responsibility</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    You are <strong>solely responsible</strong> for all financial decisions made using information 
                    from Vesta. By using our service, you acknowledge that you understand the limitations of 
                    AI analysis and accept full responsibility for your business decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">5. Data Privacy and Security</h2>
                  <p className="text-vesta-navy/80 leading-relaxed mb-3">
                    Your financial data is processed securely using industry-standard encryption. You are responsible for:
                  </p>
                  <ul className="list-disc pl-6 text-vesta-navy/80 space-y-1">
                    <li>The accuracy of data you provide to Vesta</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>Ensuring you have the right to analyze the financial data you provide</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">6. Limitation of Liability</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    Vesta shall not be liable for any direct, indirect, incidental, special, or consequential 
                    damages resulting from the use of our AI analysis, including financial losses, business 
                    interruption, or data loss. Our total liability shall not exceed the amount you paid for 
                    Vesta services in the 12 months preceding the claim.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">7. Service Availability</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    We strive to provide continuous service but cannot guarantee uninterrupted access. 
                    AI analysis features may be updated, modified, or temporarily unavailable without notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">8. Acceptable Use</h2>
                  <p className="text-vesta-navy/80 leading-relaxed mb-3">You agree not to:</p>
                  <ul className="list-disc pl-6 text-vesta-navy/80 space-y-1">
                    <li>Upload data you don't have the right to analyze</li>
                    <li>Use Vesta for illegal activities or regulatory violations</li>
                    <li>Attempt to reverse engineer or compromise our AI systems</li>
                    <li>Share your account access with unauthorized parties</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">9. Termination</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    Either party may terminate this agreement at any time. Upon termination, your access 
                    to Vesta services will cease, and we will delete your data according to our retention policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">10. Changes to Terms</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    These terms may be updated periodically. We will notify you of material changes via email. 
                    Continued use of Vesta after notice constitutes acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-vesta-navy mb-3">11. Contact Information</h2>
                  <p className="text-vesta-navy/80 leading-relaxed">
                    If you have questions about these terms, please contact us at{' '}
                    <a href="mailto:support@vesta.ai" className="text-vesta-navy font-medium hover:underline">
                      support@vesta.ai
                    </a>
                  </p>
                </section>
              </div>
            </div>

            {/* Agreement Note */}
            <div className="mt-8 text-center">
              <p className="text-vesta-navy/65 text-sm">
                By using Vesta's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
