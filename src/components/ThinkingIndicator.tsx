export const ThinkingIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-sm font-medium thinking-shimmer"
        style={{
          background: 'linear-gradient(90deg, rgba(161,161,170,0.4) 0%, rgba(200,200,210,0.9) 50%, rgba(161,161,170,0.4) 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: 'shimmer-slide 1.5s ease-in-out infinite',
        }}
      >
        Thinking
      </span>
      <style>{`
        @keyframes shimmer-slide {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
