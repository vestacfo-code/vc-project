import { useEffect } from 'react';

const DemoRedirect = () => {
  useEffect(() => {
    window.location.href = 'https://calendar.app.google/PWqhmizMxqUnRNpP9';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting to booking...</p>
    </div>
  );
};

export default DemoRedirect;
