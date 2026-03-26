const OnboardingBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100" />
      
      {/* Floating blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-float" 
           style={{ animationDelay: '0s', animationDuration: '20s' }} />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-500/25 rounded-full blur-3xl animate-float" 
           style={{ animationDelay: '2s', animationDuration: '25s' }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-float" 
           style={{ animationDelay: '4s', animationDuration: '30s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-float" 
           style={{ animationDelay: '1s', animationDuration: '22s' }} />
      
      {/* Grid overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
    </div>
  );
};

export default OnboardingBackground;
