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
      primary: 'bg-integrate-quickbooks',
      hover: 'hover:bg-integrate-quickbooks-hover',
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
      primary: 'bg-integrate-xero',
      hover: 'hover:bg-integrate-xero-hover',
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
      primary: 'bg-integrate-wave',
      hover: 'hover:bg-integrate-wave-hover',
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
      primary: 'bg-gradient-to-r from-integrate-zoho-from to-integrate-zoho-to',
      hover: 'hover:from-integrate-zoho-from-hover hover:to-integrate-zoho-to-hover',
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