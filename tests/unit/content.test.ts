import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript serverless function
import { validate } from '../../api/content.js';

describe('/api/content request checking', () => {
  it('accepts the requests the site makes', () => {
    for (const p of [
      'site_settings?select=key,value',
      'projects?select=id,slug,title,category,image,published&order=sort_order.asc,created_at.desc',
      'projects?select=*&slug=eq.my-project%20x&limit=1',
      'blog_posts?select=*&id=eq.123e4567-e89b-12d3-a456-426614174000&limit=1',
      'services?select=*&order=sort_order.asc,created_at.asc',
    ]) expect(validate(p)).toBe(p);
  });

  it('blocks anything else', () => {
    for (const p of [
      'users?select=*', 'orders?select=*', 'projects', 'projects?select=*,secret(*)',
      'projects?select=*&slug=eq.a;drop', 'projects?select=*&select=id', 'projects?select=*&foo=bar',
      'projects?select=*&limit=99999', 'site_settings?select=key&or=(a.eq.1)',
      `projects?select=*&slug=eq.${'a'.repeat(400)}`, '', undefined, 42,
    ]) expect(validate(p)).toBeNull();
  });
});
