import { motion } from 'framer-motion';
// Use uploaded avatar from public folder
const avatarImage = '/lovable-uploads/bebc1837-ed57-4a48-b067-8bfd54639a72.png';

interface AICfoAvatarProps {
  isActive: boolean;
  isSpeaking: boolean;
  volume: number;
}

export default function AICfoAvatar({ isActive, isSpeaking, volume }: AICfoAvatarProps) {
  const pulseScale = 1 + (volume * 0.3); // Scale based on volume
  const ringScale = 1 + (volume * 0.5);

  return (
    <div className="relative">
      {/* Outer ring - animated when speaking or listening */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-primary/30"
        style={{
          width: '200px',
          height: '200px',
          left: '-25px',
          top: '-25px',
        }}
        animate={{
          scale: isActive ? ringScale : 1,
          opacity: isActive ? 0.8 : 0.3,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut"
        }}
      />
      
      {/* Middle ring - more subtle animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        style={{
          width: '170px',
          height: '170px',
          left: '-10px',
          top: '-10px',
        }}
        animate={{
          scale: isActive ? 1 + (volume * 0.2) : 1,
          opacity: isActive ? 0.6 : 0.2,
        }}
        transition={{
          duration: 0.1,
          ease: "easeOut"
        }}
      />

      {/* Avatar container */}
      <motion.div
        className="relative w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-white shadow-2xl"
        animate={{
          scale: isActive ? pulseScale : 1,
        }}
        transition={{
          duration: 0.1,
          ease: "easeOut"
        }}
      >
        {/* Professional headshot */}
        <img
          src={avatarImage}
          alt="AI CFO"
          className="w-full h-full object-cover"
        />
        
        {/* Speaking overlay */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-full"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </motion.div>
      )}

      {/* Processing indicator */}
      {isActive && volume > 0 && !isSpeaking && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}