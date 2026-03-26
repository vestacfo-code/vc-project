import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/utils/adminUtils';
import { useToast } from '@/hooks/use-toast';

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

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [slug, isAdmin]);

  const fetchPost = async () => {
    if (!slug) return;
    
    try {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

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

      setPost(data as BlogPost);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: 'Error loading blog post',
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
        <p key={index} className="mb-4 leading-relaxed text-gray-700">
          {paragraph}
        </p>
      ) : (
        <br key={index} />
      )
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff]">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
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

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff]">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Link 
            to="/blog" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
          
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-12 text-center shadow-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-6">
              The blog post you're looking for doesn't exist or may have been removed.
            </p>
            <Link to="/blog">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">Return to Blog</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#e8e4ff] to-[#ddd6ff] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      
      <Header />
      
      <article className="relative z-10 container mx-auto px-4 py-8 sm:py-16 max-w-4xl">
        <div className="mb-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-6 sm:p-8 shadow-lg">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {post.status}
              </Badge>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 leading-tight">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-6 text-gray-600 border-b border-gray-200/50 pb-6 mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>
            </div>

            {post.featured_image_url && (
              <div className="mb-8">
                <img 
                  src={post.featured_image_url} 
                  alt={post.title}
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none mb-8">
            {formatContent(post.content)}
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="border-t border-gray-200/50 pt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">TAGS</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-white/50 border-gray-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
      
      <Footer />
    </div>
  );
};

export default BlogPost;