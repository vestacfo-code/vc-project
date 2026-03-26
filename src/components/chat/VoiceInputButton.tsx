import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AudioRecorder from '@/utils/AudioRecorder';

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInputButton = ({ 
  onTranscription,
  disabled 
}: VoiceInputButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
    };
  }, []);

  const encodeAudioForAPI = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);
      setIsTranscribing(true);

      try {
        // Combine all audio chunks
        const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedAudio = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
          combinedAudio.set(chunk, offset);
          offset += chunk.length;
        }

        // Encode and send to transcription
        const base64Audio = encodeAudioForAPI(combinedAudio);

        const { data, error } = await supabase.functions.invoke('ai-cfo-speech-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          onTranscription(data.text);
          toast({
            title: "Transcription complete",
            description: "Your speech has been converted to text",
          });
        }

      } catch (error: any) {
        console.error('Transcription error:', error);
        toast({
          title: "Transcription failed",
          description: error.message || "Failed to transcribe audio",
          variant: "destructive",
        });
      } finally {
        setIsTranscribing(false);
        setDuration(0);
        audioChunksRef.current = [];
      }

    } else {
      // Start recording
      try {
        audioChunksRef.current = [];
        
        recorderRef.current = new AudioRecorder((audioData) => {
          audioChunksRef.current.push(new Float32Array(audioData));
        });

        await recorderRef.current.start();
        setIsRecording(true);
        setDuration(0);

        // Start timer
        timerRef.current = setInterval(() => {
          setDuration(prev => {
            if (prev >= 60) {
              handleToggleRecording(); // Auto-stop after 60 seconds
              return 60;
            }
            return prev + 1;
          });
        }, 1000);

        toast({
          title: "Recording started",
          description: "Speak your message (max 60 seconds)",
        });

      } catch (error: any) {
        console.error('Recording error:', error);
        toast({
          title: "Recording failed",
          description: error.message || "Failed to start recording",
          variant: "destructive",
        });
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <span className="text-xs text-muted-foreground animate-pulse">
          {duration}s
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleRecording}
        disabled={disabled || isTranscribing}
        className={`h-8 w-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};