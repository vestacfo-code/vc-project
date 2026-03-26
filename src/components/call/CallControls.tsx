import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff,
  ScreenShare,
  MessageSquare,
  MoreHorizontal,
  Users,
  Settings,
  Grid3X3,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CallControlsProps {
  isCallActive: boolean;
  isMuted: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
}

export default function CallControls({
  isCallActive,
  isMuted,
  onStartCall,
  onEndCall,
  onToggleMute,
}: CallControlsProps) {
  if (!isCallActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <Button
          onClick={onStartCall}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full shadow-lg"
          size="lg"
        >
          <Phone className="h-6 w-6 mr-2" />
          Join Call
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-between w-full max-w-2xl mx-auto px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left side controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full"
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>
      </div>

      {/* Center controls */}
      <div className="flex items-center gap-1">
        {/* Microphone */}
        <Button
          onClick={onToggleMute}
          variant="ghost"
          size="sm"
          className={`p-3 h-12 w-12 rounded-full ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        {/* Camera off */}
        <Button
          variant="ghost"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white p-3 h-12 w-12 rounded-full"
        >
          <VideoOff className="h-5 w-5" />
        </Button>

        {/* Screen share */}
        <Button
          variant="ghost"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 text-white p-3 h-12 w-12 rounded-full"
        >
          <ScreenShare className="h-5 w-5" />
        </Button>

        {/* Chat */}
        <Button
          variant="ghost"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 text-white p-3 h-12 w-12 rounded-full"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* More options */}
        <Button
          variant="ghost"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 text-white p-3 h-12 w-12 rounded-full"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>

        {/* End call */}
        <Button
          onClick={onEndCall}
          variant="ghost"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white p-3 h-12 w-12 rounded-full ml-2"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full"
        >
          <Shield className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full"
        >
          <Users className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full"
        >
          <Grid3X3 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full"
        >
          <Shield className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}