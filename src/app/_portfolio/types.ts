// Types for structural clarity
export interface Project {
  id: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  link_url: string;
  link_label: string;
  secondary_link?: string;
  secondary_link_label?: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  color: string;
  icon: string;
  skills: string[];
}

export interface Company {
  id: string;
  company_name: string;
  logo_text: string;
  logo_url?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  icon: string;
  title: string;
  subtitle: string;
  url: string;
  brand_color: string;
  is_visible: boolean;
}

export interface Profile {
  name: string;
  subtitle: string;
  description: string;
  bio_p1: string;
  bio_p2: string;
  bio_p3: string;
  cv_url?: string;
  certificate_bubble_url?: string;
  cv_visible?: boolean;
  certificate_bubble_visible?: boolean;
}

export type NavHandler = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void;
