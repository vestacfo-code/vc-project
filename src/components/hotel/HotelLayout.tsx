import { useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { HotelNav, HotelBottomNav } from './HotelNav';

/** Light page transition — no blur/scale (those repaint the whole main column on every scroll frame). */
const hotelPageEase = [0.25, 0.1, 0.25, 1] as const;
const hotelPageTransition = { duration: 0.2, ease: hotelPageEase };

interface HotelLayoutProps {
  children: React.ReactNode;
}

export const HotelLayout = ({ children }: HotelLayoutProps) => {
  const location = useLocation();

  return (
    <LayoutGroup id="hotel-app">
      <div className="flex min-h-screen bg-vesta-cream text-vesta-navy">
        <HotelNav />
        <main className="flex-1 min-w-0 pb-16 lg:pb-0 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={hotelPageTransition}
              className="min-h-full flex flex-col [contain:layout_style]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <HotelBottomNav />
      </div>
    </LayoutGroup>
  );
};

export default HotelLayout;
