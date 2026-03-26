interface DeepResearchProgressProps {
  elapsedSeconds: number;
  statusMessage: string;
  dark?: boolean;
}

export const DeepResearchProgress = ({
  elapsedSeconds,
  dark = true,
}: DeepResearchProgressProps) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const steps = [
    { threshold: 0, label: 'Analyzing your question...' },
    { threshold: 10, label: 'Searching for relevant information...' },
    { threshold: 25, label: 'Reading and evaluating sources...' },
    { threshold: 45, label: 'Cross-referencing findings...' },
    { threshold: 70, label: 'Synthesizing research results...' },
    { threshold: 100, label: 'Compiling comprehensive answer...' },
  ];

  const completedSteps = steps.filter(s => elapsedSeconds >= s.threshold + 8);
  const activeStep = steps.find((s, i) => {
    const next = steps[i + 1];
    return elapsedSeconds >= s.threshold && (!next || elapsedSeconds < next.threshold + 8);
  });

  return (
    <div className="flex gap-3 md:gap-4">
      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${dark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${dark ? 'bg-white' : 'bg-zinc-700'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm font-semibold ${dark ? 'text-zinc-100' : 'text-zinc-800'}`}>Deep Research</span>
          <span className={`text-xs ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{formatTime(elapsedSeconds)}</span>
        </div>

        <div className="space-y-2.5">
          {completedSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-emerald-400" />
              <span className={`text-sm leading-relaxed ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{step.label}</span>
            </div>
          ))}
          {activeStep && (
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-cyan-400 animate-pulse" />
              <span className={`text-sm leading-relaxed ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>{activeStep.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
