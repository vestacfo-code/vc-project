import { Link } from 'react-router-dom';
import { Shield, Lock, Server, CheckCircle2 } from 'lucide-react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const Security = () => {
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
                Security & Trust
              </h1>
              <p className="text-vesta-navy/80 text-lg md:text-xl max-w-2xl mx-auto">
                Your financial data deserves the highest level of protection. Here's how we keep it safe.
              </p>
            </div>
            
            {/* Security Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-vesta-navy mb-2">Data Protection</h3>
                <p className="text-vesta-navy/80 text-sm">
                  Your financial data is encrypted at rest and in transit using AES-256
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-vesta-navy mb-2">Secure Access</h3>
                <p className="text-vesta-navy/80 text-sm">
                  Multi-factor authentication and secure login protocols
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                  <Server className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-vesta-navy mb-2">Infrastructure</h3>
                <p className="text-vesta-navy/80 text-sm">
                  Enterprise-grade cloud infrastructure with 99.9% uptime
                </p>
              </div>
            </div>

            {/* Security Measures */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-8 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <h2 className="text-2xl font-semibold text-vesta-navy mb-6">Security Measures</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'End-to-end encryption for all data transmission',
                  'AES-256 encryption for data at rest',
                  'Regular security audits and penetration testing',
                  'SOC 2 Type II compliance (in progress)',
                  'GDPR and CCPA compliance',
                  'Regular automated backups'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-vesta-navy/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust, vendors & uptime */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-8 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Trust, vendors & uptime</h2>
              <p className="text-vesta-navy/80 mb-4 text-sm leading-relaxed">
                For a list of infrastructure vendors (subprocessors), how to request a DPA, and links to privacy terms, see
                our Trust page. For a high-level view of whether core services are up, see System status.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/trust"
                  className="inline-flex items-center rounded-lg border border-vesta-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-vesta-navy transition-colors hover:border-vesta-gold/40 hover:bg-vesta-gold/10"
                >
                  Trust &amp; subprocessors
                </Link>
                <Link
                  to="/status"
                  className="inline-flex items-center rounded-lg border border-vesta-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-vesta-navy transition-colors hover:border-vesta-gold/40 hover:bg-vesta-gold/10"
                >
                  System status
                </Link>
                <Link
                  to="/privacy"
                  className="inline-flex items-center rounded-lg border border-vesta-navy/15 bg-white px-4 py-2.5 text-sm font-medium text-vesta-navy transition-colors hover:border-vesta-gold/40 hover:bg-vesta-gold/10"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Report Security Issues */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-8 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <h2 className="text-2xl font-semibold text-vesta-navy mb-4">Report Security Issues</h2>
              <p className="text-vesta-navy/80 mb-6">
                If you discover a security vulnerability, please report it to us immediately. We take all reports seriously and will respond promptly.
              </p>
              <a 
                href="mailto:support@vesta.ai"
                className="inline-flex items-center bg-vesta-navy hover:bg-vesta-navy-muted/30 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Report Security Issue
              </a>
            </div>

            {/* Security First CTA */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 md:p-8 text-center text-white">
              <h3 className="font-semibold text-xl mb-2">Security First Approach</h3>
              <p className="text-indigo-100">
                Security is built into every aspect of Vesta. We continuously monitor, 
                update, and improve our security measures to protect your sensitive financial data.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Security;
