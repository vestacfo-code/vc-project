import { useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { HotelNav, HotelBottomNav } from './HotelNav';
import { pageMorphTransition } from '@/lib/motion';

interface HotelLayoutProps {
  children: React.ReactNode;
}

export const HotelLayout = ({ children }: HotelLayoutProps) => {
  const location = useLocation();

  return (
    <LayoutGroup id="hotel-app">
      <div className="flex min-h-screen bg-slate-950">
        <HotelNav />
        <main className="flex-1 min-w-0 pb-16 lg:pb-0 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.988, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.012, filter: 'blur(6px)' }}
              transition={pageMorphTransition}
              className="min-h-full"
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
