import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "What You Can Ask", href: "#ask" },
  { title: "Example Questions", href: "#examples" },
  { title: "How It Works", href: "#how" },
  { title: "Tips", href: "#tips" },
];

const AIChat = () => {
  return (
    <DocsLayout 
      title="AI Financial Chat" 
      description="Ask questions about your finances in plain English and get instant answers."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/features/analytics", title: "Dashboard Analytics" }}
    >
      <section id="ask" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">What You Can Ask</h2>
        <p className="text-slate-400 mb-4">
          Finlo's AI understands natural language questions about your business:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Revenue and sales performance</li>
          <li>Expense breakdowns and trends</li>
          <li>Cash flow projections</li>
          <li>Profit margins and ratios</li>
          <li>Comparisons between periods</li>
          <li>Anomaly detection and alerts</li>
        </ul>
      </section>

      <section id="examples" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Example Questions</h2>
        <div className="space-y-3">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <p className="text-white">"What was my revenue last month?"</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <p className="text-white">"How do my expenses compare to last quarter?"</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <p className="text-white">"What's my biggest expense category?"</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <p className="text-white">"Will I have enough cash for payroll next month?"</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <p className="text-white">"Show me my profit margin trend over the past year"</p>
          </div>
        </div>
      </section>

      <section id="how" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li>Type your question in the chat interface</li>
          <li>Finlo's AI analyzes your connected financial data</li>
          <li>Receive an instant, conversational response</li>
          <li>Follow up with more questions for deeper insights</li>
        </ol>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mt-4">
          <p className="text-sm text-slate-400">
            🔒 <strong className="text-white">Privacy:</strong> Your data is encrypted and never shared. AI analysis happens in real-time without storing your questions.
          </p>
        </div>
      </section>

      <section id="tips" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Tips for Better Answers</h2>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Be specific about time periods (e.g., "last month" vs "January 2024")</li>
          <li>Mention categories when asking about expenses or revenue</li>
          <li>Ask follow-up questions to drill down into details</li>
          <li>Use comparison phrases like "compared to" or "versus"</li>
          <li>The more data connected, the better the insights</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default AIChat;
