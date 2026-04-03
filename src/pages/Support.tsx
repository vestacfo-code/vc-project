import { Link } from 'react-router-dom';
import { Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const Support = () => {
  return (
    <div className="flex min-h-screen flex-col bg-vesta-cream">
      <Header variant="light" />

      <div className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          {/* Hero Section */}
          <div className="mb-12 text-center md:mb-16">
            <h1 className="mb-4 font-serif text-4xl font-normal leading-tight tracking-tight text-slate-900 sm:text-5xl md:mb-6 md:text-6xl">
              Support Center
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 md:text-xl">
              We're here to help you get the most out of Vesta.
            </p>
          </div>
          
          {/* Support Options */}
          <div className="mb-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 md:p-8">
              <div className="mb-4 flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Email Support</h2>
              </div>
              <p className="mb-6 text-slate-600">
                Get help with technical issues or general questions about Vesta. We typically respond within 24 hours.
              </p>
              <a 
                href="mailto:support@vesta.ai" 
                className="inline-flex items-center font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
              >
                support@vesta.ai
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 md:p-8">
              <div className="mb-4 flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Live Chat</h2>
              </div>
              <p className="mb-6 text-slate-600">
                Chat with our AI assistant for instant answers, or get connected to our support team.
              </p>
              <Link 
                to="/chat" 
                className="inline-flex items-center font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
              >
                Start Chat →
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 md:p-8">
              <div className="mb-4 flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Documentation</h2>
              </div>
              <p className="mb-6 text-slate-600">
                Browse our comprehensive docs for guides, tutorials, and answers to common questions.
              </p>
              <Link 
                to="/docs" 
                className="inline-flex items-center font-medium text-vesta-navy-muted transition-colors hover:text-vesta-gold"
              >
                Visit Documentation →
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900 md:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 flex items-center font-semibold text-slate-900">
                  <HelpCircle className="mr-2 h-5 w-5 text-slate-500" />
                  Is Vesta a financial advisor?
                </h3>
                <p className="text-slate-600">
                  No. Vesta is not a registered financial advisor, broker, or investment firm. Our AI provides data analysis and insights for informational purposes only. Always consult with qualified financial professionals before making important business or investment decisions.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 flex items-center font-semibold text-slate-900">
                  <HelpCircle className="mr-2 h-5 w-5 text-slate-500" />
                  How secure is my financial data?
                </h3>
                <p className="text-slate-600">
                  Your data is encrypted at rest and in transit using industry-standard AES-256 encryption. We follow SOC 2 security practices and never share your data with third parties.
                </p>
              </div>
              
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 flex items-center font-semibold text-slate-900">
                  <HelpCircle className="mr-2 h-5 w-5 text-slate-500" />
                  What file formats do you support?
                </h3>
                <p className="text-slate-600">
                  We support Excel (.xlsx, .xls), CSV, PDF financial statements, and direct integrations with QuickBooks, Xero, Wave, and Zoho Books.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 flex items-center font-semibold text-slate-900">
                  <HelpCircle className="mr-2 h-5 w-5 text-slate-500" />
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-slate-600">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="rounded-2xl border border-vesta-navy/15 bg-gradient-to-br from-white to-vesta-mist/40 p-8 text-center md:p-12">
            <Mail className="mx-auto mb-4 h-12 w-12 text-vesta-navy-muted" />
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Still have questions?</h3>
            <p className="mb-6 text-slate-600">
              Our team is happy to help with anything not covered above.
            </p>
            <a 
              href="mailto:support@vesta.ai"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-gray-900 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Support;
