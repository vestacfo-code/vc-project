interface DeepResearchProgressProps {
  elapsedSeconds: number;
  statusMessage: string;
}

export const DeepResearchProgress = (props: DeepResearchProgressProps) => {
  const { elapsedSeconds } = props;
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

  const completedSteps = steps.filter((s) => elapsedSeconds >= s.threshold + 8);
  const activeStep = steps.find((s, i) => {
    const next = steps[i + 1];
    return elapsedSeconds >= s.threshold && (!next || elapsedSeconds < next.threshold + 8);
  });

  return (
    <div className="flex gap-3 md:gap-4">
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 md:h-8 md:w-8">
        <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-700" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-800">Deep Research</span>
          <span className="text-xs text-zinc-400">{formatTime(elapsedSeconds)}</span>
        </div>

        <div className="space-y-2.5">
          {completedSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span className="text-sm leading-relaxed text-zinc-400">{step.label}</span>
            </div>
          ))}
          {activeStep && (
            <div className="flex items-start gap-2.5">
              <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-cyan-400" />
              <span className="text-sm leading-relaxed text-zinc-600">{activeStep.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
