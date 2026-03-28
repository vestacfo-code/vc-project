import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PressReleaseCard from '@/components/PressReleaseCard';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/utils/adminUtils';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

interface PressRelease {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  status: 'draft' | 'published';
  created_at: string;
  published_at: string | null;
  release_date: string | null;
  slug: string;
  featured_image_url: string | null;
  press_contact: string | null;
}

const Press = () => {
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReleases();
  }, [isAdmin]);

  const fetchReleases = async () => {
    try {
      let query = supabase
        .from('press_releases')
        .select('*')
        .order('release_date', { ascending: false, nullsFirst: false });

      // Non-admin users only see published releases
      if (!isAdmin) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setReleases((data || []) as PressRelease[]);
    } catch (error) {
      console.error('Error fetching press releases:', error);
      toast({
        title: 'Error loading press releases',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gradient section wrapper */}
      <div className="relative flex-1">
        {/* Purple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff]" />
        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
      
        <div className="relative z-10">
          <Header />
          
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-gray-900 leading-tight mb-4 md:mb-6 tracking-tight">
                Press & Media
              </h1>
              <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
                Latest news and announcements from Vesta.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl h-64 border border-white/60"></div>
                  </div>
                ))}
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">No Press Releases Yet</h2>
                  <p className="text-gray-600 mb-6">
                    Stay tuned for company announcements, product launches, and other important updates from the Vesta team.
                  </p>
                  <Link 
                    to="/"
                    className="inline-flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {releases.map((release) => (
                  <div key={release.id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <PressReleaseCard release={release} />
                  </div>
                ))}
              </div>
            )}

            {/* Press Contact */}
            <div className="mt-16 text-center">
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-8 max-w-xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Press Inquiries</h3>
                <p className="text-gray-600 mb-4">For media inquiries, please contact:</p>
                <a 
                  href="mailto:press@vesta.ai" 
                  className="text-gray-900 font-medium hover:underline"
                >
                  press@vesta.ai
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Press;
