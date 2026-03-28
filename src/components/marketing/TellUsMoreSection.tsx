import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Mail } from 'lucide-react';
import { morphSpringSoft } from '@/lib/motion';

const INFO_CHECKLIST = [
  'Property or portfolio name',
  'City / region (and timezone if helpful)',
  'Approximate room count',
  'PMS or how you export data today (CSV, accounting tool, etc.)',
  'What you want to fix first (e.g. daily visibility, owner reports, anomalies)',
  'Optional: phone number for a quick callback',
];

const mailBody = `Hi Vesta team,

Here is a bit more about us — please use this to tailor onboarding or a demo:

Property / portfolio name:
Location:
Room count:
Current PMS or data source:
Top priority (visibility, reporting, alerts, etc.):
Best phone (optional):

Thanks!
`;

const mailHref = `mailto:support@vesta.ai?subject=${encodeURIComponent('Tell you about our property')}&body=${encodeURIComponent(mailBody)}`;

export function TellUsMoreSection({ className = '' }: { className?: string }) {
  return (
    <section className={`py-20 px-6 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={morphSpringSoft}
          className="rounded-3xl border-2 border-slate-200 bg-white shadow-lg shadow-slate-200/50"
        >
          <div className="relative rounded-[22px] bg-slate-50 overflow-hidden p-8 sm:p-12 md:grid md:grid-cols-2 md:gap-12 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold uppercase tracking-wide px-3 py-1 mb-4">
                <ClipboardList className="w-3.5 h-3.5" />
                We don’t know your story yet
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 font-normal leading-tight mb-4">
                Tell us about your property — it helps us help you.
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Every hotel is different. When you reach out, include whatever you can from the list — no pressure to fill
                everything. If something doesn’t apply, skip it. We’ll ask follow-ups only if we need them.
              </p>
              <a
                href={mailHref}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3.5 shadow-md transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email us this info
              </a>
              <p className="mt-4 text-xs text-slate-500">
                Prefer to talk live? Use the{' '}
                <Link to="/contact" className="text-violet-600 hover:underline font-medium">
                  contact page
                </Link>{' '}
                or book a demo from there.
              </p>
            </div>
            <ul className="mt-10 md:mt-0 space-y-3">
              {INFO_CHECKLIST.map((line, i) => (
                <li
                  key={line}
                  className="flex gap-3 text-sm text-slate-700 bg-white/90 backdrop-blur rounded-xl px-4 py-3 border border-slate-100 shadow-sm"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899', '#6366f1'][i % 6],
                    }}
                  >
                    {i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
