import { HotelNav, HotelBottomNav } from './HotelNav';

interface HotelLayoutProps {
  children: React.ReactNode;
}

export const HotelLayout = ({ children }: HotelLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <HotelNav />
      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        {children}
      </main>
      <HotelBottomNav />
    </div>
  );
};

export default HotelLayout;
