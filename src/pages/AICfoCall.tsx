import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import AICfoAvatar from '@/components/call/AICfoAvatar';
import SmartAudioRecorder from '@/utils/SmartAudioRecorder';
import ConversationTranscript from '@/components/call/ConversationTranscript';
import CallControls from '@/components/call/CallControls';
import { AudioFeedback } from '@/utils/AudioFeedback';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export default function AICfoCall() {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userName, setUserName] = useState<string>('');
  
  const audioRecorderRef = useRef<SmartAudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const volumeUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new AudioContext();
    
    // Get user name
    const fetchUserName = async () => {
      if (user) {
        // Try to get name from user metadata first
        const fullName = user.user_metadata?.full_name || user.email;
        const firstName = fullName.split(' ')[0] || fullName.split('@')[0];
        setUserName(firstName);
      }
    };
    
    fetchUserName();
    
    // Volume monitoring for visual feedback
    const updateVolume = () => {
      if (audioRecorderRef.current && isCallActive && !isMuted) {
        setCurrentVolume(audioRecorderRef.current.getCurrentVolume());
      } else {
        setCurrentVolume(0);
      }
      volumeUpdateRef.current = requestAnimationFrame(updateVolume);
    };
    
    if (isCallActive) {
      updateVolume();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (volumeUpdateRef.current) {
        cancelAnimationFrame(volumeUpdateRef.current);
      }
    };
  }, [isCallActive, isMuted, user]);

  const startCall = async () => {
    try {
      console.log('🚀 Starting call...');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      audioRecorderRef.current = new SmartAudioRecorder((audioData) => {
        if (!isMuted && isCallActive) {
          handleAudioData(audioData);
        }
      });

      await audioRecorderRef.current.start();
      setIsCallActive(true);
      
      // Play call start sound
      AudioFeedback.playCallStart();
      
      // Create personalized welcome message
      const greeting = userName ? `Good day, ${userName}` : 'Good day';
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `${greeting}. I'm your AI Chief Financial Officer with over 25 years of C-suite experience. I'm here to discuss your financial strategy, analyze your business performance, and provide strategic insights to drive shareholder value. What would you like to explore today?`,
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);

      console.log('🔊 Starting welcome message TTS...');
      // Convert welcome message to speech (but don't block the call if it fails)
      setTimeout(async () => {
        try {
          await convertTextToSpeech(welcomeMessage.content);
        } catch (error) {
          console.error('Welcome TTS failed, but call continues:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Error starting call:', error);
      // Still provide feedback even on error
      AudioFeedback.playButtonClick();
    }
  };

  const endCall = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsCallActive(false);
    setIsAiSpeaking(false);
    setCurrentVolume(0);
    setIsListening(false);
    setIsProcessing(false);
    
    // Play call end sound
    AudioFeedback.playCallEnd();
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Play audio feedback
    AudioFeedback.playMuteToggle(newMutedState);
  };

  const handleAudioData = async (audioData: Float32Array) => {
    if (isProcessing || isAiSpeaking) {
      console.log('Skipping audio processing - already processing or AI speaking');
      return;
    }
    
    console.log(`🎤 Starting to process ${audioData.length} audio samples...`);
    setIsProcessing(true);
    setIsListening(false);
    
    try {
      // Convert audio to proper WAV format with headers
      const audioBase64 = encodeAudioForWhisper(audioData);
      console.log('🎤 Audio encoded for Whisper API');
      
      // Send to speech-to-text
      console.log('🎤 Sending to speech-to-text...');
      const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('ai-cfo-speech-to-text', {
        body: { audio: audioBase64 }
      });

      if (transcriptError) {
        console.error('Speech-to-text error:', transcriptError);
        throw transcriptError;
      }
      
      const userText = transcriptData.text?.trim();
      console.log('📝 Transcribed text:', userText);
      
      if (!userText || userText.length < 3) {
        console.log('Speech too short or unclear, ignoring...');
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: userText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      console.log('🤖 Getting AI response...');
      const { data: chatData, error: chatError } = await supabase.functions.invoke('ai-cfo-realtime-chat', {
        body: { 
          message: userText,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }
      });

      if (chatError) {
        console.error('Chat error:', chatError);
        throw chatError;
      }

      const aiResponse = chatData.response;
      console.log('🤖 AI response received:', aiResponse.substring(0, 50) + '...');
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Convert AI response to speech
      await convertTextToSpeech(aiResponse);

    } catch (error) {
      console.error('Error processing audio:', error);
      // Play error feedback
      AudioFeedback.playButtonClick();
    } finally {
      setIsProcessing(false);
    }
  };

  const convertTextToSpeech = async (text: string) => {
    try {
      console.log('🔊 Converting text to speech:', text.substring(0, 50) + '...');
      setIsAiSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('ai-cfo-text-to-speech', {
        body: { text, voice: 'onyx' } // Deep corporate voice
      });

      if (error) {
        console.error('TTS API error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      console.log('🔊 Audio content received, length:', data.audioContent.length);

      // Create audio directly from base64 using data URL
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      currentAudioRef.current = new Audio(audioUrl);
      currentAudioRef.current.onended = () => {
        console.log('🔊 Audio playback finished');
        setIsAiSpeaking(false);
      };
      
      currentAudioRef.current.onerror = (e) => {
        console.error('🔊 Audio playback error:', e);
        setIsAiSpeaking(false);
      };
      
      currentAudioRef.current.oncanplay = () => {
        console.log('🔊 Audio ready to play');
      };
      
      await currentAudioRef.current.play();
      console.log('🔊 Audio playback started');
      
    } catch (error) {
      console.error('Error converting text to speech:', error);
      setIsAiSpeaking(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-vesta-navy-muted via-vesta-navy to-vesta-navy-muted relative overflow-hidden">
      {/* Main call area with centered avatar */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AICfoAvatar 
          isActive={isCallActive}
          isSpeaking={isAiSpeaking}
          volume={isAiSpeaking ? 0.8 : currentVolume}
        />
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              Processing your speech...
            </div>
          </div>
        )}
      </div>

      {/* Bottom left info */}
      <div className="absolute bottom-20 left-6">
        <div className="text-white text-lg font-medium">AI CFO Assistant</div>
        <div className="text-white/80 text-sm">
          {new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })} • fin-cfo-{Math.random().toString(36).substring(2, 8)}
        </div>
      </div>

      {/* Bottom controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-center py-4">
          <CallControls
            isCallActive={isCallActive}
            isMuted={isMuted}
            onStartCall={startCall}
            onEndCall={endCall}
            onToggleMute={toggleMute}
          />
        </div>
      </div>

      {/* Hidden transcript for now - can be toggled later */}
      <div className="hidden">
        <ConversationTranscript 
          messages={messages}
          isCallActive={isCallActive}
        />
      </div>
    </div>
  );
}

// Utility functions
const encodeAudioForWhisper = (float32Array: Float32Array): string => {
  const sampleRate = 16000;
  const length = float32Array.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, sample, true);
    offset += 2;
  }
  
  // Convert to base64
  const uint8Array = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// Remove the problematic base64ToBlob function since we're using data URLs now