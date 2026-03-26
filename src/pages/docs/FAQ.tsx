import DocsLayout from "@/components/docs/DocsLayout";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does Finlo keep my data secure?",
    answer: "Your data is encrypted at rest using AES-256 and in transit using TLS 1.3. We use enterprise-grade infrastructure with SOC 2 Type II compliance. Access is controlled through role-based permissions with complete audit logging."
  },
  {
    question: "Which accounting software does Finlo support?",
    answer: "Finlo integrates with QuickBooks Online, Xero, Wave, and Zoho Books. We're constantly adding new integrations. You can also upload CSV files or enter data manually."
  },
  {
    question: "How accurate is the AI financial analysis?",
    answer: "Accuracy depends on your data quality and volume. With 12+ months of historical data and properly categorized transactions, our AI provides highly accurate insights. Always review AI suggestions as a starting point for decisions."
  },
  {
    question: "Can I export my data from Finlo?",
    answer: "Yes! You can export all your data at any time in CSV, Excel, or PDF format. We believe you should always have full access to your own data."
  },
  {
    question: "Is there a free plan?",
    answer: "Yes, Finlo offers a free plan with basic features for individuals and small businesses. Professional and Enterprise plans unlock additional features like advanced forecasting and team collaboration."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel anytime from your account settings. Your data remains accessible until the end of your billing period, and you can export everything before the account closes."
  },
  {
    question: "Does Finlo support multiple businesses?",
    answer: "Yes! Professional and Enterprise plans support multiple business entities. Each business has its own separate data and analytics."
  },
  {
    question: "How often is my data synced?",
    answer: "Connected accounting software syncs automatically every few hours. You can also trigger a manual sync at any time from your dashboard."
  }
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-[#1a1a1a] hover:bg-[#222] transition-colors"
      >
        <span className="text-white font-medium">{question}</span>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-[#0f0f0f] border-t border-white/10">
          <p className="text-slate-400">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  return (
    <DocsLayout 
      title="Frequently Asked Questions" 
      description="Common questions about using Finlo."
    >
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>

      <div className="mt-12 bg-[#1a1a1a] border border-white/10 rounded-xl p-6 text-center">
        <h3 className="text-white font-semibold mb-2">Still have questions?</h3>
        <p className="text-slate-400 mb-4">Our support team is here to help.</p>
        <a 
          href="mailto:support@joinfinlo.ai" 
          className="inline-block bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </DocsLayout>
  );
};

export default FAQ;
