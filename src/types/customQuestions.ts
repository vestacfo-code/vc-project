export interface CustomQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'phone' | 'url';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}
