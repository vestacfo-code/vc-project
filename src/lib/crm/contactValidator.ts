import { ParsedContact, ValidationError, ValidationResult } from './types';

export const validateContact = (contact: ParsedContact, rowIndex: number): ValidationResult => {
  const errors: ValidationError[] = [];
  
  // Email validation
  if (contact.email && !isValidEmail(contact.email)) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: 'Invalid email format'
    });
  }
  
  // Phone validation
  if (contact.phone && !isValidPhone(contact.phone)) {
    errors.push({
      row: rowIndex,
      field: 'phone',
      message: 'Invalid phone format (use E.164 format, e.g., +14155551234)'
    });
  }
  
  // URL validations
  if (contact.linkedin_url && !isValidUrl(contact.linkedin_url)) {
    errors.push({
      row: rowIndex,
      field: 'linkedin_url',
      message: 'Invalid LinkedIn URL'
    });
  }
  
  if (contact.website && !isValidUrl(contact.website)) {
    errors.push({
      row: rowIndex,
      field: 'website',
      message: 'Invalid website URL'
    });
  }
  
  // At least one identifier required (email or phone)
  const hasEmail = contact.email && contact.email.trim() !== '';
  const hasPhone = contact.phone && contact.phone.trim() !== '';
  
  if (!hasEmail && !hasPhone) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: 'Either email or phone is required'
    });
  }
  
  // Name validation (at least first name, last name, or company required)
  const hasName = (contact.first_name && contact.first_name.trim()) || 
                  (contact.last_name && contact.last_name.trim()) || 
                  (contact.company && contact.company.trim());
  
  if (!hasName) {
    errors.push({
      row: rowIndex,
      field: 'last_name',
      message: 'Either first name, last name, or company is required'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateContacts = (contacts: ParsedContact[]): ValidationResult => {
  const allErrors: ValidationError[] = [];
  
  contacts.forEach((contact, index) => {
    const result = validateContact(contact, index + 1);
    allErrors.push(...result.errors);
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // E.164 format: +[country code][number]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const findDuplicates = (
  contacts: ParsedContact[],
  existingContacts: Array<{ email?: string; phone?: string }>
): Array<{ row: number; matchType: 'email' | 'phone'; matchValue: string }> => {
  const duplicates: Array<{ row: number; matchType: 'email' | 'phone'; matchValue: string }> = [];
  
  contacts.forEach((contact, index) => {
    // Check email duplicates
    if (contact.email) {
      const emailExists = existingContacts.some(
        existing => existing.email?.toLowerCase() === contact.email?.toLowerCase()
      );
      
      if (emailExists) {
        duplicates.push({
          row: index + 1,
          matchType: 'email',
          matchValue: contact.email
        });
      }
    }
    
    // Check phone duplicates
    if (contact.phone) {
      const phoneExists = existingContacts.some(
        existing => existing.phone === contact.phone
      );
      
      if (phoneExists) {
        duplicates.push({
          row: index + 1,
          matchType: 'phone',
          matchValue: contact.phone
        });
      }
    }
  });
  
  return duplicates;
};
