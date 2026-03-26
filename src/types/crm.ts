export type ContactStatus = 'lead' | 'prospect' | 'demo_scheduled' | 'customer' | 'inactive';
export type ContactSource = 'cold_call' | 'referral' | 'website' | 'import' | 'other';
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled';
export type CallOutcome = 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'wrong_number' | 'not_interested' | 'callback_requested';
export type CallDisposition = 'hot' | 'warm' | 'cold' | 'not_qualified';

export interface Contact {
  id: string;
  created_by: string;
  updated_by?: string;
  assigned_to?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status: ContactStatus;
  source: ContactSource;
  linkedin_url?: string;
  website?: string;
  address?: any;
  tags: string[];
  custom_fields?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contacted_at?: string;
  last_contacted_by?: string;
  next_follow_up?: string;
}

export interface Deal {
  id: string;
  contact_id: string;
  created_by: string;
  updated_by?: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  contact_id: string;
  deal_id?: string;
  created_by: string;
  updated_by?: string;
  activity_type: ActivityType;
  subject?: string;
  description?: string;
  outcome?: string;
  duration_minutes?: number;
  scheduled_at?: string;
  completed_at?: string;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  contact_id: string;
  caller_id: string;
  caller_name: string;
  caller_email: string;
  call_date: string;
  duration_seconds?: number;
  outcome?: CallOutcome;
  disposition?: CallDisposition;
  notes?: string;
  follow_up_date?: string;
  script_used?: string;
  created_at: string;
}

export interface CallScript {
  id: string;
  name: string;
  description?: string;
  script_content: string;
  tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ImportHistory {
  id: string;
  user_id: string;
  file_name: string;
  import_date: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  error_log?: Record<string, any>;
  import_type: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  changes?: Record<string, any>;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  stat_date: string;
  calls_made: number;
  calls_connected: number;
  contacts_created: number;
  deals_created: number;
  deals_closed: number;
  total_deal_value: number;
  activities_logged: number;
  created_at: string;
  updated_at: string;
}