import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import JobApplication from '@/components/JobApplication';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { StitchAmbientBackground } from '@/components/layout/StitchRefinedPageLayout';

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
}

const Careers = () => {
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobRole | null>(null);
  const [showApplication, setShowApplication] = useState(false);

  useEffect(() => {
    loadJobRoles();
  }, []);

  const loadJobRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobRoles(data || []);
    } catch (error) {
      console.error('Error loading job roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job: JobRole) => {
    setSelectedJob(job);
    setShowApplication(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gradient section wrapper */}
      <div className="relative flex-1">
        <StitchAmbientBackground />

        <div className="relative z-10 font-stitch-body">
          <Header />
          
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            {/* Hero Section */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="mb-4 font-stitch text-4xl font-semibold leading-tight tracking-tight text-vesta-navy sm:text-5xl md:mb-6 md:text-6xl">
                Join Our Team
              </h1>
              <p className="text-vesta-navy/80 text-lg md:text-xl max-w-3xl mx-auto mb-4">
                We're building the future of financial intelligence. Join our team of innovators, 
                engineers, and visionaries who are passionate about transforming how businesses 
                understand their financial performance.
              </p>
              <p className="text-vesta-navy/65 text-base md:text-lg">
                At Vesta, every role matters. Every contribution shapes the future of AI-powered finance.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="text-lg text-vesta-navy/80">Loading opportunities...</div>
              </div>
            ) : jobRoles.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <h2 className="text-2xl font-semibold mb-4 text-vesta-navy">No Open Positions</h2>
                  <p className="text-vesta-navy/80 mb-6">
                    We don't have any open positions at the moment, but we're always looking for talented individuals.
                  </p>
                  <p className="text-vesta-navy/80">
                    Feel free to reach out to us directly at{' '}
                    <a href="mailto:careers@vesta.ai" className="text-vesta-navy font-medium hover:underline">
                      careers@vesta.ai
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-semibold text-vesta-navy mb-2">Open Positions</h2>
                  <p className="text-vesta-navy/80">
                    {jobRoles.length} {jobRoles.length === 1 ? 'opportunity' : 'opportunities'} available
                  </p>
                </div>
                
                <div className="space-y-6">
                  {jobRoles.map((job) => (
                    <div 
                      key={job.id} 
                      className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-300"
                    >
                      <div className="flex flex-col gap-6">
                        {/* Job Info */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl md:text-2xl font-semibold text-vesta-navy mb-3">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-sm text-vesta-navy/80">
                              <div className="flex items-center">
                                <Briefcase className="w-4 h-4 mr-2" />
                                {job.department}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {job.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                {job.type}
                              </div>
                            </div>
                            {job.salary_range && (
                              <div className="mt-3">
                                <Badge variant="secondary" className="text-sm font-medium bg-vesta-mist/40 text-vesta-navy">
                                  {job.salary_range}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Apply Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to={`/careers/${job.slug}`}>
                            <Button 
                              variant="outline"
                              size="lg"
                              className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-transparent border-vesta-navy text-vesta-navy hover:bg-vesta-navy hover:text-white"
                            >
                              View Details
                            </Button>
                          </Link>
                          <Button 
                            onClick={() => handleApply(job)}
                            size="lg"
                            className="w-full sm:w-auto px-8 py-3 text-sm font-medium bg-vesta-navy hover:bg-vesta-navy-muted/30 text-white"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Link */}
            <div className="mt-16 pt-8 text-center border-t border-vesta-navy/50">
              <Link 
                to="/careers-admin" 
                className="text-sm text-vesta-navy/65 hover:text-vesta-navy/90 transition-colors"
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Job Application Modal */}
      {showApplication && selectedJob && (
        <JobApplication
          jobRole={selectedJob}
          onClose={() => {
            setShowApplication(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default Careers;
