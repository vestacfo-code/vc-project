import DocsLayout from "@/components/docs/DocsLayout";

const tableOfContents = [
  { title: "Getting Started Right", href: "#start" },
  { title: "Daily Habits", href: "#daily" },
  { title: "Monthly Reviews", href: "#monthly" },
  { title: "Team Collaboration", href: "#team" },
];

const BestPractices = () => {
  return (
    <DocsLayout 
      title="Best Practices" 
      description="Get the most out of Vesta with these recommended practices."
      tableOfContents={tableOfContents}
      nextPage={{ href: "/docs/learn/faq", title: "FAQ" }}
    >
      <section id="start" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Getting Started Right</h2>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li><strong className="text-white">Connect all accounts:</strong> The more data, the better your insights</li>
          <li><strong className="text-white">Import historical data:</strong> At least 12 months for accurate trends</li>
          <li><strong className="text-white">Set up your profile:</strong> Industry and business info improves AI accuracy</li>
          <li><strong className="text-white">Schedule reports:</strong> Automate your weekly financial review</li>
        </ol>
      </section>

      <section id="daily" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Daily Habits</h2>
        <p className="text-slate-400 mb-4">
          Quick daily actions for financial awareness:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Check your dashboard intelligence cards for key insights</li>
          <li>Review cash balance and recent transactions</li>
          <li>Ask the AI about anything unusual</li>
          <li>Categorize any uncategorized transactions</li>
        </ul>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mt-4">
          <p className="text-sm text-slate-400">
            ⏱️ <strong className="text-white">Time spent:</strong> 2-5 minutes per day
          </p>
        </div>
      </section>

      <section id="monthly" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Monthly Reviews</h2>
        <p className="text-slate-400 mb-4">
          Monthly financial health check:
        </p>
        <ol className="list-decimal list-inside text-slate-400 space-y-3">
          <li>Review the monthly P&L report</li>
          <li>Compare to previous month and same month last year</li>
          <li>Check cash flow forecast for next 90 days</li>
          <li>Update any assumptions or projections</li>
          <li>Set goals for the coming month</li>
        </ol>
      </section>

      <section id="team" className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Team Collaboration</h2>
        <p className="text-slate-400 mb-4">
          Work effectively with your team:
        </p>
        <ul className="list-disc list-inside text-slate-400 space-y-2">
          <li>Invite team members with appropriate permissions</li>
          <li>Share reports automatically via email</li>
          <li>Use comments to discuss specific transactions</li>
          <li>Create shared dashboards for different teams</li>
        </ul>
      </section>
    </DocsLayout>
  );
};

export default BestPractices;
