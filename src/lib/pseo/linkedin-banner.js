// LinkedIn Banner pSEO Configuration
// Banner dimensions: 1584 x 396 pixels

export const LINKEDIN_BANNER_WIDTH = 1584;
export const LINKEDIN_BANNER_HEIGHT = 396;

// Profile photo safe zone - rectangular area at bottom-left
// Based on LinkedIn mobile view measurements (larger than desktop)
// Desktop: 364 x 224 pixels, Mobile: 568 x 264 pixels
// Using mobile dimensions as safe zone since it's larger
export const SAFE_ZONE = {
  left: 0,
  top: 132,    // 396 - 264 = 132 (bottom-aligned)
  width: 568,
  height: 264
};

// Template categories for the LinkedIn Banner Generator
export const linkedinBannerCategories = [
  { id: 'developer', label: 'Developer', icon: 'code', description: 'Perfect for software engineers, full-stack developers, and tech professionals' },
  { id: 'designer', label: 'Designer', icon: 'palette', description: 'Creative banners for UI/UX designers, graphic designers, and artists' },
  { id: 'marketer', label: 'Marketer', icon: 'megaphone', description: 'Eye-catching banners for marketing professionals and growth hackers' },
  { id: 'recruiter', label: 'Recruiter', icon: 'users', description: 'Professional banners for HR and talent acquisition specialists' },
  { id: 'freelancer', label: 'Freelancer', icon: 'briefcase', description: 'Stand out as an independent professional or consultant' },
  { id: 'corporate', label: 'Corporate', icon: 'building', description: 'Clean, professional banners for executives and business leaders' },
  { id: 'neo-brutalist', label: 'Neo-Brutalist', icon: 'star', description: 'Bold, high-contrast designs that make a statement' },
  { id: 'personal-brand', label: 'Personal Brand', icon: 'star', description: 'Build your personal brand with impactful banners' }
];

// pSEO Personas for landing pages
export const linkedinPersonas = [
  {
    slug: 'developers',
    label: 'Developers',
    headline: 'LinkedIn Banner Generator for Developers',
    description: 'Create professional LinkedIn banners designed for software developers. Dark themes, code aesthetics, and tech-focused designs that showcase your programming expertise.',
    tips: ['Highlight your tech stack', 'Use dark or terminal-style themes', 'Include GitHub stats or contributions'],
    templateIds: ['dev-dark-terminal', 'dev-minimal-code', 'dev-gradient-tech']
  },
  {
    slug: 'designers',
    label: 'Designers',
    headline: 'LinkedIn Banner Generator for Designers',
    description: 'Beautiful LinkedIn banners for creative professionals. Showcase your design aesthetic with elegant typography and striking visuals.',
    tips: ['Show your design style', 'Use bold typography', 'Include portfolio highlights'],
    templateIds: ['designer-creative', 'designer-minimal', 'designer-bold']
  },
  {
    slug: 'marketers',
    label: 'Marketers',
    headline: 'LinkedIn Banner Generator for Marketers',
    description: 'High-converting LinkedIn banners for marketing professionals. Include CTAs, social proof, and brand-building elements.',
    tips: ['Add a clear CTA', 'Highlight key metrics', 'Include brand colors'],
    templateIds: ['marketer-growth', 'marketer-brand', 'marketer-data']
  },
  {
    slug: 'recruiters',
    label: 'Recruiters',
    headline: 'LinkedIn Banner Generator for Recruiters',
    description: 'Professional LinkedIn banners that attract top talent. Show your company culture and open positions.',
    tips: ['Show company culture', 'Include hiring message', 'Add company branding'],
    templateIds: ['recruiter-hiring', 'recruiter-corporate', 'recruiter-modern']
  },
  {
    slug: 'freelancers',
    label: 'Freelancers',
    headline: 'LinkedIn Banner Generator for Freelancers',
    description: 'Stand out as an independent professional with banners that showcase your expertise and services.',
    tips: ['Highlight your specialty', 'Add contact info or website', 'Show client logos if permitted'],
    templateIds: ['freelancer-modern', 'freelancer-creative', 'freelancer-minimal']
  },
  {
    slug: 'executives',
    label: 'Executives',
    headline: 'LinkedIn Banner Generator for Executives',
    description: 'Clean, authoritative LinkedIn banners for C-suite executives and business leaders.',
    tips: ['Keep it professional and clean', 'Add company branding subtly', 'Use premium typography'],
    templateIds: ['corporate-executive', 'corporate-minimal', 'corporate-brand']
  }
];

// LinkedIn banner sizes/dimensions for pSEO
export const linkedinSizes = [
  {
    slug: '1584x396',
    type: 'personal-profile',
    label: 'Personal Profile Banner',
    width: 1584,
    height: 396,
    aspectRatio: '4:1',
    safeZone: { left: 200, bottom: 176 },
    notes: 'Standard LinkedIn profile cover photo. Profile picture overlaps bottom-left corner.',
    isDefault: true
  },
  {
    slug: '1128x191',
    type: 'company-page',
    label: 'Company Page Cover',
    width: 1128,
    height: 191,
    aspectRatio: '6:1',
    safeZone: null,
    notes: 'LinkedIn company page cover image. Logo appears separately below.'
  },
  {
    slug: '1536x768',
    type: 'linkedin-article',
    label: 'LinkedIn Article Cover',
    width: 1536,
    height: 768,
    aspectRatio: '2:1',
    safeZone: null,
    notes: 'Featured image for LinkedIn articles and newsletters.'
  }
];

// Use cases for pSEO pages
export const linkedinBannerUseCases = [
  {
    slug: 'job-seekers',
    label: 'Job Seekers',
    headline: 'LinkedIn Banner for Job Seekers',
    description: 'Create a LinkedIn banner that helps you stand out to recruiters and hiring managers.',
    tips: ['Highlight your key skills', 'Add "Open to Work" messaging', 'Keep it professional yet memorable']
  },
  {
    slug: 'thought-leaders',
    label: 'Thought Leaders',
    headline: 'LinkedIn Banner for Thought Leaders',
    description: 'Establish your authority with a banner that showcases your expertise and personal brand.',
    tips: ['Include your signature topic', 'Add speaking credentials', 'Use professional photography']
  },
  {
    slug: 'entrepreneurs',
    label: 'Entrepreneurs',
    headline: 'LinkedIn Banner for Entrepreneurs',
    description: 'Build credibility and attract investors, partners, and customers with a founder-focused banner.',
    tips: ['Feature your startup branding', 'Highlight traction metrics', 'Add your mission statement']
  },
  {
    slug: 'students',
    label: 'Students',
    headline: 'LinkedIn Banner for Students',
    description: 'Create a professional first impression as you enter the job market.',
    tips: ['Highlight your field of study', 'Add internship interests', 'Keep it clean and aspirational']
  }
];
