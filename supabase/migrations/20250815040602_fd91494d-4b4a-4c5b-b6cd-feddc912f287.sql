-- Create job roles table
CREATE TABLE public.job_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'full-time', -- full-time, part-time, contract, intern
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  salary_range TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_role_id UUID NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewing, interviewed, rejected, hired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for job roles (public read, admin manage)
CREATE POLICY "Anyone can view active job roles" 
ON public.job_roles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Service role can manage job roles" 
ON public.job_roles 
FOR ALL 
USING (true);

-- Create policies for job applications (public insert, admin view)
CREATE POLICY "Anyone can submit job applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can manage job applications" 
ON public.job_applications 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_job_roles_updated_at
BEFORE UPDATE ON public.job_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample job roles
INSERT INTO public.job_roles (title, department, location, type, description, requirements, salary_range) VALUES
('Senior Frontend Developer', 'Engineering', 'Remote', 'full-time', 
'Join our team to build the future of financial intelligence. You''ll work on cutting-edge AI-powered financial analysis tools using React, TypeScript, and modern web technologies.',
'• 5+ years of experience with React and TypeScript
• Experience with modern CSS frameworks (Tailwind CSS preferred)
• Strong understanding of web performance optimization
• Experience with testing frameworks (Jest, Cypress)
• Familiarity with AI/ML concepts is a plus',
'$120,000 - $160,000'),

('AI/ML Engineer', 'Engineering', 'Remote', 'full-time',
'Build and optimize AI models for financial analysis and business intelligence. Work with large datasets and implement machine learning solutions at scale.',
'• PhD or Master''s in Computer Science, Machine Learning, or related field
• 3+ years of experience with Python, TensorFlow/PyTorch
• Experience with financial data analysis
• Strong background in statistics and data science
• Experience with cloud platforms (AWS, GCP)
• Knowledge of LLMs and transformer models',
'$140,000 - $180,000'),

('Product Manager', 'Product', 'Remote', 'full-time',
'Lead product strategy and development for our financial AI platform. Work closely with engineering and design teams to deliver exceptional user experiences.',
'• 4+ years of product management experience
• Experience in fintech or AI products preferred
• Strong analytical and data-driven decision making
• Excellent communication and leadership skills
• Experience with agile development methodologies
• Understanding of financial markets and business intelligence',
'$110,000 - $140,000');