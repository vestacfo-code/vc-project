import { Link } from 'react-router-dom';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gradient section wrapper */}
      <div className="relative flex-1">
        {/* Purple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff]" />
        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
      
        <div className="relative z-10">
          <Header />
          
          <div className="container mx-auto px-4 py-16 max-w-4xl">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-gray-900 leading-tight mb-4 md:mb-6 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-gray-600 text-lg">
                Last updated: January 2025
              </p>
            </div>
            
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <div className="prose prose-gray max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Collection</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We collect only the information necessary to provide our financial analysis services. 
                    This includes financial data you upload, account information (email, name), and usage data 
                    to improve our service. We never collect more data than we need.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Your financial data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. 
                    We use industry-standard security measures to protect your information, including regular 
                    security audits and secure cloud infrastructure.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Usage</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We use your data solely to provide financial analysis and insights. 
                    We do not sell or share your personal data with third parties for marketing purposes.
                    Your financial data is never used to train our AI models.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
                  <p className="text-gray-600 leading-relaxed">
                    You have the right to access, correct, or delete your personal data at any time.
                    You can export your data or request complete account deletion through your settings 
                    or by contacting our support team.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We use essential cookies to maintain your session and preferences. 
                    We may use analytics cookies to understand how our service is used, 
                    but these can be disabled in your browser settings.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                  <p className="text-gray-600 leading-relaxed">
                    If you have any questions about our privacy practices, please contact us at{' '}
                    <a href="mailto:privacy@vesta.ai" className="text-gray-900 font-medium hover:underline">
                      privacy@vesta.ai
                    </a>
                  </p>
                </section>
              </div>
            </div>

            {/* Note */}
            <div className="mt-8 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-6 text-center">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> This is a simplified privacy policy. 
                A complete privacy policy will be developed as the service evolves.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Privacy;
