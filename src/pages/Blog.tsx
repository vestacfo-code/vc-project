import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BlogPostCard from '@/components/BlogPostCard';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/utils/adminUtils';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_name: string;
  status: 'draft' | 'published';
  tags: string[] | null;
  created_at: string;
  published_at: string | null;
  slug: string;
  featured_image_url: string | null;
}

const Blog = () => {
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [isAdmin]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-admin users only see published posts
      if (!isAdmin) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setPosts((data || []) as BlogPost[]);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: 'Error loading blog posts',
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
        <div className="absolute inset-0 bg-gradient-to-b from-vesta-cream via-vesta-mist/30 to-vesta-mist/50" />
        {/* Decorative gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl" />
      
        <div className="relative z-10">
          <Header />
          
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-vesta-navy leading-tight mb-4 md:mb-6 tracking-tight">
                Vesta Blog
              </h1>
              <p className="text-vesta-navy/80 text-lg md:text-xl max-w-2xl mx-auto">
                Insights on financial intelligence, AI-powered analysis, and growing your business smarter.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl h-64 border border-white/60"></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <h2 className="text-2xl font-semibold mb-4 text-vesta-navy">No Blog Posts Yet</h2>
                  <p className="text-vesta-navy/80 mb-6">
                    Our blog is growing! Check back soon for insights about financial analysis, business intelligence, and the latest updates from the Vesta team.
                  </p>
                  <Link 
                    to="/"
                    className="inline-flex items-center justify-center bg-vesta-navy hover:bg-vesta-navy-muted/30 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-300">
                    <BlogPostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Blog;
