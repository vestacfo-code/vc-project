import quickbooksLogo from '@/assets/quickbooks-logo.png';
import xeroLogo from '@/assets/xero-logo.png';
import waveLogo from '@/assets/wave-logo.png';
import zohoLogo from '@/assets/zoho-logo.png';

export interface IntegrationConfig {
  id: string;
  name: string;
  displayName: string;
  logo: string;
  colors: {
    primary: string;
    hover: string;
    text: string;
  };
  status: 'active' | 'coming-soon' | 'connected';
}

export const integrations: Record<string, IntegrationConfig> = {
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    displayName: 'QuickBooks',
    logo: quickbooksLogo,
    colors: {
      primary: 'bg-[#2CA01C]',
      hover: 'hover:bg-[#228516]',
      text: 'text-white'
    },
    status: 'active'
  },
  xero: {
    id: 'xero',
    name: 'Xero',
    displayName: 'Xero',
    logo: xeroLogo,
    colors: {
      primary: 'bg-[#13B5EA]',
      hover: 'hover:bg-[#0F9BC7]',
      text: 'text-white'
    },
    status: 'coming-soon'
  },
  wave: {
    id: 'wave',
    name: 'Wave',
    displayName: 'Wave Accounting',
    logo: waveLogo,
    colors: {
      primary: 'bg-[#266FE8]',
      hover: 'hover:bg-[#1E5BC0]',
      text: 'text-white'
    },
    status: 'active'
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho',
    displayName: 'Zoho Books',
    logo: zohoLogo,
    colors: {
      primary: 'bg-gradient-to-r from-[#1F4E79] to-[#4A90E2]',
      hover: 'hover:from-[#1A4268] hover:to-[#3A7BC8]',
      text: 'text-white'
    },
    status: 'active'
  }
};

export const getIntegrationConfig = (integrationId: string): IntegrationConfig => {
  return integrations[integrationId] || integrations.quickbooks;
};

export const getAvailableIntegrations = (): IntegrationConfig[] => {
  return Object.values(integrations);
};