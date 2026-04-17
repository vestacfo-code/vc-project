import { useEffect } from 'react';

const DemoRedirect = () => {
  useEffect(() => {
    window.location.href = 'https://calendly.com/chandaksvar/30min';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting to booking...</p>
    </div>
  );
};

export default DemoRedirect;
