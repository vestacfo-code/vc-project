// Enhanced audio recorder with voice activity detection and buffering
export default class SmartAudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isRecording = false;
  
  // Voice activity detection
  private audioBuffer: Float32Array[] = [];
  private silenceThreshold = 0.01;
  private minSpeechDuration = 1000; // 1 second minimum
  private maxSpeechDuration = 8000; // 8 seconds maximum
  private silenceDuration = 500; // 500ms of silence to end recording
  private lastVoiceTime = 0;
  private speechStartTime = 0;
  private isInSpeech = false;
  
  constructor(private onSpeechDetected: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Better for Whisper
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      // Set up analyser for voice activity detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        this.processAudioChunk(new Float32Array(inputData));
      };
      
      this.source.connect(this.analyser);
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isRecording = true;
      console.log('Smart audio recording started');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  private processAudioChunk(audioData: Float32Array) {
    const volume = this.calculateRMSVolume(audioData);
    const hasVoice = volume > this.silenceThreshold;
    const currentTime = Date.now();
    
    if (hasVoice) {
      this.lastVoiceTime = currentTime;
      
      if (!this.isInSpeech) {
        // Start of speech detected
        this.isInSpeech = true;
        this.speechStartTime = currentTime;
        this.audioBuffer = [];
        console.log('🎤 Speech started');
      }
      
      // Add audio to buffer
      this.audioBuffer.push(new Float32Array(audioData));
      
    } else if (this.isInSpeech) {
      // Check if we should end speech (silence duration reached)
      const silenceDuration = currentTime - this.lastVoiceTime;
      const speechDuration = currentTime - this.speechStartTime;
      
      if (silenceDuration >= this.silenceDuration || speechDuration >= this.maxSpeechDuration) {
        // End of speech - process if long enough
        if (speechDuration >= this.minSpeechDuration && this.audioBuffer.length > 0) {
          this.processSpeechBuffer();
        }
        
        this.isInSpeech = false;
        this.audioBuffer = [];
        console.log(`🎤 Speech ended (duration: ${speechDuration}ms)`);
      } else {
        // Still in speech, just add silence
        this.audioBuffer.push(new Float32Array(audioData));
      }
    }
  }

  private calculateRMSVolume(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  private processSpeechBuffer() {
    if (this.audioBuffer.length === 0) return;
    
    // Combine all audio chunks into one buffer
    const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedAudio = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of this.audioBuffer) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log(`🎤 Processing speech buffer: ${combinedAudio.length} samples`);
    this.onSpeechDetected(combinedAudio);
  }

  // Get current volume for visual feedback
  getCurrentVolume(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    // @ts-expect-error - TypeScript strict typing issue with Uint8Array buffer type
    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    const average = sum / this.dataArray.length;
    return Math.min(average / 128, 1);
  }

  stop() {
    this.isRecording = false;
    this.isInSpeech = false;
    this.audioBuffer = [];
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('Smart audio recording stopped');
  }

  pause() {
    this.isRecording = false;
    this.isInSpeech = false;
    this.audioBuffer = [];
  }

  resume() {
    this.isRecording = true;
  }
}