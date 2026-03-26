import { useState, useRef, useCallback } from 'react';
import type { AgentStep } from '@/components/chat/AgentProgressIndicator';
import { supabase } from '@/lib/supabase-client-wrapper';

interface AgentState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  estimatedSecondsRemaining: number;
  thinkingLog: string[];
  completedSteps: AgentStep[];
}

const initialState: AgentState = {
  isRunning: false,
  currentStep: 0,
  totalSteps: 1,
  currentLabel: 'Starting agent...',
  estimatedSecondsRemaining: 60,
  thinkingLog: [],
  completedSteps: [],
};

export const useAgentChat = () => {
  const [agentState, setAgentState] = useState<AgentState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetAgent = useCallback(() => {
    setAgentState(initialState);
  }, []);

  const cancelAgent = useCallback(() => {
    abortControllerRef.current?.abort();
    resetAgent();
  }, [resetAgent]);

  const sendAgentMessage = useCallback(
    async ({
      message,
      userContext,
      pricingData,
      onContent,
      onDone,
      onError,
    }: {
      message: string;
      userContext?: Record<string, unknown> | null;
      pricingData?: Record<string, unknown> | null;
      onContent: (delta: string) => void;
      onDone: () => void;
      onError: (err: string) => void;
    }) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setAgentState({ ...initialState, isRunning: true });

      const AGENT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-research`;

      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        const response = await fetch(AGENT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ message, userContext, pricingData }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 429) throw new Error('Rate limit exceeded. Please try again.');
          if (response.status === 402) throw new Error('Insufficient credits.');
          const errData = await response.json().catch(() => ({ error: 'Agent request failed' }));
          throw new Error(errData.error || 'Agent request failed');
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case 'status':
                  setAgentState((prev) => ({
                    ...prev,
                    currentStep: event.step,
                    totalSteps: event.totalSteps,
                    currentLabel: event.label,
                    estimatedSecondsRemaining: event.estimatedSecondsRemaining || 0,
                  }));
                  break;

                case 'thinking':
                  setAgentState((prev) => ({
                    ...prev,
                    thinkingLog: [...prev.thinkingLog, event.content],
                  }));
                  break;

                case 'step_complete':
                  setAgentState((prev) => ({
                    ...prev,
                    completedSteps: [
                      ...prev.completedSteps,
                      {
                        step: event.step,
                        label: event.summary,
                        status: 'complete' as const,
                      },
                    ],
                  }));
                  break;

                case 'content':
                  onContent(event.delta);
                  break;

                case 'done':
                  setAgentState((prev) => ({ ...prev, isRunning: false }));
                  onDone();
                  return;

                case 'error':
                  throw new Error(event.message || 'Agent error');
              }
            } catch (parseErr) {
              // If it's our thrown error, rethrow
              if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
                if (parseErr.message !== 'Unexpected token') {
                  throw parseErr;
                }
              }
              // Otherwise partial JSON, ignore
            }
          }
        }

        // Stream ended without explicit done event
        setAgentState((prev) => ({ ...prev, isRunning: false }));
        onDone();
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Agent chat error:', err);
        setAgentState((prev) => ({ ...prev, isRunning: false }));
        onError(err instanceof Error ? err.message : 'Agent failed');
      }
    },
    []
  );

  return {
    agentState,
    sendAgentMessage,
    cancelAgent,
    resetAgent,
  };
};
