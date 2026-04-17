import DocsLayout from "@/components/docs/DocsLayout";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does Vesta keep my data secure?",
    answer: "Your data is encrypted at rest and in transit using TLS 1.3. We use Supabase infrastructure with row-level security so your hotel's data is always isolated from other properties. Access is role-based — owners, managers, and viewers have different permission levels."
  },
  {
    question: "Which integrations does Vesta support?",
    answer: "Vesta connects to Mews PMS and QuickBooks Online today. CSV import is available for any PMS or accounting system. We're actively adding Cloudbeds, Opera, and OTA channel feeds. If your system isn't listed, use the CSV import or contact us — we prioritize integrations based on customer demand."
  },
  {
    question: "How accurate is the AI financial analysis?",
    answer: "Accuracy improves with data coverage. With 30+ days of daily metrics and connected PMS data, Vesta's briefings and anomaly detection are highly reliable. The AI uses your actual RevPAR, ADR, GOPPAR, and expense data — not industry benchmarks — so insights reflect your specific property."
  },
  {
    question: "Can I export my data?",
    answer: "Yes. You can download your daily metrics, expenses, and revenue data as CSV at any time from the dashboard. Your data is always yours."
  },
  {
    question: "What's included in each plan?",
    answer: "Starter ($299/mo) covers 1–2 properties with full dashboard, AI daily briefings, anomaly alerts, and one PMS connection. Growth ($799/mo per property) adds benchmarking, forecasting, multi-PMS support, and partner marketplace recommendations. Enterprise is custom for 15+ properties."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel anytime from your account settings. Your data remains accessible until the end of your billing period and you can export everything before the account closes."
  },
  {
    question: "Does Vesta support multiple properties?",
    answer: "Yes. Growth and Enterprise plans support multi-property portfolios. Each property has its own dashboard and data, with a portfolio-level view for owners and asset managers who oversee multiple hotels."
  },
  {
    question: "How often does Mews sync?",
    answer: "Once connected, Mews syncs daily metrics automatically. You can also trigger a manual sync any time from the Integrations page. QuickBooks expense data syncs on demand via the Sync button."
  }
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-vesta-navy/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-white p-4 text-left transition-colors hover:bg-vesta-mist/25"
      >
        <span className="font-medium text-vesta-navy">{question}</span>
        <ChevronDown className={`h-5 w-5 text-vesta-navy/65 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="border-t border-vesta-navy/10 bg-vesta-mist/25 p-4">
          <p className="text-vesta-navy/80">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  return (
    <DocsLayout
      title="Frequently Asked Questions"
      description="Common questions about using Vesta CFO."
    >
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>

      <div className="mt-12 border border-vesta-navy/10 bg-white rounded-xl p-6 text-center">
        <h3 className="mb-2 font-semibold text-vesta-navy">Still have questions?</h3>
        <p className="mb-4 text-vesta-navy/80">Reach out — we respond fast.</p>
        <a
          href="mailto:svar@vesta.ai"
          className="inline-block rounded-lg bg-vesta-gold px-6 py-2 font-medium text-vesta-navy transition-colors hover:bg-vesta-gold/90"
        >
          Contact the team
        </a>
      </div>
    </DocsLayout>
  );
};

export default FAQ;
