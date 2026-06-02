import blogPostsData from '../data/blogPosts.json';

export interface RelatedProduct {
  name: string;
  slug: string;
  image?: string;
  excerpt?: string;
  url: string;
}

export interface StaticBlogPost {
  id: number;
  title: string;
  slug: string;
  author: string;
  publish_date: string;
  reading_time: string;
  excerpt: string;
  featured_image: string;
  tags: string[];
  category: string;
  content: string;
  related_products?: RelatedProduct[];
}

export function getStaticBlogPosts(): StaticBlogPost[] {
  return blogPostsData as StaticBlogPost[];
}

export function getStaticBlogPostBySlug(slug: string): StaticBlogPost | undefined {
  const posts = getStaticBlogPosts();
  return posts.find(post => post.slug === slug);
}

export function getRelatedStaticBlogPosts(currentSlug: string, category: string, limit = 3): StaticBlogPost[] {
  const posts = getStaticBlogPosts();
  return posts
    .filter(post => post.slug !== currentSlug && (post.category === category || post.tags.some(tag => posts.find(p => p.slug === currentSlug)?.tags.includes(tag))))
    .slice(0, limit);
}

export function getPreviousAndNextPosts(currentSlug: string): { previous?: StaticBlogPost; next?: StaticBlogPost } {
  const posts = getStaticBlogPosts();
  const currentIndex = posts.findIndex(post => post.slug === currentSlug);
  if (currentIndex === -1) return {};

  return {
    previous: currentIndex > 0 ? posts[currentIndex - 1] : undefined,
    next: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : undefined
  };
}
