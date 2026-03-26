import { Link } from 'react-router-dom';
import { Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const Support = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header variant="dark" />

      <div className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-white leading-tight mb-4 md:mb-6 tracking-tight">
              Support Center
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
              We're here to help you get the most out of Finlo.
            </p>
          </div>
          
          {/* Support Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 md:p-8 rounded-2xl hover:border-slate-700 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Email Support</h2>
              </div>
              <p className="text-slate-400 mb-6">
                Get help with technical issues or general questions about Finlo. We typically respond within 24 hours.
              </p>
              <a 
                href="mailto:support@joinfinlo.ai" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                support@joinfinlo.ai
              </a>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 md:p-8 rounded-2xl hover:border-slate-700 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mr-4">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Live Chat</h2>
              </div>
              <p className="text-slate-400 mb-6">
                Chat with our AI assistant for instant answers, or get connected to our support team.
              </p>
              <Link 
                to="/chat" 
                className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Start Chat →
              </Link>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 md:p-8 rounded-2xl hover:border-slate-700 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Documentation</h2>
              </div>
              <p className="text-slate-400 mb-6">
                Browse our comprehensive docs for guides, tutorials, and answers to common questions.
              </p>
              <Link 
                to="/docs" 
                className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Visit Documentation →
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-xl">
                <h3 className="font-semibold text-white mb-2 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-slate-400" />
                  Is Finlo a financial advisor?
                </h3>
                <p className="text-slate-400">
                  No. Finlo is not a registered financial advisor, broker, or investment firm. Our AI provides data analysis and insights for informational purposes only. Always consult with qualified financial professionals before making important business or investment decisions.
                </p>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-xl">
                <h3 className="font-semibold text-white mb-2 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-slate-400" />
                  How secure is my financial data?
                </h3>
                <p className="text-slate-400">
                  Your data is encrypted at rest and in transit using industry-standard AES-256 encryption. We follow SOC 2 security practices and never share your data with third parties.
                </p>
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-xl">
                <h3 className="font-semibold text-white mb-2 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-slate-400" />
                  What file formats do you support?
                </h3>
                <p className="text-slate-400">
                  We support Excel (.xlsx, .xls), CSV, PDF financial statements, and direct integrations with QuickBooks, Xero, Wave, and Zoho Books.
                </p>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-xl">
                <h3 className="font-semibold text-white mb-2 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-slate-400" />
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-slate-400">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 md:p-12">
            <Mail className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
            <p className="text-slate-400 mb-6">
              Our team is happy to help with anything not covered above.
            </p>
            <a 
              href="mailto:support@joinfinlo.ai"
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
