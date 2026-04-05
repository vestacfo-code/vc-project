import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { StitchAmbientBackground } from '@/components/layout/StitchRefinedPageLayout';
import { ArrowLeft, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/utils/adminUtils';
import { useToast } from '@/hooks/use-toast';

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

const PressRelease = () => {
  const { slug } = useParams<{ slug: string }>();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [release, setRelease] = useState<PressRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchRelease();
  }, [slug, isAdmin]);

  const fetchRelease = async () => {
    if (!slug) return;
    try {
      let query = supabase.from('press_releases').select('*').eq('slug', slug).single();
      const { data, error } = await query;
      
      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
        return;
      }

      if (!isAdmin && data.status === 'draft') {
        setNotFound(true);
        return;
      }
      setRelease(data as PressRelease);
    } catch (error) {
      console.error('Error fetching press release:', error);
      toast({
        title: 'Error loading press release',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      paragraph.trim() ? (
        <p key={index} className="mb-4 leading-relaxed text-vesta-navy/90">
          {paragraph}
        </p>
      ) : (
        <br key={index} />
      )
    ));
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-vesta-cream font-stitch-body">
        <StitchAmbientBackground />
        <Header />
        <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded w-32 mb-8"></div>
            <div className="h-12 bg-white/50 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-white/50 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-white/50 rounded"></div>
              <div className="h-4 bg-white/50 rounded w-5/6"></div>
              <div className="h-4 bg-white/50 rounded w-4/5"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !release) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-vesta-cream font-stitch-body">
        <StitchAmbientBackground />
        <Header />
        <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
          <Link 
            to="/press" 
            className="inline-flex items-center text-vesta-navy/80 hover:text-vesta-navy transition-colors mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Press
          </Link>
          
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-12 text-center shadow-lg">
            <h1 className="text-2xl font-bold mb-4 text-vesta-navy">Press Release Not Found</h1>
            <p className="text-vesta-navy/80 mb-6">
              The press release you're looking for doesn't exist or may have been removed.
            </p>
            <Link to="/press">
              <Button className="bg-vesta-navy hover:bg-vesta-navy-muted/30 text-white">Return to Press</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-vesta-cream font-stitch-body">
      <StitchAmbientBackground />

      <Header />

      <article className="relative z-10 container mx-auto px-4 py-8 sm:py-16 max-w-4xl">
        <div className="mb-8">
          <Link 
            to="/press" 
            className="inline-flex items-center text-vesta-navy/80 hover:text-vesta-navy transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Press
          </Link>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-6 sm:p-8 shadow-lg">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-vesta-navy/20 bg-vesta-mist/60 text-xs text-vesta-navy">
                FOR IMMEDIATE RELEASE
              </Badge>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-vesta-navy leading-tight">
              {release.title}
            </h1>
            
            {release.excerpt && (
              <p className="text-lg sm:text-xl text-vesta-navy/80 mb-6 leading-relaxed">
                {release.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-vesta-navy/80 border-b border-vesta-navy/50 pb-6 mb-6">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(release.release_date || release.published_at || release.created_at)}</span>
            </div>

            {release.featured_image_url && (
              <div className="mb-8">
                <img 
                  src={release.featured_image_url} 
                  alt={release.title}
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none mb-8">
            {formatContent(release.content)}
          </div>
          
          {release.press_contact && (
            <div className="border-t border-vesta-navy/50 pt-6 mt-8">
              <h3 className="text-sm font-semibold text-vesta-navy/80 mb-3">MEDIA CONTACT</h3>
              <div className="flex items-center gap-2 text-vesta-navy">
                <Mail className="h-4 w-4" />
                <a 
                  href={`mailto:${release.press_contact}`} 
                  className="text-purple-600 hover:text-purple-800 hover:underline"
                >
                  {release.press_contact}
                </a>
              </div>
            </div>
          )}
        </div>
      </article>
      
      <Footer />
    </div>
  );
};

export default PressRelease;