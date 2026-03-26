export interface ParsedContact {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: string;
  source?: string;
  linkedin_url?: string;
  website?: string;
  tags?: string[];
  notes?: string;
}

export interface ParseResult {
  data: ParsedContact[];
  errors: Array<{ row: number; field: string; message: string }>;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
