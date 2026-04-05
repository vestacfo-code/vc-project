import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { computeValuation, ValuationInputs, ValuationResult, BusinessModel } from './valuationEngine';
import { Loader2, Info, Download, Share2, Save, ArrowLeft, Sparkles, Send, X, MessageCircle, Bot, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PrefillSource<T> {
  value?: T;
  source?: string;
  confidence?: number; // 0-100
}

type Answers = ValuationInputs & {
  qualitative: {
    key_person?: number;
    concentration?: number;
    regulatory?: number;
    competitive?: number;
  };
};

const currencyFmt = (n?: number, ccy: string = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: ccy, maximumFractionDigits: 0 }).format(n || 0);

export default function ValuationEstimatorDialog({ isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { trackDownload } = useCredits();
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [documentsUsed, setDocumentsUsed] = useState<any[]>([]);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('');
  const [reportText, setReportText] = useState<string>('');

  // Inline assistant chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; type: 'user' | 'ai'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const [answers, setAnswers] = useState<Answers>({
    model: 'Other',
    currency: 'USD',
    qualitative: { key_person: 3, concentration: 3, regulatory: 2, competitive: 4 },
  });

  const [prefill, setPrefill] = useState<{
    model?: PrefillSource<BusinessModel>;
    ttmRevenue?: PrefillSource<number>;
    arr?: PrefillSource<number>;
    mrr?: PrefillSource<number>;
    gross_margin_pct?: PrefillSource<number>;
    churn_logo_pct?: PrefillSource<number>;
    churn_revenue_pct?: PrefillSource<number>;
    ndr_pct?: PrefillSource<number>;
    sde?: PrefillSource<number>;
    inventory_value?: PrefillSource<number>;
    conc_top5_pct?: PrefillSource<number>;
    growth_3m_pct?: PrefillSource<number>;
    growth_12m_pct?: PrefillSource<number>;
  }>({});

  const totalSteps = useMemo(() => 10, []);
  const progress = Math.round(((step) / totalSteps) * 100);

  useEffect(() => {
    const init = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const { data: userResp } = await supabase.auth.getUser();
        const uid = userResp.user?.id || null;
        setUserId(uid);

        // Ensure a business profile exists (simple: create if none)
        let business: any = null;
        if (uid) {
          const { data: bp } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('user_id', uid)
            .limit(1);
          if (bp && bp.length > 0) {
            business = bp[0];
          } else {
            const { data: created } = await supabase
              .from('business_profiles')
              .insert({ user_id: uid, currency: 'USD' })
              .select()
              .maybeSingle();
            business = created;
          }
          setBusinessId(business?.id || null);
          setBusinessName(business?.trade_name || business?.legal_name || 'Your business');
        }

        // Mine documents + financial_data
        const docsResp = await supabase
          .from('documents')
          .select('id, file_name, metadata, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        const docs = docsResp.data || [];
        setDocumentsUsed(docs.map(d => ({ id: d.id, file_name: d.file_name })));

        // Pull recent financial_data for last 12 months
        const now = new Date();
        const yearAgo = new Date(now);
        yearAgo.setMonth(yearAgo.getMonth() - 12);
        const { data: finData } = await supabase
          .from('financial_data')
          .select('period_start, period_end, revenue, cash_flow, expenses, profit')
          .gte('period_end', yearAgo.toISOString().slice(0, 10));

        let ttmRevenue = 0;
        (finData || []).forEach(r => { ttmRevenue += Number(r.revenue || 0); });

        // Try parsing ARR/MRR and margins from docs metadata if present
        let arr: number | undefined;
        let mrr: number | undefined;
        let grossMargin: number | undefined;
        let modelDetected: BusinessModel | undefined;

        for (const d of docs) {
          const md = d.metadata as any;
          if (md?.analysis?.keyMetrics?.arr && !arr) arr = Number(md.analysis.keyMetrics.arr);
          if (md?.analysis?.keyMetrics?.mrr && !mrr) mrr = Number(md.analysis.keyMetrics.mrr);
          if (md?.analysis?.keyMetrics?.grossMargin && !grossMargin) grossMargin = Number(md.analysis.keyMetrics.grossMargin);
          if (md?.analysis?.businessModel && !modelDetected) {
            const m = String(md.analysis.businessModel);
            if (['SaaS','Services','Ecommerce','Marketplace','BrickAndMortar','Other'].includes(m)) modelDetected = m as BusinessModel;
          }
        }

        const newPrefill: any = {};
        if (ttmRevenue > 0) newPrefill.ttmRevenue = { value: ttmRevenue, source: 'financial_data', confidence: 90 };
        if (arr) newPrefill.arr = { value: arr, source: 'documents.metadata', confidence: 70 };
        if (mrr) newPrefill.mrr = { value: mrr, source: 'documents.metadata', confidence: 70 };
        if (grossMargin) newPrefill.gross_margin_pct = { value: grossMargin, source: 'documents.metadata', confidence: 60 };
        if (modelDetected) newPrefill.model = { value: modelDetected, source: 'documents', confidence: 60 };

        setPrefill(newPrefill);
        setAnswers(prev => ({
          ...prev,
          currency: 'USD',
          model: modelDetected || prev.model,
          ttmRevenue: ttmRevenue || prev.ttmRevenue,
          arr: arr || prev.arr,
          mrr: mrr || prev.mrr,
          gross_margin_pct: grossMargin || prev.gross_margin_pct,
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const why = (text: string) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const defs: Record<string, string> = {
    ttm: 'Total revenue over the last 12 months. Used to anchor scale.',
    arr: 'Annual Recurring Revenue. Core driver of SaaS valuations.',
    mrr: 'Monthly Recurring Revenue. ARR = 12 × MRR.',
    gm: 'Gross Margin % = (Revenue − COGS) / Revenue.',
    ndr: 'Net Dollar Retention % measures expansion minus churn from existing customers.',
    churnL: 'Logo churn % = customers lost over a period / starting customers.',
    churnR: 'Revenue churn % = recurring revenue lost from churned customers.',
    g3: 'Growth over the last 3 months versus prior 3 months.',
    g12: 'Growth over the last 12 months versus prior 12 months.',
    sde: 'Seller’s Discretionary Earnings: profit plus owner add-backs.',
    owner: 'Owner dependence: how much the business relies on the owner (0–10).',
    gm2: 'Gross Margin % for Ecommerce: includes product + shipping/fulfillment COGS.',
    inv: 'Inventory at cost: added to SDE-based valuation for Ecommerce.',
    channel: 'Channel risk (0–10): dependence on single channel (e.g., Amazon).',
    gmv: 'Gross Merchandise Value processed over the last 12 months.',
    take: 'Take rate %: marketplace revenue share of GMV.',
    conc: 'Revenue share from top customers; high concentration reduces multiples.',
    g12m: '12-month growth for marketplace GMV or revenue.',
    kp: 'Key-person risk (0–10): impact if a key person leaves.',
    cr: 'Customer concentration risk (0–10): concentration exposure.',
    rr: 'Regulatory risk (0–10): exposure to compliance/policy changes.',
    cmp: 'Competitive pressure (0–10): intensity of competition.'
  };

  const next = () => setStep((s) => Math.min(totalSteps, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onFinish = async () => {
    setLoading(true);
    try {
      // Sanitize inputs: treat empty/NaN as undefined to avoid zeroed outputs
      const sanitize = (a: Answers): ValuationInputs => {
        const numKeys: (keyof ValuationInputs)[] = [
          'ttmRevenue','growth_3m_pct','growth_12m_pct','conc_top5_pct','arr','mrr','gross_margin_pct','churn_logo_pct','churn_revenue_pct','ndr_pct','arpu','ltv','cac','ebitda','sde','owner_dependence_slider','inventory_value','channel_risk_slider','gmv','take_rate_pct'
        ];
        const cleaned: any = { model: a.model, currency: a.currency };
        numKeys.forEach((k) => {
          const v = (a as any)[k];
          cleaned[k] = Number.isFinite(v) ? v : undefined;
        });
        return cleaned as ValuationInputs;
      };

      const i = sanitize(answers);

      // Validate minimal requirements per model
      const hasPos = (v?: number) => typeof v === 'number' && v > 0;
      let valid = true;
      let reason = '';
      switch (i.model) {
        case 'SaaS':
          valid = hasPos(i.arr) || hasPos(i.ttmRevenue);
          if (!valid) reason = 'Enter ARR or TTM revenue.';
          break;
        case 'Services':
        case 'BrickAndMortar':
          valid = hasPos(i.sde);
          if (!valid) reason = 'Enter a positive SDE.';
          break;
        case 'Ecommerce':
          valid = hasPos(i.sde) || hasPos(i.inventory_value);
          if (!valid) reason = 'Enter SDE and/or inventory value.';
          break;
        case 'Marketplace':
          valid = hasPos(i.gmv) && hasPos(i.take_rate_pct);
          if (!valid) reason = 'Enter GMV and take rate %.';
          break;
        default:
          valid = hasPos(i.ttmRevenue);
          if (!valid) reason = 'Enter TTM revenue.';
      }

      if (!valid) {
        toast({ title: 'Missing inputs', description: reason, variant: 'destructive' });
        return;
      }

      const res = computeValuation(i);
      setResult(res);
      // Build a concise written report
      const lines: string[] = [];
      lines.push(`Vesta Valuation Estimate for ${businessName}`);
      lines.push(`As of ${new Date().toLocaleDateString()} — Currency: ${i.currency}`);
      lines.push(`Method: ${res.method} — Model: ${i.model}`);
      lines.push(`Range: Low ${currencyFmt(res.low, i.currency)} | Base ${currencyFmt(res.base, i.currency)} | High ${currencyFmt(res.high, i.currency)}`);
      if (res.drivers.length) {
        lines.push('Key drivers:');
        res.drivers.forEach(d => lines.push(` • ${d}`));
      }
      lines.push('Assumptions & Heuristics: Beta coefficients and logic per model as disclosed in-app.');
      const rpt = lines.join('\n');
      setReportText(rpt);
      setStep(totalSteps);
    } finally {
      setLoading(false);
    }
  };
  const saveRun = async (isDraft = false) => {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        business_id: businessId,
        method_used: result?.method || 'pending',
        inputs_json: answers as any,
        documents_used: documentsUsed,
        valuation_low: result?.low ?? null,
        valuation_base: result?.base ?? null,
        valuation_high: result?.high ?? null,
        currency: answers.currency,
        notes: isDraft ? 'draft' : reportText,
        share_slug: crypto.randomUUID().slice(0, 8)
      };
      const { data, error } = await supabase.from('valuation_runs').insert(payload).select().maybeSingle();
      if (error) throw error;
      setSavedRunId(data?.id || null);
      toast({ title: isDraft ? 'Draft saved' : 'Valuation saved' });
      return data;
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!resultsRef.current) return;

    // Track credit usage for export
    const canExport = await trackDownload('Valuation Report PDF', 'Valuation estimator report export to PDF');
    if (!canExport) {
      return; // trackDownload already shows appropriate error messages
    }

    const el = resultsRef.current;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Header branding
    pdf.setFillColor(27, 58, 92); // vesta-navy bar (#1B3A5C)
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('Vesta — Valuation Estimator (Beta)', 40, 26);
    pdf.setTextColor(0, 0, 0);

    // Screenshot of results
    const topOffset = 50;
    const imgWidth = pageWidth - 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 40, topOffset, imgWidth, Math.min(imgHeight, pageHeight - topOffset - 160));

    // Written report
    const reportY = Math.min(topOffset + imgHeight + 20, pageHeight - 120);
    pdf.setFontSize(12);
    const wrapped = pdf.splitTextToSize(reportText || 'Report unavailable.', pageWidth - 80);
    pdf.text(wrapped, 40, reportY);

    const blob = pdf.output('blob');

    // Upload to storage
    if (!userId) return;
    const path = `valuations/${userId}/${savedRunId || crypto.randomUUID()}.pdf`;
    const { data: upload, error } = await supabase.storage.from('user-documents').upload(path, blob, { upsert: true, contentType: 'application/pdf' });
    if (error) {
      console.error(error);
      toast({ title: 'PDF upload failed', variant: 'destructive' });
      return;
    }
    setPdfPath(path);

    // Update run with pdf_url if we have an id
    if (savedRunId) {
      await supabase.from('valuation_runs').update({ pdf_url: path }).eq('id', savedRunId);
    }

    // Trigger download locally too
    pdf.save('vesta-valuation.pdf');
  };

  const shareLink = async () => {
    if (!pdfPath) {
      toast({ title: 'Generate PDF first' });
      return;
    }
    const { data, error } = await supabase.storage.from('user-documents').createSignedUrl(pdfPath, 60 * 60 * 24 * 7);
    if (error) {
      console.error(error);
      toast({ title: 'Share link failed', variant: 'destructive' });
      return;
    }
    await navigator.clipboard.writeText(data.signedUrl);
    toast({ title: 'Share link copied (valid 7 days)' });
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const text = chatInput;
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), type: 'user', content: text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      let profile: any = null;
      if (userId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        profile = prof;
      }
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          action: 'chat',
          message: text,
          financialData: answers,
          profile,
          currentInsights: []
        }
      });
      if (error) throw error;
      setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: 'ai', content: data.response }]);
    } catch (e) {
      console.error('Chat error:', e);
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setChatLoading(false);
    }
  };

  const close = async () => {
    if (!result) await saveRun(true);
    onClose();
  };
  const Section = ({ title, children }: { title: string; children: any }) => (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );

  const Intro = (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Badge variant="secondary">Beta</Badge>
        <h2 className="text-xl font-semibold">Estimate my valuation (Beta)</h2>
        <p className="text-sm text-muted-foreground">We’ll analyze your docs, ask a few clarifying questions, then give you a valuation range with assumptions. Takes ~3–5 minutes.</p>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => next()} disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" /> Start
        </Button>
        <Button variant="ghost" onClick={close}>Cancel</Button>
      </div>
    </div>
  );

  const FieldHint = ({ src, conf }: { src?: string; conf?: number }) => (
    src ? <span className="text-xs text-muted-foreground">Prefilled from {src} {conf ? `(conf ${conf})` : ''}</span> : null
  );

  const NumberField = ({
    id, label, value, onChange, suffix, hint
  }: { id: string; label: string; value?: number; onChange: (n?: number) => void; suffix?: string; hint?: { src?: string; conf?: number } }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {why(defs[id] || 'We use this to refine your valuation estimate.')}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          value={Number.isFinite(value as number) ? (value as number) : ''}
          onChange={e => {
            const v = e.target.value;
            onChange(v === '' ? undefined : Number(v));
          }}
          placeholder="0"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <FieldHint src={hint?.src} conf={hint?.conf} />
    </div>
  );

  const SliderField = ({ id, label, value, onCommit }: { id: string; label: string; value?: number; onCommit: (n: number) => void }) => {
    const [internal, setInternal] = useState<number>(value ?? 0);
    useEffect(() => { setInternal(value ?? 0); }, [value]);
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          {why(defs[id] || 'We use this to refine your valuation estimate.')}
        </div>
        <Slider id={id} min={0} max={10} step={0.5} value={[internal]} onValueChange={([n]) => setInternal(n)} onValueCommit={([n]) => onCommit(n)} />
        <div className="text-xs text-muted-foreground">{internal}/10</div>
      </div>
    );
  };

  const Steps = (
    <div className="space-y-6">
      {/* Q0 */}
      <Section title="Business model">
        <div className="flex items-center gap-2">{why('We tailor the valuation method to your model.')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(['SaaS','Services','Ecommerce','Marketplace','BrickAndMortar','Other'] as BusinessModel[]).map(m => (
            <Button key={m} variant={answers.model === m ? 'default' : 'outline'} onClick={() => setAnswers(a => ({ ...a, model: m }))}>{m}</Button>
          ))}
        </div>
        <FieldHint src={prefill.model?.source} conf={prefill.model?.confidence} />
      </Section>

      {/* Q1 */}
      <Section title="TTM Revenue">
        <div className="flex items-center gap-2">{why('Base scale anchor; validates timeframe and currency.')}</div>
        <NumberField id="ttm" label="Trailing Twelve Months Revenue" value={answers.ttmRevenue} onChange={n => setAnswers(a => ({ ...a, ttmRevenue: n }))} suffix={answers.currency} hint={{ src: prefill.ttmRevenue?.source, conf: prefill.ttmRevenue?.confidence }} />
      </Section>

      {/* Q2 model specific */}
      {answers.model === 'SaaS' && (
        <Section title="SaaS metrics">
          <div className="flex items-center gap-2">{why('ARR/MRR, growth, churn and margins drive multiples.')}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <NumberField id="arr" label="ARR" value={answers.arr} onChange={n => setAnswers(a => ({ ...a, arr: n }))} suffix={answers.currency} hint={{ src: prefill.arr?.source, conf: prefill.arr?.confidence }} />
            <NumberField id="mrr" label="MRR" value={answers.mrr} onChange={n => setAnswers(a => ({ ...a, mrr: n }))} suffix={answers.currency} hint={{ src: prefill.mrr?.source, conf: prefill.mrr?.confidence }} />
            <NumberField id="gm" label="Gross Margin %" value={answers.gross_margin_pct} onChange={n => setAnswers(a => ({ ...a, gross_margin_pct: n }))} suffix="%" hint={{ src: prefill.gross_margin_pct?.source, conf: prefill.gross_margin_pct?.confidence }} />
            <NumberField id="ndr" label="Net Dollar Retention %" value={answers.ndr_pct} onChange={n => setAnswers(a => ({ ...a, ndr_pct: n }))} suffix="%" />
            <NumberField id="churnL" label="Logo Churn %" value={answers.churn_logo_pct} onChange={n => setAnswers(a => ({ ...a, churn_logo_pct: n }))} suffix="%" />
            <NumberField id="churnR" label="Revenue Churn %" value={answers.churn_revenue_pct} onChange={n => setAnswers(a => ({ ...a, churn_revenue_pct: n }))} suffix="%" />
            <NumberField id="g3" label="Growth 3m %" value={answers.growth_3m_pct} onChange={n => setAnswers(a => ({ ...a, growth_3m_pct: n }))} suffix="%" />
            <NumberField id="g12" label="Growth 12m %" value={answers.growth_12m_pct} onChange={n => setAnswers(a => ({ ...a, growth_12m_pct: n }))} suffix="%" />
          </div>
        </Section>
      )}
      {(answers.model === 'Services' || answers.model === 'BrickAndMortar') && (
        <Section title="SDE and involvement">
          <div className="flex items-center gap-2">{why('Service multiples center on SDE and owner dependence.')}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <NumberField id="sde" label="Seller’s Discretionary Earnings (SDE)" value={answers.sde} onChange={n => setAnswers(a => ({ ...a, sde: n }))} suffix={answers.currency} />
            <SliderField id="owner" label="Owner dependence" value={answers.owner_dependence_slider} onCommit={(n) => setAnswers(a => ({ ...a, owner_dependence_slider: n }))} />
          </div>
        </Section>
      )}
      {answers.model === 'Ecommerce' && (
        <Section title="Ecommerce specifics">
          <div className="flex items-center gap-2">{why('Margins, inventory and channel risk are key.')}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <NumberField id="sde2" label="SDE" value={answers.sde} onChange={n => setAnswers(a => ({ ...a, sde: n }))} suffix={answers.currency} />
            <NumberField id="gm2" label="Gross Margin %" value={answers.gross_margin_pct} onChange={n => setAnswers(a => ({ ...a, gross_margin_pct: n }))} suffix="%" />
            <NumberField id="inv" label="Inventory at cost" value={answers.inventory_value} onChange={n => setAnswers(a => ({ ...a, inventory_value: n }))} suffix={answers.currency} />
            <SliderField id="channel" label="Channel risk" value={answers.channel_risk_slider} onCommit={(n) => setAnswers(a => ({ ...a, channel_risk_slider: n }))} />
          </div>
        </Section>
      )}
      {answers.model === 'Marketplace' && (
        <Section title="Marketplace economics">
          <div className="flex items-center gap-2">{why('Revenue derives from GMV x take rate.')}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <NumberField id="gmv" label="GMV (12m)" value={answers.gmv} onChange={n => setAnswers(a => ({ ...a, gmv: n }))} suffix={answers.currency} />
            <NumberField id="take" label="Take rate %" value={answers.take_rate_pct} onChange={n => setAnswers(a => ({ ...a, take_rate_pct: n }))} suffix="%" />
            <NumberField id="conc" label="Top-5 concentration %" value={answers.conc_top5_pct} onChange={n => setAnswers(a => ({ ...a, conc_top5_pct: n }))} suffix="%" />
            <NumberField id="g12m" label="Growth 12m %" value={answers.growth_12m_pct} onChange={n => setAnswers(a => ({ ...a, growth_12m_pct: n }))} suffix="%" />
          </div>
        </Section>
      )}

      {/* Q3-Q8 common */}
      <Section title="Customer concentration">
        <div className="flex items-center gap-2">{why('High concentration reduces multiples.')}</div>
        <NumberField id="conc" label="% revenue from top 5 customers" value={answers.conc_top5_pct} onChange={n => setAnswers(a => ({ ...a, conc_top5_pct: n }))} suffix="%" />
      </Section>

      <Section title="Qualitative risk sliders">
        <div className="grid sm:grid-cols-2 gap-3">
          <SliderField id="kp" label="Key-person risk" value={answers.qualitative.key_person} onCommit={(n) => setAnswers(a => ({ ...a, qualitative: { ...a.qualitative, key_person: n } }))} />
          <SliderField id="cr" label="Customer concentration risk" value={answers.qualitative.concentration} onCommit={(n) => setAnswers(a => ({ ...a, qualitative: { ...a.qualitative, concentration: n } }))} />
          <SliderField id="rr" label="Regulatory risk" value={answers.qualitative.regulatory} onCommit={(n) => setAnswers(a => ({ ...a, qualitative: { ...a.qualitative, regulatory: n } }))} />
          <SliderField id="cmp" label="Competitive pressure" value={answers.qualitative.competitive} onCommit={(n) => setAnswers(a => ({ ...a, qualitative: { ...a.qualitative, competitive: n } }))} />
        </div>
      </Section>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={back}><ArrowLeft className="w-4 h-4 mr-1"/>Back</Button>
        <Button onClick={onFinish}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Continue'}
        </Button>
      </div>
    </div>
  );

  const Results = result && (
    <div className="space-y-6" ref={resultsRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Estimated Valuation (Beta) — as of {new Date().toLocaleDateString()}</h2>
          <div className="flex gap-2 mt-2">
            <Badge>Method: {result.method}</Badge>
            <Badge variant="secondary">Model: {answers.model}</Badge>
          </div>
        </div>
        <Badge variant="secondary">Currency: {answers.currency}</Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Low</div><div className="text-xl font-semibold">{currencyFmt(result.low, answers.currency)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Base</div><div className="text-xl font-semibold">{currencyFmt(result.base, answers.currency)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">High</div><div className="text-xl font-semibold">{currencyFmt(result.high, answers.currency)}</div></CardContent></Card>
      </div>

      <div>
        <h3 className="text-base font-medium mb-2">Key drivers</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          {result.drivers.map((d, i) => (<li key={i}>{d}</li>))}
        </ul>
      </div>

      <div className="text-xs text-muted-foreground border rounded-md p-3">
        Beta: Automated, document-assisted estimate for informational purposes only. Not financial, tax, or legal advice. Actual market valuations vary by buyer, terms, and timing.
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={() => saveRun(false)} disabled={saving}><Save className="w-4 h-4 mr-1"/>Save</Button>
          <Button variant="outline" onClick={downloadPdf}><Download className="w-4 h-4 mr-1"/>Download PDF</Button>
          <Button variant="outline" onClick={shareLink}><Share2 className="w-4 h-4 mr-1"/>Share link</Button>
        </div>
        <Button variant="ghost" onClick={onClose}>Start Over</Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-2xl p-0" aria-describedby="ve-desc">
        <div className="relative flex max-h-[80vh] flex-col">
          <div className="px-6 pt-6">
            <DialogHeader className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>Valuation Estimator (Beta)</DialogTitle>
                  <DialogDescription className="sr-only" id="ve-desc">Answer a few questions and review your document-assisted valuation. Beta, informational only.</DialogDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setChatOpen(true)} aria-haspopup="dialog">
                  <MessageCircle className="w-4 h-4 mr-1" /> Ask Vesta
                </Button>
              </div>
            </DialogHeader>
            <div className="mt-4">
              <Progress value={progress} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {step === 0 ? Intro : step < totalSteps ? Steps : Results}
          </div>

          {chatOpen && (
            <div className="absolute bottom-4 right-4 z-[60] w-80 sm:w-96 pointer-events-auto">
              <Card className="shadow-lg">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Ask Vesta</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setChatOpen(false)} aria-label="Close chat">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-0">
                  <div className="max-h-64 overflow-y-auto p-3 space-y-2 bg-background/95">
                    {chatMessages.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-6">Ask questions about this valuation.</div>
                    ) : (
                      chatMessages.map((m) => (
                        <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`text-xs p-2 rounded-md max-w-[80%] whitespace-pre-wrap break-words ${m.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {m.content}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t flex items-center gap-2 bg-background/95">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your question..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void sendChat();
                        }
                      }}
                    />
                    <Button size="sm" onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading}>
                      {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
