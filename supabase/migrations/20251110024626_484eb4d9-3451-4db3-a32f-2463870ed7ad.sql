-- Create training status enum
CREATE TYPE training_status AS ENUM ('assigned', 'in_progress', 'completed');

-- Main training content table
CREATE TABLE public.training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Enable RLS
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_materials
CREATE POLICY "HR and super admins can manage training materials"
  ON public.training_materials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_staff', 'super_admin')
    )
  );

CREATE POLICY "Admin users can view training materials"
  ON public.training_materials
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr_staff', 'super_admin')
    )
  );

-- Training assignments table
CREATE TABLE public.training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_material_id UUID REFERENCES public.training_materials(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  due_date DATE,
  status training_status DEFAULT 'assigned',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  UNIQUE(training_material_id, assigned_to)
);

-- Enable RLS
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_assignments
CREATE POLICY "HR and super admins can create assignments"
  ON public.training_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_staff', 'super_admin')
    )
  );

CREATE POLICY "Users can view their own assignments"
  ON public.training_assignments
  FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "HR and super admins can view all assignments"
  ON public.training_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_staff', 'super_admin')
    )
  );

CREATE POLICY "Users can update their own assignment progress"
  ON public.training_assignments
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "HR and super admins can delete assignments"
  ON public.training_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_staff', 'super_admin')
    )
  );

-- Training attachments table
CREATE TABLE public.training_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_material_id UUID REFERENCES public.training_materials(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_attachments
CREATE POLICY "HR and super admins can manage attachments"
  ON public.training_attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('hr_staff', 'super_admin')
    )
  );

CREATE POLICY "Admin users can view attachments"
  ON public.training_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr_staff', 'super_admin')
    )
  );

-- Create storage bucket for training materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-materials', 'training-materials', false);

-- Storage RLS policies
CREATE POLICY "HR and super admins can upload training materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('hr_staff', 'super_admin')
  )
);

CREATE POLICY "HR and super admins can update training materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('hr_staff', 'super_admin')
  )
);

CREATE POLICY "Admin users can view training materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'training-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'hr_staff', 'super_admin')
  )
);

CREATE POLICY "HR and super admins can delete training materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-materials' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('hr_staff', 'super_admin')
  )
);

-- Helper function to get training stats
CREATE OR REPLACE FUNCTION public.get_user_training_stats(p_user_id UUID)
RETURNS TABLE(
  total_assigned INTEGER,
  completed INTEGER,
  in_progress INTEGER,
  overdue INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::INTEGER as total_assigned,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress,
    COUNT(*) FILTER (WHERE status != 'completed' AND due_date < CURRENT_DATE)::INTEGER as overdue
  FROM public.training_assignments
  WHERE assigned_to = p_user_id;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_training_material_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER training_material_updated_at
BEFORE UPDATE ON public.training_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_training_material_updated_at();

-- Trigger to auto-set started_at and completed_at
CREATE OR REPLACE FUNCTION public.update_training_assignment_started_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status = 'assigned' THEN
    NEW.started_at = now();
  END IF;
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
    NEW.progress_percentage = 100;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER training_assignment_status_update
BEFORE UPDATE ON public.training_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_training_assignment_started_at();