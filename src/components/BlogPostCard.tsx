import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';


interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  author_name: string;
  status: 'draft' | 'published';
  tags: string[] | null;
  created_at: string;
  published_at: string | null;
  slug: string;
  featured_image_url: string | null;
}

interface BlogPostCardProps {
  post: BlogPost;
}

const BlogPostCard = ({ post }: BlogPostCardProps) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link to={`/blog/${post.slug}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
        <CardContent className="p-0">
          <div className="w-full h-48 overflow-hidden rounded-t-lg">
            <img 
              src={post.featured_image_url || "/assets/004786ce-ad05-48fe-b1b9-d99efbfe5962.png"} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <div className="mb-3">
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                {post.status}
              </Badge>
            </div>
            
            <h3 className="text-xl font-semibold mb-3 text-foreground hover:text-primary transition-colors">
              {post.title}
            </h3>
            
            {post.excerpt && (
              <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-1">
                {post.excerpt}
              </p>
            )}
            
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{post.author_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="text-primary text-sm font-medium">
                Read more →
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BlogPostCard;