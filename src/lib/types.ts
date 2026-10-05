/** Shapes returned by the WordPress REST API at /wp-json/wp/v2. */

export interface Rendered {
  rendered: string;
  protected?: boolean;
}

export interface WPMediaSize {
  source_url: string;
  width: number;
  height: number;
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text: string;
  caption?: Rendered;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, WPMediaSize>;
  };
}

export interface WPTerm {
  id: number;
  name: string;
  slug: string;
  taxonomy: "category" | "post_tag";
  link: string;
  count?: number;
  description?: string;
}

export interface WPAuthor {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  avatar_urls?: Record<string, string>;
}

/** Yoast injects this when the plugin is active. It carries the SEO the site already earned. */
export interface YoastHead {
  title?: string;
  description?: string;
  robots?: Record<string, string>;
  canonical?: string;
  og_title?: string;
  og_description?: string;
  og_url?: string;
  og_site_name?: string;
  og_locale?: string;
  og_type?: string;
  article_published_time?: string;
  article_modified_time?: string;
  og_image?: Array<{ url: string; width?: number; height?: number; type?: string }>;
  twitter_card?: string;
  author?: string;
  schema?: { "@context": string; "@graph": unknown[] };
}

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  link: string;
  status: string;
  title: Rendered;
  content: Rendered;
  excerpt: Rendered;
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  yoast_head_json?: YoastHead;
  _embedded?: {
    "wp:featuredmedia"?: WPMedia[];
    "wp:term"?: WPTerm[][];
    author?: WPAuthor[];
  };
}

/** The flattened shape the UI actually consumes. */
export interface Article {
  id: number;
  slug: string;
  /** Path on our own site, derived from WordPress's own link so encoding always matches. */
  path: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  modified: string;
  author: { name: string; avatar?: string } | null;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  } | null;
  categories: Term[];
  tags: Term[];
  seo?: YoastHead;
}

export interface Term {
  id: number;
  name: string;
  slug: string;
  path: string;
  count: number;
  taxonomy: "category" | "post_tag";
}

export interface Paged<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
}
