import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedContact, ParseResult } from './types';

export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((row: any) => normalizeContact(row));
        resolve({ data, errors: [] });
      },
      error: (error) => {
        resolve({ data: [], errors: [{ row: 0, field: 'file', message: error.message }] });
      }
    });
  });
};

export const parseXLSX = (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const contacts = jsonData.map((row: any) => normalizeContact(row));
        resolve({ data: contacts, errors: [] });
      } catch (error) {
        resolve({ data: [], errors: [{ row: 0, field: 'file', message: (error as Error).message }] });
      }
    };
    
    reader.onerror = () => {
      resolve({ data: [], errors: [{ row: 0, field: 'file', message: 'Failed to read file' }] });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const normalizeContact = (row: any): ParsedContact => {
  // Extract business/company name (handle various column names)
  const businessName = row['Business Name'] || row.business_name || row.company || row.Company || '';
  
  // Extract phone (handle various column names)
  const phoneRaw = row['Phone Number'] || row.phone || row.Phone || row.mobile || row.Mobile || '';
  
  // Extract address if available
  const address = row.Address || row.address || '';
  const postalCode = row['Postal Code'] || row.postal_code || row.zip || '';
  const fullAddress = address && postalCode ? `${address}, ${postalCode}` : (address || postalCode);
  
  // If we have a business name but no first/last name, use business name as company
  // and leave first/last empty so the display logic will use company name
  const contact: ParsedContact = {
    first_name: row.first_name || row['First Name'] || row.firstName || '',
    last_name: row.last_name || row['Last Name'] || row.lastName || '',
    email: row.email || row.Email || '',
    phone: normalizePhone(phoneRaw),
    company: businessName,
    title: row.title || row.Title || row.position || row['License Type'] || '',
    status: normalizeStatus(row.status || row.Status || 'lead'),
    source: normalizeSource(row.source || row.Source || 'import'),
    linkedin_url: row.linkedin_url || row.linkedin || row.LinkedIn || '',
    website: row.website || row.Website || '',
    notes: fullAddress || row.notes || row.Notes || row['Business Category'] || '',
    tags: normalizeTags(row.tags || row.Tags || row['Town Centre'] || '')
  };
  
  return contact;
};

export const normalizePhone = (phone: string | number): string => {
  if (!phone) return '';
  
  // Convert to string first (handles both string and number from Excel)
  const phoneStr = String(phone).trim();
  
  // Remove all non-numeric characters
  const cleaned = phoneStr.replace(/\D/g, '');
  
  // If it's a US/Canada number (10 digits), format it
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has country code
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+${cleaned}`;
  }
  
  // Return with + if doesn't have it
  return cleaned ? `+${cleaned}` : '';
};

const normalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'lead': 'lead',
    'prospect': 'prospect',
    'customer': 'customer',
    'inactive': 'inactive'
  };
  
  return statusMap[status.toLowerCase()] || 'lead';
};

const normalizeSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
    'cold_call': 'cold_call',
    'cold call': 'cold_call',
    'referral': 'referral',
    'website': 'website',
    'import': 'import',
    'other': 'other'
  };
  
  return sourceMap[source.toLowerCase()] || 'import';
};

const normalizeTags = (tags: string | string[]): string[] => {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  
  // Handle comma-separated or pipe-separated tags
  return tags.split(/[,|;]/).map(tag => tag.trim()).filter(Boolean);
};

export const generateTemplate = (): string => {
  const headers = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'company',
    'title',
    'status',
    'source',
    'linkedin_url',
    'website',
    'tags',
    'notes'
  ];
  
  const sampleData = [
    'John',
    'Doe',
    'john.doe@example.com',
    '+14155551234',
    'Acme Corp',
    'CEO',
    'lead',
    'referral',
    'https://linkedin.com/in/johndoe',
    'https://acmecorp.com',
    'vip,hot-lead',
    'Met at conference'
  ];
  
  return `${headers.join(',')}\n${sampleData.join(',')}\n`;
};

export const downloadTemplate = () => {
  const csv = generateTemplate();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crm_contacts_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
