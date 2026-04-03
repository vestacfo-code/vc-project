import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomQuestion } from '@/types/customQuestions';

interface JobRole {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  custom_questions?: CustomQuestion[];
}

interface JobApplicationProps {
  jobRole: JobRole;
  onClose: () => void;
}

const JobApplication: React.FC<JobApplicationProps> = ({ jobRole, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    instagramHandle: '',
    linkedinUrl: '',
    city: '',
    state: '',
    country: '',
    resumeUrl: '',
    workAuthorization: '',
    earliestStartDate: '',
    whyWorkHere: '',
    references: '',
    backgroundCheckConsent: false,
    privacyPolicyConsent: false
  });
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleCustomAnswer = (questionId: string, value: any) => {
    setCustomAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const renderCustomQuestion = (question: CustomQuestion) => {
    const value = customAnswers[question.id] || '';
    const customInputClass = "mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#7ba3e8]/50 focus:ring-[#7ba3e8]/50";

    switch (question.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            id={question.id}
            type={question.type}
            value={value}
            onChange={(e) => handleCustomAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            className={customInputClass}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            id={question.id}
            value={value}
            onChange={(e) => handleCustomAnswer(question.id, e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            rows={4}
            className={customInputClass}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleCustomAnswer(question.id, val)}
          >
            <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder={question.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-900">
              {(question.options || []).map((option) => (
                <SelectItem key={option} value={option} className="text-white hover:bg-white/10 focus:bg-white/10">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <div className="mt-2 space-y-2">
            {(question.options || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${question.id}_${option}`}
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleCustomAnswer(question.id, e.target.value)}
                  required={question.required}
                  className="h-4 w-4 accent-[#7ba3e8]"
                />
                <Label htmlFor={`${question.id}_${option}`} className="font-normal text-white/80">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={question.id}
              checked={value === true}
              onCheckedChange={(checked) => handleCustomAnswer(question.id, checked)}
              className="border-white/30 data-[state=checked]:bg-[#7ba3e8] data-[state=checked]:border-[#7ba3e8]"
            />
            <Label htmlFor={question.id} className="font-normal text-white/80">
              {question.placeholder || 'Yes'}
            </Label>
          </div>
        );
      
      case 'date':
        return (
          <Input
            id={question.id}
            type="date"
            value={value}
            onChange={(e) => handleCustomAnswer(question.id, e.target.value)}
            required={question.required}
            className={customInputClass}
          />
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.backgroundCheckConsent || !formData.privacyPolicyConsent) {
      toast({
        title: "Consent Required",
        description: "Please accept both the background check and privacy policy to continue.",
        variant: "destructive"
      });
      return;
    }

    if (formData.whyWorkHere.length < 100) {
      toast({
        title: "More Details Needed",
        description: "Please provide at least 100 words for why you want to work here.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim() || !jobRole.id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const firstName = formData.fullName.split(' ')[0] || '';
    const lastName = formData.fullName.split(' ').slice(1).join(' ') || '';
    
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      toast({
        title: "Invalid Name",
        description: "Please provide a valid first and last name (minimum 2 characters each).",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address.",
        variant: "destructive"
      });
      return;
    }

    const missingCustomFields = (jobRole.custom_questions || [])
      .filter(q => {
        if (!q.required) return false;
        
        const answer = customAnswers[q.id];
        
        if (q.type === 'checkbox') {
          return answer === undefined || answer === null;
        }
        
        if (answer === undefined || answer === null || answer === '') {
          return true;
        }
        
        if (typeof answer === 'string' && answer.trim() === '') {
          return true;
        }
        
        return false;
      })
      .map(q => q.label);
    
    if (missingCustomFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please answer: ${missingCustomFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        job_role_id: jobRole.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        instagram_handle: formData.instagramHandle.trim() || null,
        linkedin_url: formData.linkedinUrl.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || null,
        resume_url: formData.resumeUrl.trim() || null,
        work_authorization: formData.workAuthorization || null,
        earliest_start_date: formData.earliestStartDate || null,
        why_work_here: formData.whyWorkHere.trim() || null,
        reference_info: formData.references.trim() || null,
        background_check_consent: formData.backgroundCheckConsent,
        privacy_policy_consent: formData.privacyPolicyConsent,
        submission_source: 'web',
        custom_answers: customAnswers
      };

      console.log('Submitting application data:', applicationData);

      const { error } = await supabase
        .from('job_applications')
        .insert(applicationData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

       // Send confirmation email (non-blocking)
       supabase.functions.invoke('send-application-confirmation', {
         body: {
           email: formData.email,
           firstName: firstName,
           lastName: lastName,
           jobTitle: jobRole.title,
           department: jobRole.department
         }
       }).then(({ error: emailError }) => {
         if (emailError) {
           console.error('Failed to send confirmation email:', emailError);
         } else {
           console.log('Confirmation email sent successfully');
         }
       });
 
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll review your application and get back to you soon.",
      });

      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = "mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#7ba3e8]/50 focus:ring-[#7ba3e8]/50";
  const selectClassName = "mt-1 bg-white/10 border-white/20 text-white";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      {/* Dark Glassmorphism modal */}
      <div className="w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] overflow-y-auto bg-gradient-to-b from-white/[0.08] to-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl shadow-black/40">
        {/* Inner glow effect */}
        <div className="absolute inset-[1px] rounded-[23px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/50 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 p-4 sm:p-6 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white pr-8 sm:pr-0">
              Apply for {jobRole.title}
            </h2>
            <p className="text-white/60 mt-1 text-sm sm:text-base">{jobRole.department} • {jobRole.location}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto text-white/50 hover:text-white transition-colors rounded-xl hover:bg-white/10 flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="text-white/90 font-medium">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className={inputClassName}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-white/90 font-medium">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white/90 font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label htmlFor="instagramHandle" className="text-white/90 font-medium">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    name="instagramHandle"
                    placeholder="@username"
                    value={formData.instagramHandle}
                    onChange={handleInputChange}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label htmlFor="linkedinUrl" className="text-white/90 font-medium">LinkedIn Profile</Label>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Location</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-white/90 font-medium">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-white/90 font-medium">State/Province *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-white/90 font-medium">Country *</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            {/* Resume/CV */}
            <div>
              <Label htmlFor="resumeUrl" className="text-white/90 font-medium">Resume/CV Link *</Label>
              <Input
                id="resumeUrl"
                name="resumeUrl"
                type="url"
                placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                value={formData.resumeUrl}
                onChange={handleInputChange}
                required
                className={inputClassName}
              />
              <p className="text-sm text-white/50 mt-1">
                Please ensure your resume is publicly accessible via this link
              </p>
            </div>

            {/* Legal Work Status */}
            <div>
              <Label htmlFor="workAuthorization" className="text-white/90 font-medium">Legal Work Status *</Label>
              <Select onValueChange={(value) => handleSelectChange('workAuthorization', value)}>
                <SelectTrigger className={selectClassName}>
                  <SelectValue placeholder="Select your work authorization status" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900">
                  <SelectItem value="us-citizen" className="text-white hover:bg-white/10 focus:bg-white/10">US Citizen</SelectItem>
                  <SelectItem value="us-permanent-resident" className="text-white hover:bg-white/10 focus:bg-white/10">US Permanent Resident</SelectItem>
                  <SelectItem value="canadian-citizen" className="text-white hover:bg-white/10 focus:bg-white/10">Canadian Citizen</SelectItem>
                  <SelectItem value="canadian-permanent-resident" className="text-white hover:bg-white/10 focus:bg-white/10">Canadian Permanent Resident</SelectItem>
                  <SelectItem value="us-work-visa" className="text-white hover:bg-white/10 focus:bg-white/10">US Work Visa (H1B, TN, etc.)</SelectItem>
                  <SelectItem value="canadian-work-permit" className="text-white hover:bg-white/10 focus:bg-white/10">Canadian Work Permit</SelectItem>
                  <SelectItem value="us-student-visa" className="text-white hover:bg-white/10 focus:bg-white/10">US Student Visa (F1 with OPT/CPT)</SelectItem>
                  <SelectItem value="canadian-study-permit" className="text-white hover:bg-white/10 focus:bg-white/10">Canadian Study Permit</SelectItem>
                  <SelectItem value="dual-citizen" className="text-white hover:bg-white/10 focus:bg-white/10">Dual Citizen (US/Canada)</SelectItem>
                  <SelectItem value="require-us-sponsorship" className="text-white hover:bg-white/10 focus:bg-white/10">Require US Sponsorship</SelectItem>
                  <SelectItem value="require-canadian-sponsorship" className="text-white hover:bg-white/10 focus:bg-white/10">Require Canadian Sponsorship</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-white/10 focus:bg-white/10">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div>
              <Label htmlFor="earliestStartDate" className="text-white/90 font-medium">Earliest Start Date</Label>
              <Input
                id="earliestStartDate"
                name="earliestStartDate"
                type="date"
                value={formData.earliestStartDate}
                onChange={handleInputChange}
                className={inputClassName}
              />
            </div>

            {/* Why Work Here */}
            <div>
              <Label htmlFor="whyWorkHere" className="text-white/90 font-medium">Why Do You Want to Work Here? *</Label>
              <Textarea
                id="whyWorkHere"
                name="whyWorkHere"
                rows={6}
                placeholder="Tell us what excites you about this role and our company. What would you bring to our team? (Minimum 100 words)"
                value={formData.whyWorkHere}
                onChange={handleInputChange}
                required
                className={`${inputClassName} resize-none`}
              />
              <p className="text-sm text-white/50 mt-1">
                {formData.whyWorkHere.length}/100 characters minimum
              </p>
            </div>

            {/* References */}
            <div>
              <Label htmlFor="references" className="text-white/90 font-medium">References (Optional)</Label>
              <Textarea
                id="references"
                name="references"
                rows={3}
                placeholder="Please provide 2-3 professional references with names, titles, companies, and contact information"
                value={formData.references}
                onChange={handleInputChange}
                className={`${inputClassName} resize-none`}
              />
            </div>

            {/* Custom Questions */}
            {jobRole.custom_questions && jobRole.custom_questions.length > 0 && (
              <div className="space-y-4 border-t border-white/10 pt-6">
                <h3 className="text-base sm:text-lg font-semibold text-white">Additional Questions</h3>
                {jobRole.custom_questions.map((question) => (
                  <div key={question.id}>
                    <Label htmlFor={question.id} className="text-white/90 font-medium">
                      {question.label}
                      {question.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    {renderCustomQuestion(question)}
                  </div>
                ))}
              </div>
            )}

            {/* Consent Checkboxes */}
            <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="backgroundCheck"
                  checked={formData.backgroundCheckConsent}
                  onCheckedChange={(checked) => handleCheckboxChange('backgroundCheckConsent', checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-[#7ba3e8] data-[state=checked]:border-[#7ba3e8]"
                />
                <Label htmlFor="backgroundCheck" className="text-sm leading-5 text-white/80">
                  I consent to a background check being conducted as part of the employment process *
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacyPolicy"
                  checked={formData.privacyPolicyConsent}
                  onCheckedChange={(checked) => handleCheckboxChange('privacyPolicyConsent', checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-[#7ba3e8] data-[state=checked]:border-[#7ba3e8]"
                />
                <Label htmlFor="privacyPolicy" className="text-sm leading-5 text-white/80">
                  I agree to the Privacy Policy and consent to the collection and processing of my personal data *
                </Label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 order-2 sm:order-1 bg-gradient-to-br from-[#7ba3e8] to-[#5a8ad4] hover:from-[#6a92d7] hover:to-[#4a7ac4] text-white py-3 rounded-xl font-medium shadow-lg shadow-[#7ba3e8]/20"
                size="lg"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                size="lg"
                className="order-1 sm:order-2 sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobApplication;