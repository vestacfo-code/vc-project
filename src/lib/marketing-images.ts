/**
 * Local marketing images (AI-generated, stored in /public/marketing).
 * Replace files in public/marketing/ anytime — keep the same filenames or update paths here.
 */
export const marketingImages = {
  heroHotel: {
    src: '/marketing/hero-hotel.png',
    alt: 'Luxury hotel pool and property at golden hour',
  },
  analytics: {
    src: '/marketing/analytics-dashboard.png',
    alt: 'Computer screen showing hotel revenue and KPI analytics',
  },
  lobby: {
    src: '/marketing/hotel-lobby.png',
    alt: 'Bright hotel lobby and reception area',
  },
  team: {
    src: '/marketing/team-collab.png',
    alt: 'Team collaborating in a modern office',
  },
  workspace: {
    src: '/marketing/workspace-contact.png',
    alt: 'Clean desk with laptop and workspace details',
  },
  contact: {
    src: '/marketing/workspace-contact.png',
    alt: 'Laptop on a bright desk — get in touch',
  },
} as const;
