import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
interface PressRelease {
  id: string;
  title: string;
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
interface PressReleaseCardProps {
  release: PressRelease;
}
const PressReleaseCard = ({
  release
}: PressReleaseCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  return <Link to={`/press/${release.slug}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col bg-vesta-mist/40">
        <CardContent className="p-0">
          {release.featured_image_url && <div className="w-full h-48 overflow-hidden rounded-t-lg">
              <img src={release.featured_image_url} alt={release.title} className="w-full h-full object-cover transition-transform hover:scale-105" />
            </div>}
          
          <div className="p-6 flex-1 flex flex-col">
            
            <h3 className="text-xl font-semibold mb-3 text-vesta-navy hover:text-primary transition-colors">
              {release.title}
            </h3>
            
            {release.excerpt && <p className="text-vesta-navy/90 mb-4 line-clamp-3 leading-relaxed flex-1">
                {release.excerpt}
              </p>}
            
            <div className="mt-auto space-y-4">
              <div className="flex items-center gap-4 text-sm text-vesta-navy/80">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{release.author_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(release.release_date || release.published_at || release.created_at)}</span>
                </div>
              </div>
              
              <div className="text-primary text-sm font-medium">
                Read full release →
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>;
};
export default PressReleaseCard;