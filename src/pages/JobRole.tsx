import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { ArrowLeft, MapPin, Clock, Briefcase, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import JobApplication from '@/components/JobApplication';
import { useToast } from '@/hooks/use-toast';
import { CustomQuestion } from '@/types/customQuestions';

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  salary_range: string;
  slug: string;
  custom_questions?: CustomQuestion[];
}

const JobRole = () => {
  const { slug } = useParams();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      loadJobRole(slug);
    }
  }, [slug]);

  const loadJobRole = async (slug: string) => {
    try {
      const decodedSlug = decodeURIComponent(slug);
      
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .eq('slug', decodedSlug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading job role:', error);
        setNotFound(true);
        return;
      }

      const parsedData = {
        ...data,
        custom_questions: data.custom_questions as unknown as CustomQuestion[]
      } as JobRole;

      setJobRole(parsedData);
    } catch (error) {
      console.error('Error loading job role:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${jobRole?.title} - Vesta Careers`,
          text: `Check out this job opportunity: ${jobRole?.title} at Vesta`,
          url: url,
        });
      } catch (error) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copied!",
        description: "Job posting link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatRequirements = (requirements: string) => {
    return requirements.split('\n').filter(req => req.trim()).map((req, index) => (
      <li key={index} className="flex items-start">
        <span className="w-1.5 h-1.5 rounded-full bg-vesta-navy mt-2.5 mr-3 flex-shrink-0"></span>
        <span className="leading-relaxed">{req.replace('• ', '')}</span>
      </li>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vesta-cream via-vesta-mist/30 to-vesta-mist/50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center py-16">
            <div className="text-lg text-vesta-navy/80">Loading job details...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !jobRole) {
    return <Navigate to="/careers" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vesta-cream via-vesta-mist/30 to-vesta-mist/50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
      
      <Header />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <Link 
            to="/careers" 
            className="inline-flex items-center text-vesta-navy/80 hover:text-vesta-navy transition-colors group text-sm sm:text-base"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Careers
          </Link>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className="px-4 sm:px-6 py-3 text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm border-vesta-navy/15 text-vesta-navy hover:bg-white hover:text-vesta-navy"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              onClick={() => setShowApplication(true)}
              size="lg"
              className="px-6 sm:px-8 py-3 text-sm sm:text-base font-medium bg-vesta-navy text-white hover:bg-vesta-navy-muted/30 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Apply Now
            </Button>
          </div>
        </div>
        
        {/* Job Header Card */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-6 sm:p-8 mb-8 shadow-lg">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-vesta-navy mb-4">
            {jobRole.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 mb-4 text-sm sm:text-base text-vesta-navy/80">
            <div className="flex items-center">
              <Briefcase className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              {jobRole.department}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              {jobRole.location}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              <span className="capitalize">{jobRole.type}</span>
            </div>
          </div>
          
          {jobRole.salary_range && (
            <Badge 
              variant="secondary" 
              className="text-base sm:text-lg font-medium px-3 sm:px-4 py-1 sm:py-2 bg-purple-100 text-purple-800"
            >
              {jobRole.salary_range}
            </Badge>
          )}
        </div>

        {/* Job Content */}
        <div className="space-y-8">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-6 sm:p-8 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-vesta-navy mb-4">
              About This Role
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-vesta-navy/80">
              {jobRole.description}
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/30 p-6 sm:p-8 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-vesta-navy mb-4">
              What We're Looking For
            </h2>
            <ul className="space-y-3 sm:space-y-4 text-base sm:text-lg text-vesta-navy/80">
              {formatRequirements(jobRole.requirements)}
            </ul>
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-12 text-center">
          <Button 
            onClick={() => setShowApplication(true)}
            size="lg"
            className="w-full sm:w-auto px-8 sm:px-12 py-4 text-base sm:text-lg font-medium bg-vesta-navy text-white hover:bg-vesta-navy-muted/30 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Apply for This Position
          </Button>
        </div>
      </div>

      <Footer />

      {/* Job Application Modal */}
      {showApplication && (
        <JobApplication
          jobRole={jobRole}
          onClose={() => setShowApplication(false)}
        />
      )}
    </div>
  );
};

export default JobRole;