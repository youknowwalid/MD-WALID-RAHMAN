import { expect, test, Locator, Page } from '@playwright/test';
/** The sample database starts with the admin's projects switch on (the default). */
const PROJECTS_HIDDEN = true;
import AxeBuilder from '@axe-core/playwright';
import { FIXTURE_CAPABILITY_GROUPS, FIXTURE_GLOBAL, FIXTURE_HIRE_OFFERS, FIXTURE_PAYMENTS, FIXTURE_PRODUCT, FIXTURE_SEO } from './fixtures.mjs';

// The app holds no content of its own. Names and texts below come from made-up fixtures (tests/e2e/fixtures.mjs),
// which the sample database serves as if they were saved in the admin.
const HERO_NAME = FIXTURE_GLOBAL.sectionTitles.heroName;
const SITE_URL = FIXTURE_SEO.siteUrl.replace(/\/+$/, '');

const CONNECTED = 'http://127.0.0.1:4174';
const PLAIN = 'http://127.0.0.1:4175';
const API = 'http://127.0.0.1:54321';
const ADMIN = { email: 'admin@test.local', password: 'correct-horse-battery' };

// Third-party hosts (fonts, tag manager) are not reachable from every environment; ignore their failures.
const ignorable = /googletagmanager|googleapis|gstatic|google-analytics|doubleclick|ERR_(TUNNEL|CERT|NAME|INTERNET|BLOCKED)|Failed to load resource/i;

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !ignorable.test(m.text())) errors.push(`console: ${m.text()}`); });
  return errors;
}

test.beforeEach(async ({ request }) => { await request.get(`${API}/__reset`); });

test.describe('public site (connected)', () => {
  test('home page renders real content, correct title and no errors', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(CONNECTED + '/');
    await expect(page).toHaveTitle(FIXTURE_SEO.defaultTitle);
    await expect(page.locator('h1')).toContainText(HERO_NAME);
    if (!PROJECTS_HIDDEN) await expect(page.getByRole('heading', { name: 'Brand One' })).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeAttached();
    // Fabricated placeholder content must be gone
    await expect(page.getByText('Sarah Johnson')).toHaveCount(0);
    await expect(page.getByText('Add introductory video URL')).toHaveCount(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', FIXTURE_SEO.defaultDescription);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE_URL + '/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', SITE_URL + '/og-image.png');
    expect(errors).toEqual([]);
  });

  test('no horizontal scrolling on any page', async ({ page }) => {
    for (const path of ['/', '/resources', '/projects/brand-one', '/blog/hello-world', '/privacy-policy', '/admin', '/nope']) {
      await page.goto(CONNECTED + path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });

  test('menu links navigate (including the mobile menu)', async ({ page, isMobile }) => {
    await page.goto(CONNECTED + '/');
    if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
    const nav = isMobile ? page.locator('#mobile-menu') : page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#contact')).toBeInViewport();
    // Resources link is hidden while there are no products
    await expect(page.getByRole('link', { name: 'Resources' })).toHaveCount(0);
  });

  test('blog pages open from the home page and back-navigation works', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    if (!PROJECTS_HIDDEN) {
      await page.locator('a[href="/projects/brand-one"]').first().click();
      await expect(page).toHaveURL(/\/projects\/brand-one$/);
      await expect(page.locator('h1')).toHaveText('Brand One');
      await expect(page).toHaveTitle(FIXTURE_SEO.titleTemplate.replace('%s', 'Brand One'));
      await page.getByRole('link', { name: 'All Projects' }).click();
      await expect(page).toHaveURL(/\/#projects$/);
    }

    await page.locator('a[href="/blog/hello-world"]').first().click();
    await expect(page.locator('h1')).toHaveText('Hello World');
    await expect(page.getByRole('heading', { name: 'A heading' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'one' }).first()).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });

  test('while projects are hidden, home and project pages show the region notice and no project', async ({ page }) => {
    test.skip(!PROJECTS_HIDDEN, 'projects are shown');
    await page.goto(CONNECTED + '/');
    const section = page.locator('#projects');
    await expect(section.getByRole('heading', { name: 'Not available in your region' })).toBeVisible();
    await expect(section.getByRole('link', { name: 'Request a private look' })).toHaveAttribute('href', '/#contact');
    await expect(page.locator('a[href^="/projects/"]')).toHaveCount(0);

    await page.goto(CONNECTED + '/projects/brand-one');
    await expect(page.getByRole('heading', { name: 'Not available in your region' })).toBeVisible();
    await expect(page.getByText('Brand One')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('the articles page lists every article and each card opens its own page', async ({ page }) => {
    await page.goto(CONNECTED + '/articles');
    await expect(page.locator('h1')).toHaveText('Articles');
    await page.locator('a[href="/blog/hello-world"]').click();
    await expect(page).toHaveURL(/\/blog\/hello-world$/);
    await expect(page.locator('h1')).toHaveText('Hello World');
  });

  test('project page shows the case-study sections', async ({ page }) => {
    test.skip(PROJECTS_HIDDEN, 'projects are hidden');
    const errors = watchErrors(page);
    await page.goto(CONNECTED + '/projects/brand-one');
    await expect(page.locator('h1')).toHaveText('Brand One');
    await expect(page.getByText('A short intro line for Brand One.')).toBeVisible();
    await expect(page.getByText('Retail')).toBeVisible();
    await expect(page.getByText('Branding, Logo design')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Challenge' })).toBeVisible();
    await expect(page.getByText('First paragraph of the case study.')).toBeVisible();
    await expect(page.getByRole('heading', { name: "Client's feedback" })).toBeVisible();
    await expect(page.getByText('Acme delivered beyond our expectations.')).toBeVisible();
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/#contact');
    // no solution text and no gallery in the sample project: those sections stay hidden
    await expect(page.getByRole('heading', { name: 'Solution' })).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('project page does not scroll sideways', async ({ page }) => {
    await page.goto(CONNECTED + '/projects/brand-one');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('unknown pages show a 404 that is not indexed', async ({ page }) => {
    await page.goto(CONNECTED + '/no-such-page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('contact: FAQ beside the form, one answer open at a time, no contact cards repeated', async ({ page }) => {
    await page.goto(CONNECTED + '/#contact');
    const section = page.locator('#contact');
    await expect(section.getByRole('button', { name: 'How much does a project cost?' })).toHaveAttribute('aria-expanded', 'false');
    await expect(section.getByText('Projects start at 25k BDT.')).toBeHidden();
    await section.getByRole('button', { name: 'How much does a project cost?' }).click();
    await expect(section.getByText('Projects start at 25k BDT.')).toBeVisible();
    await section.getByRole('button', { name: 'Do I own everything?' }).click();
    await expect(section.getByText('Yes, everything.')).toBeVisible();
    await expect(section.getByText('Projects start at 25k BDT.')).toBeHidden();
    await expect(section.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
    // The form card starts and ends level with the heading and the last question, and the whole section stays short.
    if (page.viewportSize()!.width >= 1024) {
      await page.waitForTimeout(1500); // let the section's entrance animation finish
      const form = (await section.getByRole('form', { name: 'Contact form' }).boundingBox())!;
      const head = (await section.getByRole('heading', { level: 2 }).boundingBox())!;
      const last = (await section.locator('[role="list"]').boundingBox())!;
      expect(Math.abs(form.y - head.y)).toBeLessThanOrEqual(4);
      expect(Math.abs(form.y + form.height - (last.y + last.height))).toBeLessThanOrEqual(12);
      expect((await section.boundingBox())!.height).toBeLessThanOrEqual(560);
    }
  });

  test('hero: Text Me and Portfolio buttons, resume link in the footer', async ({ page, request }) => {
    await request.post(`${API}/__seed-settings`, { data: { key: 'hero', value: { cvUrl: 'https://files.example/resume.pdf' } } });
    await page.goto(CONNECTED + '/');
    const heroEl = page.locator('#home');
    await expect(heroEl.getByRole('link', { name: /Text Me/ })).toBeVisible();
    await expect(heroEl.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/#projects');
    await expect(heroEl.getByText('Download CV')).toHaveCount(0);
    await expect(page.locator('footer').getByRole('link', { name: 'Download My Resume' })).toHaveAttribute('href', 'https://files.example/resume.pdf');
    await request.post(`${API}/__seed-settings`, { data: { key: 'hero', value: { cvUrl: '' } } });
  });

  test('contact form saves a message and shows confirmation', async ({ page, request }) => {
    await page.goto(CONNECTED + '/#contact');
    await page.getByLabel('Name', { exact: true }).fill('Jane Visitor');
    await page.getByLabel('Email', { exact: true }).fill('jane@example.com');
    await page.getByLabel('Message').fill('I would like to work with you.');
    await page.waitForTimeout(3200); // the anti-spam timer
    await page.getByRole('button', { name: 'Send Message' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Thank you' })).toBeVisible();
    const db = await (await request.get(`${API}/__db`)).json();
    expect(db.contact_submissions).toHaveLength(1);
    expect(db.contact_submissions[0]).toMatchObject({ name: 'Jane Visitor', email: 'jane@example.com', message: 'I would like to work with you.' });
  });

  test('contact form: bots (honeypot / too fast) are silently dropped', async ({ page, request }) => {
    await page.clock.setFixedTime(new Date('2026-01-01T00:00:00Z')); // frozen clock: no time passes, however slow the machine is
    await page.goto(CONNECTED + '/#contact');
    await page.getByLabel('Name', { exact: true }).fill('Bot');
    await page.getByLabel('Email', { exact: true }).fill('bot@example.com');
    await page.getByLabel('Message').fill('buy now');
    await page.getByRole('button', { name: 'Send Message' }).click(); // immediately: too fast
    await page.waitForTimeout(300);
    const db = await (await request.get(`${API}/__db`)).json();
    expect(db.contact_submissions).toHaveLength(0);
  });

  test('contact form: shows a friendly message when rate limited', async ({ page }) => {
    await page.goto(CONNECTED + '/#contact');
    await page.waitForTimeout(3200);
    for (let i = 0; i < 6; i++) {
      await page.getByLabel('Name', { exact: true }).fill('Spammer');
      await page.getByLabel('Email', { exact: true }).fill('s@example.com');
      await page.getByLabel('Message').fill('msg ' + i);
      await page.getByRole('button', { name: 'Send Message' }).click();
      await page.waitForTimeout(3100);
    }
    await expect(page.getByRole('status').filter({ hasText: 'several messages' })).toBeVisible();
  });

  test('accessibility: home page has no serious violations', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
});

test.describe('logos and intro video', () => {
  const seed = (request: any, key: string, value: object) =>
    request.post(`${API}/__seed-settings`, { data: { key, value } });

  test('the footer shows only the uploaded logo, and the home header shows its wordmark', async ({ page, request }) => {
    await seed(request, 'global', { siteLogo: `${API}/storage/v1/object/public/site-media/images/h.png`, footerLogo: `${API}/storage/v1/object/public/site-media/images/f.png` });
    await page.goto(CONNECTED + '/');
    await expect(page.locator('footer img[src$="f.png"]')).toBeAttached();
    await expect(page.locator('footer').getByText('acmestudio', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByText('acmestudio', { exact: true })).toHaveCount(1);
  });

  test('formatted texts (founder story, legal pages) show bold, italic and alignment without the marks', async ({ page, request }) => {
    await seed(request, 'global', {
      founderStory: '[justify] The **first** paragraph.\n\n[right] The *second* one.',
      privacyPolicy: '[right] Your **data** stays yours.',
    });
    await page.goto(CONNECTED + '/privacy-policy');
    await expect(page.locator('p', { hasText: 'Your data stays yours.' })).toHaveCSS('text-align', 'right');
    await expect(page.locator('span.font-bold', { hasText: 'data' })).toBeVisible();
    await expect(page.locator('main')).not.toContainText('[right]');
    await page.goto(CONNECTED + '/');
    const card = page.locator('footer').getByTestId('founder-card');
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: 'Read my story' }).click();
    const dialog = page.getByRole('dialog', { name: FIXTURE_GLOBAL.founderName });
    await expect(dialog.locator('p', { hasText: 'The first paragraph.' })).toHaveCSS('text-align', 'justify');
    await expect(dialog.locator('p', { hasText: 'The second one.' })).toHaveCSS('text-align', 'right');
    await expect(dialog.locator('span.italic', { hasText: 'second' })).toBeVisible();
    await expect(dialog).not.toContainText('*');
  });

  test('footer: no Navigation column; the founder card opens the story popup and lines up with the left side', async ({ page, request }) => {
    await seed(request, 'global', {
      footerLogo: `${API}/storage/v1/object/public/site-media/images/f.png`,
      socialLinks: [{ platform: 'LinkedIn', url: 'https://linkedin.com/in/someone' }],
    });
    await page.goto(CONNECTED + '/');
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: 'Navigation' })).toHaveCount(0);
    await expect(footer.getByRole('navigation')).toHaveCount(0);
    const card = footer.getByTestId('founder-card');
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByText('A word from the founder')).toBeVisible();
    await expect(card.getByText(FIXTURE_GLOBAL.founderName)).toBeVisible();
    const c = (await card.boundingBox())!;
    const width = page.viewportSize()!.width;
    if (width >= 1024) {
      // The card is exactly as tall as the left side: its top meets the logo, its bottom meets the social icons and the last contact line.
      // Read every box in one instant, so a late layout shift cannot sit between two measurements.
      const m = await page.evaluate(() => {
        const box = (el: Element | null) => { const r = el!.getBoundingClientRect(); return { y: r.y, height: r.height }; };
        const f = document.querySelector('footer')!;
        return {
          card: box(f.querySelector('[data-testid="founder-card"]')),
          logo: box(f.querySelector('img[src$="f.png"]')),
          social: box(f.querySelector('a[aria-label*="LinkedIn"]')),
          phone: box(f.querySelector('a[href^="tel:"]')),
        };
      });
      expect(Math.abs(m.card.y - m.logo.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(m.card.y + m.card.height - (m.social.y + m.social.height))).toBeLessThanOrEqual(2);
      expect(Math.abs(m.card.y + m.card.height - (m.phone.y + m.phone.height))).toBeLessThanOrEqual(3);
    } else if (width < 768) {
      const b = (await card.getByRole('button', { name: 'Read my story' }).boundingBox())!;
      expect(b.width).toBeGreaterThan(c.width - 40); // a full-width button on phones
    }
    await card.getByRole('button', { name: 'Read my story' }).click();
    const dialog = page.getByRole('dialog', { name: FIXTURE_GLOBAL.founderName });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("I'm Alex, a designer")).toBeVisible();
    await expect(dialog.getByRole('link', { name: "Let's work together" })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('footer: the founder card shows the texts saved in the admin, and no button without a story', async ({ page, request }) => {
    await seed(request, 'global', { founderQuote: 'Quality over quantity, always.', founderRole: 'CEO', founderStory: ' ' });
    await page.goto(CONNECTED + '/');
    const card = page.locator('footer').getByTestId('founder-card');
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByText('Quality over quantity, always.')).toBeVisible();
    await expect(card.getByText('CEO')).toBeVisible();
    await expect(card.getByRole('button')).toHaveCount(0);
  });

  test('client logos replace the company names in the home strip and keep its height', async ({ page, request }) => {
    const img = (n: string) => `${API}/storage/v1/object/public/site-media/images/${n}.png`;
    await seed(request, 'global', { clientLogos: [
      { name: 'Acme Studio', image: img('a'), url: 'https://acme.example', hidden: false },
      { name: 'Northwind', image: img('n'), url: '', hidden: false },
      { name: 'Hidden Co', image: img('h2'), url: '', hidden: true },
    ] });
    await page.goto(CONNECTED + '/');
    // With only a few logos each half of the loop is repeated so the strip always reaches both screen edges.
    const row = page.locator('.home-marquee-row').first();
    await expect(row.locator('img[alt="Acme Studio"]').first()).toBeAttached();
    await expect(row.locator('img[alt="Northwind"]').first()).toBeAttached();
    await expect(row.locator('img[alt="Hidden Co"]')).toHaveCount(0);
    await expect(row.getByRole('link', { name: 'Acme Studio' }).first()).toHaveAttribute('href', 'https://acme.example');
    const box = await row.boundingBox();
    expect(box!.height).toBeGreaterThan(23); // 24 px on phones, 28.5 px on desktop: the same as the text names
    expect(box!.height).toBeLessThan(31); // same row height as the text names it replaces
    await seed(request, 'global', { clientLogos: [] });
  });

  test('team section: members from the admin show as a looping deck with a 3-line limit', async ({ page, request }) => {
    await seed(request, 'global', { teamMembers: [
      { name: 'Ayesha Noor', role: 'Designer', photo: '', quote: 'Shapes every brand into something people remember. '.repeat(2).trim(), hidden: false },
      { name: 'Rafi Hasan', role: 'Developer', photo: '', quote: 'Builds it fast.', hidden: false },
      { name: 'Hidden Person', role: 'x', photo: '', quote: '', hidden: true },
    ] });
    await page.goto(CONNECTED + '/');
    const team = page.locator('#team');
    await expect(team.getByText('Ayesha Noor')).toBeVisible();
    await expect(team.getByText('Hidden Person')).toHaveCount(0);
    const lines = await team.locator('p.line-clamp-3').evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
    expect(lines).toBeLessThanOrEqual(3);
    await team.getByRole('button', { name: 'Next team member' }).click();
    await expect(team.getByText('Rafi Hasan')).toBeVisible();
    await team.getByRole('button', { name: 'Next team member' }).click();
    await expect(team.getByText('Ayesha Noor')).toBeVisible(); // loops back
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await seed(request, 'global', { teamMembers: [] });
  });

  test('work with me: the two default offers show, and a hidden one disappears', async ({ page, request }) => {
    await page.goto(CONNECTED + '/');
    const hire = page.locator('#hire');
    await expect(hire.getByRole('heading', { name: 'Work With Me', level: 2 })).toBeVisible();
    await expect(hire.getByRole('heading', { name: 'Fixed Project' })).toBeVisible();
    await expect(hire.getByRole('heading', { name: 'Monthly Retainer' })).toBeVisible();
    await expect(hire.getByRole('link', { name: 'Request Proposal' })).toHaveAttribute('href', '/#contact');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(hire.getByText('Starting at')).toBeVisible();
    await expect(hire.getByText('25k BDT')).toBeVisible();
    await expect(page.getByText('Pricing Plans')).toHaveCount(0);
    await expect(page.locator('i.home-dot')).toHaveCount(0); // the small section pills are gone
    // The buttons sit clear of the checklist, on one line, at the bottom of both cards.
    const tops: number[] = [];
    for (const name of ['Request Proposal', 'Book a Call']) {
      const btn = await page.locator('#hire').getByRole('link', { name }).boundingBox();
      const lastItem = await page.locator('#hire article', { has: page.getByRole('link', { name }) }).locator('li').last().boundingBox();
      expect(btn!.y - (lastItem!.y + lastItem!.height)).toBeGreaterThanOrEqual(24);
      expect(btn!.height).toBeGreaterThanOrEqual(52);
      tops.push(Math.round(btn!.y));
    }
    if (page.viewportSize()!.width >= 768) expect(Math.abs(tops[0] - tops[1])).toBeLessThanOrEqual(1);
    await seed(request, 'global', { hireOffers: [
      { name: 'Only Offer', tag: 'Custom', description: 'd', features: ['One', 'Two'], buttonText: 'Talk', buttonUrl: '/#contact', dark: false, hidden: false },
      { name: 'Secret Offer', tag: '', description: '', features: [], buttonText: '', buttonUrl: '', dark: true, hidden: true },
    ] });
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#hire').getByRole('heading', { name: 'Only Offer' })).toBeVisible();
    await expect(page.locator('#hire').getByText('Secret Offer')).toHaveCount(0);
    await seed(request, 'global', { hireOffers: FIXTURE_HIRE_OFFERS });
  });

  const isPhone = (page: Page) => page.viewportSize()!.width < 768;
  const fakeRows = (n: number, make: (i: number) => object) =>
    Array.from({ length: n }, (_, i) => ({ id: `00000000-0000-4000-8000-00000000${String(i + 10).padStart(4, '0')}`, sort_order: i, ...make(i) }));

  test('hero numbers are the same size and the unit sits in the label', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    const nums = page.locator('dd:visible');
    await expect(nums).toHaveCount(3);
    const sizes = await nums.evaluateAll((els) => els.map((e) => getComputedStyle(e).fontSize));
    expect(new Set(sizes).size).toBe(1);
    await expect(page.locator('dt:visible', { hasText: 'Years Experience' })).toBeVisible();
    await expect(nums.first()).not.toContainText('Yrs');
  });

  test('the menu button shows three lines, not four squares', async ({ page }) => {
    test.skip(!isPhone(page), 'the menu button is only on phones');
    await page.goto(CONNECTED + '/');
    await expect(page.getByRole('button', { name: 'Open menu' }).locator('svg.lucide-menu')).toHaveCount(1);
  });

  test('"What I can do": category tabs with small chips, one compact card, a chip only highlights', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    const card = page.locator('#services .home-on-dark');
    await card.scrollIntoViewIfNeeded();
    await expect(page.locator('#services').getByRole('heading', { name: 'What I Can Do for Your Business' })).toBeVisible();
    await expect(card.getByRole('heading')).toHaveCount(0); // the title sits above the dark box, like the other section titles
    await expect(page.locator('#skills')).toHaveCount(0); // the old Specialities and Skills sections are gone
    await expect(page.getByRole('heading', { name: 'My Specialities' })).toHaveCount(0);
    const tabs = card.getByRole('tab');
    await expect(tabs).toHaveCount(3);
    const chips = card.getByRole('tabpanel').getByRole('button');
    await expect(chips).toHaveCount(4);
    await expect(chips.first()).toHaveText('Brand Identity & Development');
    const heights: number[] = [];
    for (let i = 0; i < 3; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
      heights.push(Math.round((await card.boundingBox())!.height));
    }
    await expect(chips).toHaveCount(3); // Creative & Content
    await tabs.nth(1).click();
    await expect(chips).toHaveCount(5); // Technology & Product
    const compact = isPhone(page) ? 250 : 230;
    for (const h of heights) expect(h).toBeLessThanOrEqual(compact);
    if (isPhone(page)) expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1); // same height on every tab
    // a chip only highlights: nothing opens and the address stays the same
    const url = page.url();
    await chips.first().click();
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
    await chips.nth(1).click();
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'false');
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await chips.nth(1).click();
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'false');
    expect(page.url()).toBe(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('phones: testimonials move on by themselves, and stay still with reduced motion', async ({ page }) => {
    test.skip(!isPhone(page), 'the automatic strip is the phone layout');
    test.setTimeout(45_000);
    await page.route('**/rest/v1/testimonials*', (route) => route.fulfill({ json: fakeRows(4, (i) => ({ name: `Client ${i}`, role: 'CEO', avatar: '', content: `Kind words number ${i}.` })) }));
    await page.goto(CONNECTED + '/');
    const strip = page.getByRole('region', { name: 'Testimonials', exact: true });
    await strip.scrollIntoViewIfNeeded();
    await expect.poll(() => strip.evaluate((el) => el.scrollLeft), { timeout: 12_000 }).toBeGreaterThan(40);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(CONNECTED + '/');
    const still = page.getByRole('region', { name: 'Testimonials', exact: true });
    await still.scrollIntoViewIfNeeded();
    await page.waitForTimeout(6500);
    expect(await still.evaluate((el) => el.scrollLeft)).toBeLessThan(5);
  });

  test('team section shows a plain list with reduced motion and is absent with no members', async ({ page, request }) => {
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#team')).toHaveCount(0);
    await seed(request, 'global', { teamMembers: [
      { name: 'Ayesha Noor', role: 'Designer', photo: '', quote: 'One', hidden: false },
      { name: 'Rafi Hasan', role: 'Developer', photo: '', quote: 'Two', hidden: false },
    ] });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#team').getByText('Ayesha Noor')).toBeVisible();
    await expect(page.locator('#team').getByText('Rafi Hasan')).toBeVisible();
    await expect(page.locator('#team').getByRole('button', { name: 'Next team member' })).toHaveCount(0);
    await seed(request, 'global', { teamMembers: [] });
  });

  test('without logos, no site-name text appears in the footer', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    await expect(page.locator('footer').getByText('acmestudio', { exact: true })).toHaveCount(0);
  });

  test('a video file with no playable picture shows a notice instead of a silent black box', async ({ page, request }) => {
    await seed(request, 'global', { aboutVideoUrl: `${API}/__audio.wav` });
    await page.goto(CONNECTED + '/#about');
    await expect(page.getByRole('alert').filter({ hasText: "can't display this video" })).toBeVisible();
  });
});

test.describe('brand colors', () => {
  test('gradient accent can be chosen in the admin and is used across the site', async ({ page }) => {
    await page.goto(CONNECTED + '/admin');
    await page.getByLabel('E-mail').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: 'Branding Colors' }).click();
    await page.getByRole('radio', { name: 'gradient' }).click();
    await page.getByRole('button', { name: 'Ocean' }).click();
    await page.getByLabel('Middle color (hex code)').fill('#7b61ff');
    await page.getByRole('button', { name: 'Save & Publish' }).click();
    await expect(page.getByText('Brand colors published.')).toBeVisible();

    await page.goto(CONNECTED + '/');
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-accent', 'gradient');
    const grad = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent-gradient'));
    expect(grad).toContain('linear-gradient(135deg, #00c6ff, #7b61ff, #0072ff)');

    // The home page has a brand colour of its own and keeps it whatever the admin picks.
    const homeCta = await page.getByRole('link', { name: 'Text Me' }).first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(homeCta).toBe('rgb(195, 237, 58)');

    // Every other public page shares the home page's brand colour too, so the whole site looks the same.
    await page.goto(CONNECTED + '/no-such-page');
    const other = await page.getByRole('link', { name: 'Back to the homepage' }).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(other).toBe('rgb(195, 237, 58)');
  });

  test('solid mode still works (default look unchanged)', async ({ page }) => {
    await page.goto(CONNECTED + '/no-such-page');
    await expect(page.locator('html')).not.toHaveAttribute('data-accent', 'gradient');
    const bg = await page.getByRole('link', { name: 'Back to the homepage' }).evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toBe('none');
  });
});

test.describe('first visit on a new device (no flash of old content)', () => {
  const seed = (request: any, key: string, value: object) =>
    request.post(`${API}/__seed-settings`, { data: { key, value } });

  // A brand-new browser has no saved copy of the settings. The page must wait for the real ones instead of
  // painting the built-in colours/texts first and swapping them a moment later.
  test('the first painted frame already has the saved colour and tagline', async ({ page, request }) => {
    await seed(request, 'global', { primaryColor: '#12a4ff', brandTagline: 'Saved tagline from the database.' });
    await page.addInitScript(() => {
      const w = window as any;
      w.__looks = [];
      const look = () => {
        if (document.querySelector('#home h1')) {
          const tag = document.querySelector('#home p.text-text-muted')?.textContent ?? '';
          const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
          const key = `${accent}|${tag}`;
          if (w.__looks[w.__looks.length - 1] !== key) w.__looks.push(key);
        }
        requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    });
    // Slow the settings request down so a premature paint would be easy to catch.
    await page.route('**/rest/v1/site_settings*', async (route) => { await new Promise((r) => setTimeout(r, 400)); await route.continue(); });
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#home h1')).toBeVisible();
    await page.waitForTimeout(300);
    const looks = await page.evaluate(() => (window as any).__looks as string[]);
    expect(looks).toEqual(['#12a4ff|Saved tagline from the database.']);
  });

  test('the site still appears when the database cannot be reached', async ({ page }) => {
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#home h1')).toBeVisible();
  });

  test('the hero heading keeps its size while it is typed (no layout jump)', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    const heading = page.locator('#home h1');
    await expect(heading).toBeVisible();
    const early = (await heading.boundingBox())!.height;
    await page.waitForTimeout(2600);
    const later = (await heading.boundingBox())!.height;
    expect(later).toBe(early);
  });
});

test.describe('zero-configuration mode (no database connected)', () => {
  test('site works with built-in content and no errors', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(PLAIN + '/');
    await expect(page.locator('#home h1')).toBeVisible(); // the built-in defaults hold no content: only the page's structure shows
    await expect(page.getByText(PROJECTS_HIDDEN ? 'Not available in your region' : 'Selected projects will be shown here soon.')).toBeAttached();
    await expect(page.getByText('Sarah Johnson')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('admin explains that the database is not connected', async ({ page }) => {
    await page.goto(PLAIN + '/admin');
    await expect(page.getByRole('heading', { name: 'Database not connected yet' })).toBeVisible();
  });

  test('contact form falls back to the e-mail app', async ({ page }) => {
    await page.goto(PLAIN + '/#contact');
    await page.getByLabel('Name', { exact: true }).fill('Jane');
    await page.getByLabel('Email', { exact: true }).fill('jane@example.com');
    await page.getByLabel('Message').fill('Hi there');
    await page.waitForTimeout(3200);
    await page.getByRole('button', { name: 'Send Message' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'e-mail app' })).toBeVisible();
  });
});

test.describe('admin panel', () => {
  // The formatting boxes in the admin are live "what you see is what you get" boxes, not plain text areas.
  async function typeRich(page: Page, box: Locator, text: string) {
    await box.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) await page.keyboard.press('Enter');
      if (lines[i]) await page.keyboard.insertText(lines[i]);
    }
  }
  async function selectIn(box: Locator, needle: string) {
    await box.evaluate((el, n) => {
      (el as HTMLElement).focus();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = w.nextNode())) {
        const i = (node.nodeValue || '').indexOf(n);
        if (i >= 0) {
          const r = document.createRange();
          r.setStart(node, i);
          r.setEnd(node, i + n.length);
          const sel = window.getSelection()!;
          sel.removeAllRanges();
          sel.addRange(r);
          return;
        }
      }
      throw new Error('text not found: ' + n);
    }, needle);
  }

  async function login(page: Page) {
    await page.goto(CONNECTED + '/admin');
    await page.getByLabel('E-mail').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  }

  test('rejects wrong passwords', async ({ page }) => {
    await page.goto(CONNECTED + '/admin');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.getByLabel('E-mail').fill(ADMIN.email);
    await page.getByLabel('Password').fill('wrong-password-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Incorrect e-mail or password.');
    await expect(page.getByRole('heading', { name: 'Admin Access' })).toBeVisible();
  });

  test('admin: add a team member with a 100-character limit and see it on the site', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Team' }).click();
    await page.getByRole('button', { name: 'Add a member' }).click();
    await page.getByLabel('Name').fill('Nadia Karim');
    await page.getByLabel('Role').fill('Strategist');
    const quote = page.getByRole('textbox', { name: /Short line/ });
    await quote.click();
    await page.keyboard.insertText('x'.repeat(150));
    await expect(quote).toHaveText('x'.repeat(100));
    await typeRich(page, quote, 'Plans the work so it lands.');
    await page.getByRole('button', { name: /Save & Publish/ }).click();
    await expect(page.getByText('Team saved and published.')).toBeVisible();
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#team').getByText('Nadia Karim')).toBeVisible();
  });

  test('admin wears the brand: Inter Tight, lime accent and dark text on the lime buttons', async ({ page }) => {
    await login(page);
    const style = (sel: string, prop: string) => page.locator(sel).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    expect(await style('.admin-v2', 'font-family')).toContain('Inter Tight');
    expect(await style('.admin-v2', 'background-color')).toBe('rgb(13, 17, 23)');
    expect(await style('nav[aria-label="Admin sections"] [aria-current="page"]', 'background-color')).toBe('rgb(195, 237, 58)');
    const addNew = page.getByRole('button', { name: 'Add new' });
    expect(await addNew.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(195, 237, 58)');
    expect(await addNew.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(13, 17, 23)'); // readable on lime
  });

  test('admin: bold, italic, regular and alignment buttons format an article, and the site shows it', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Blog' }).click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Post title').fill('Styled post');
    await page.getByLabel('Short summary').fill('A summary.');
    const article = page.getByRole('textbox', { name: 'Full article' });
    const saved = page.getByTestId('f-content-value'); // the text exactly as it will be saved
    await typeRich(page, article, 'Hello brave new world\n\nSecond paragraph here');
    await expect(saved).toHaveValue('Hello brave new world\n\nSecond paragraph here');

    await selectIn(article, 'brave');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(article.locator('b', { hasText: 'brave' })).toBeVisible(); // bold right away, inside the box
    await expect(saved).toHaveValue('Hello **brave** new world\n\nSecond paragraph here');
    await page.getByRole('button', { name: 'Italic', exact: true }).click(); // the selection is kept, so buttons can follow each other
    await expect(article.locator('i', { hasText: 'brave' })).toBeVisible();
    await expect(saved).toHaveValue('Hello ***brave*** new world\n\nSecond paragraph here');
    await page.getByRole('button', { name: /^Regular/ }).click();
    await expect(saved).toHaveValue('Hello brave new world\n\nSecond paragraph here');
    await expect(article.locator('b, i')).toHaveCount(0);

    await selectIn(article, 'brave');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await page.getByRole('button', { name: 'Align right' }).click();
    await expect(article.locator('div', { hasText: /^Hello brave new world$/ })).toHaveCSS('text-align', 'right'); // moves right away, inside the box
    await selectIn(article, 'Second');
    await page.getByRole('button', { name: 'Align box (justified)' }).click();
    await expect(article.locator('div', { hasText: /^Second paragraph here$/ })).toHaveCSS('text-align', 'justify');
    await expect(saved).toHaveValue('[right] Hello **brave** new world\n\n[justify] Second paragraph here');
    await expect(article).not.toContainText('[right]'); // no marks are shown in the box
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Item created.')).toBeVisible();

    await page.goto(CONNECTED + '/blog/styled-post');
    const body = page.locator('article');
    await expect(body.locator('span.font-bold', { hasText: 'brave' })).toBeVisible();
    await expect(body.locator('p', { hasText: 'Hello brave new world' })).toHaveCSS('text-align', 'right');
    await expect(body.locator('p', { hasText: 'Second paragraph here' })).toHaveCSS('text-align', 'justify');
    await expect(body).not.toContainText('**');
    await expect(body).not.toContainText('[right]');
  });

  test('admin: edit a Work With Me offer and see it on the site', async ({ page, request }) => {
    await login(page);
    await page.getByRole('button', { name: 'Work With Me' }).click();
    await page.getByLabel('Title').first().fill('Brand Sprint');
    await page.getByLabel('Button text').first().fill('Start the sprint');
    await page.getByRole('button', { name: /Save & Publish/ }).click();
    await expect(page.getByText('Work With Me saved and published.')).toBeVisible();
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#hire').getByRole('heading', { name: 'Brand Sprint' })).toBeVisible();
    await expect(page.locator('#hire').getByRole('link', { name: 'Start the sprint' })).toBeVisible();
    await request.post(`${API}/__seed-settings`, { data: { key: 'global', value: { hireOffers: FIXTURE_HIRE_OFFERS } } });
  });

  test('admin: edit the "What I Can Do" chips and see them on the site', async ({ page, request }) => {
    await login(page);
    await page.getByRole('button', { name: 'What I Can Do' }).click();
    await page.getByLabel('Chips (one line per chip)').first().fill('Brand Naming\nBrand Voice');
    await page.getByLabel('Tab name').first().fill('Brand Work');
    await page.getByRole('button', { name: /Save & Publish/ }).click();
    await expect(page.getByText('What I Can Do saved and published.')).toBeVisible();
    await page.goto(CONNECTED + '/');
    const card = page.locator('#services .home-on-dark');
    await expect(card.getByRole('tab', { name: page.viewportSize()!.width < 768 ? 'Brand' : 'Brand Work' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Brand Naming' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Brand Voice' })).toBeVisible();
    await request.post(`${API}/__seed-settings`, { data: { key: 'global', value: { capabilityGroups: FIXTURE_CAPABILITY_GROUPS } } });
  });

  test('create, edit and delete a project; changes appear on the public site', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Project title').fill('Shiny New Project');
    await page.getByLabel('Category').fill('Web');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Item created.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shiny New Project' })).toBeVisible();

    await page.getByRole('button', { name: 'Edit Shiny New Project' }).click();
    await page.getByLabel('Category').fill('Web App');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();

    // public site shows it (with an automatic page address)
    if (!PROJECTS_HIDDEN) {
    await page.goto(CONNECTED + '/projects/shiny-new-project');
    await expect(page.locator('h1')).toHaveText('Shiny New Project');
    await expect(page.getByText('Web App').first()).toBeVisible();
    }

    await page.goto(CONNECTED + '/admin');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete Shiny New Project' }).click();
    await expect(page.getByText('Deleted.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shiny New Project' })).toHaveCount(0);
  });

  test('the admin switch shows or hides the projects on the public site', async ({ page }) => {
    await login(page);
    const toggle = page.getByRole('switch', { name: 'Hide projects from visitors' });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(page.getByText('Projects are now visible on your site.')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await page.goto(CONNECTED + '/');
    await expect(page.locator('a[href="/projects/brand-one"]').first()).toBeVisible();
    await expect(page.getByText('Not available in your region')).toHaveCount(0);
    await page.goto(CONNECTED + '/projects/brand-one');
    await expect(page.locator('h1')).toHaveText('Brand One');

    await page.goto(CONNECTED + '/admin');
    await page.getByRole('switch', { name: 'Hide projects from visitors' }).click();
    await expect(page.getByText('Projects are now hidden on your site.')).toBeVisible();
    await page.goto(CONNECTED + '/');
    await expect(page.locator('#projects').getByRole('heading', { name: 'Not available in your region' })).toBeVisible();
  });

  test('every field of the project page can be edited, drafts are hidden and an empty quote hides the feedback', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Edit Brand One' }).click();
    await page.getByLabel('Intro line under the title').fill('Edited intro line.');
    await page.getByLabel('Client', { exact: true }).fill('Globex');
    await page.getByLabel('Industries').fill('Fintech');
    await page.getByLabel('Services', { exact: true }).fill('Motion design');
    await page.getByLabel('Date', { exact: true }).fill('3 March 2025');
    await page.getByLabel('Designer').fill('Alex');
    await page.getByLabel('Tags shown as pills (comma separated)').fill('Alpha, Beta');
    await page.getByLabel('Challenge section title').fill('The brief');
    await typeRich(page, page.getByRole('textbox', { name: /^Challenge text/ }), 'Lead sentence here.\n\nBody paragraph here.');
    await page.getByLabel('Solution section title').fill('The answer');
    await typeRich(page, page.getByRole('textbox', { name: /^Solution text/ }), 'Solution paragraph here.');
    await typeRich(page, page.getByRole('textbox', { name: 'Quote', exact: true }), 'A glowing review.');
    await page.getByLabel('Name of the person').fill('John Smith');
    await page.getByLabel('Their role / company').fill('CTO, Globex');
    await page.getByLabel(/^Heading \(default/).fill('Start something new');
    await page.getByLabel(/^Button text/).fill('Say hello');
    await page.getByLabel(/^Button link/).fill('https://example.com/hi');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();

    if (PROJECTS_HIDDEN) return; // the public project page is hidden for now
    await page.goto(CONNECTED + '/projects/brand-one');
    await expect(page.getByText('Edited intro line.')).toBeVisible();
    await expect(page.getByText('Globex', { exact: true })).toBeVisible();
    await expect(page.getByText('Fintech')).toBeVisible();
    await expect(page.getByText('Motion design')).toBeVisible();
    await expect(page.getByText('3 March 2025')).toBeVisible();
    await expect(page.getByText('Alpha').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'The brief' })).toBeVisible();
    await expect(page.getByText('Lead sentence here.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The answer' })).toBeVisible();
    await expect(page.getByText('A glowing review.')).toBeVisible();
    await expect(page.getByText('John Smith')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Start something new' })).toBeAttached();
    await expect(page.getByRole('link', { name: 'Say hello' })).toHaveAttribute('href', 'https://example.com/hi');

    // empty quote: the feedback section disappears
    await page.goto(CONNECTED + '/admin');
    await page.getByRole('button', { name: 'Edit Brand One' }).click();
    await typeRich(page, page.getByRole('textbox', { name: 'Quote', exact: true }), '');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();
    await page.goto(CONNECTED + '/projects/brand-one');
    await expect(page.getByRole('heading', { name: "Client's feedback" })).toHaveCount(0);

    // draft: hidden from the home page and from direct visits
    await page.goto(CONNECTED + '/admin');
    await page.getByRole('button', { name: 'Edit Brand One' }).click();
    await page.getByLabel(/^Published/).uncheck();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();
    await expect(page.getByText('Hidden (draft)')).toBeVisible();
    await page.goto(CONNECTED + '/');
    await expect(page.locator('a[href="/projects/brand-one"]')).toHaveCount(0);
    await page.goto(CONNECTED + '/projects/brand-one');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('duplicate page addresses give a clear message', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Project title').fill('Another');
    await page.getByLabel(/Page address/).fill('brand-one');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('alert')).toContainText('already used');
  });

  test('uploading an image stores a link, not the picture, in the database', async ({ page, request }) => {
    // Pictures go to Cloudinary; the test answers in its place and checks what the browser sends.
    let sentPreset = '';
    await page.route('https://api.cloudinary.com/**', async (route) => {
      sentPreset = route.request().postData()?.includes('walidrahman_site') ? 'walidrahman_site' : '';
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ secure_url: 'https://res.cloudinary.com/du9aqtws/image/upload/v1/walidrahman/pic.webp' }) });
    });
    await login(page);
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Project title').fill('With Image');
    // 1x1 PNG
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.getByLabel('Main project image (shown on the home page): choose an image to upload').setInputFiles({ name: 'pic.png', mimeType: 'image/png', buffer: png });
    await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Item created.')).toBeVisible();
    const db = await (await request.get(`${API}/__db`)).json();
    const saved = db.projects.find((p: any) => p.title === 'With Image');
    expect(sentPreset).toBe('walidrahman_site');
    expect(saved.image).toBe('https://res.cloudinary.com/du9aqtws/image/upload/v1/walidrahman/pic.webp');
    expect(saved.image.length).toBeLessThan(200);
  });

  test('inquiries from the contact form show up and can be managed', async ({ page, request }) => {
    await request.post(`${API}/rest/v1/contact_submissions`, { data: { name: 'Pat', email: 'pat@example.com', subject: 'Quote', message: 'Please send a quote.' } });
    await login(page);
    await page.getByRole('button', { name: 'Inquiries', exact: true }).click();
    await expect(page.getByText('Pat', { exact: true })).toBeVisible();
    await expect(page.getByText('New', { exact: true })).toBeVisible();
    await page.getByText('Please send a quote.').click();
    await expect(page.getByText('New', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Reply to Pat' })).toHaveAttribute('href', /^mailto:pat@example.com/);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete message from Pat' }).click();
    await expect(page.getByText('No messages yet')).toBeVisible();
  });

  test('settings: contact details and social links update the public site', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Public e-mail').fill('hello@acme.example');
    await page.getByRole('button', { name: 'Add a social link' }).click();
    await page.getByLabel('Network 1').fill('LinkedIn');
    await page.getByLabel('Link 1').first().fill('https://linkedin.com/in/example');
    await page.getByRole('button', { name: 'Save & Publish' }).click();
    await expect(page.getByText('Settings saved and published.')).toBeVisible();

    await page.goto(CONNECTED + '/');
    await expect(page.getByRole('link', { name: 'hello@acme.example' }).first()).toHaveAttribute('href', 'mailto:hello@acme.example');
    await expect(page.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://linkedin.com/in/example');
  });

  test('SEO settings change the page title and description', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'SEO Settings' }).click();
    await page.getByLabel('Home page title').fill('Custom Title For Acme');
    await page.getByLabel('Description', { exact: true }).fill('A custom description.');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('SEO settings saved.')).toBeVisible();
    await page.goto(CONNECTED + '/');
    await expect(page).toHaveTitle('Custom Title For Acme');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'A custom description.');
  });

  test('products appear on the site only when published', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Title *').fill('Playbook');
    await page.getByLabel(/Checkout link/).fill('https://pay.example.com/checkout');
    await page.getByLabel('Published (visible on the website)').uncheck();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Item created.')).toBeVisible();
    await page.goto(CONNECTED + '/resources');
    await expect(page.getByText('New resources are on their way')).toBeVisible();

    await page.goto(CONNECTED + '/admin?tab=products');
    await page.getByRole('button', { name: 'Edit Playbook' }).click();
    await page.getByLabel('Published (visible on the website)').check();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();
    await page.goto(CONNECTED + '/resources');
    await page.getByRole('button', { name: 'View Playbook' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buy Now' })).toHaveAttribute('href', 'https://pay.example.com/checkout');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('signing out returns to the login screen', async ({ page, isMobile }) => {
    await login(page);
    await page.getByRole('button', { name: 'Log out' }).first().click();
    await expect(page.getByRole('heading', { name: 'Admin Access' })).toBeVisible();
  });
});

test.describe('checkout with bKash / Nagad', () => {
  async function login(page: Page) {
    await page.goto(CONNECTED + '/admin');
    await page.getByLabel('E-mail').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  }
  const ORDER_ID = '11111111-1111-4111-8111-111111111111';
  const TOKEN = 'a'.repeat(48);
  const order = (status: 'pending' | 'paid') => ({
    id: ORDER_ID, status, edition: FIXTURE_PRODUCT.key, name: FIXTURE_PRODUCT.name, amount: FIXTURE_PRODUCT.price,
    downloadUrl: status === 'paid' ? `/api/download?id=${ORDER_ID}&t=${TOKEN}` : null, emailed: status === 'paid',
  });
  // What /api/checkout?config=1 would answer: the shop's products, wallets and support e-mail (saved in the admin).
  const SHOP = { products: [FIXTURE_PRODUCT], wallets: FIXTURE_PAYMENTS.wallets, supportEmail: FIXTURE_PAYMENTS.supportEmail };
  const checkoutApi = (handler: (route: any) => Promise<unknown> | unknown) => async (route: any) =>
    route.request().url().includes('config=1') ? route.fulfill({ json: SHOP }) : handler(route);

  test('shows the wallet numbers, sends the transaction id and then offers the download', async ({ page }) => {
    const errors = watchErrors(page);
    let submitted: any = null;
    // The preview server has no /api, so the server's answers are simulated here.
    await page.route(/\/api\/checkout(\?.*)?$/, checkoutApi(async (route) => {
      if (route.request().method() === 'POST') {
        submitted = route.request().postDataJSON();
        await route.fulfill({ json: { ...order('pending'), token: TOKEN } });
      } else {
        await route.fulfill({ json: order('paid') });
      }
    }));

    await page.goto(CONNECTED + `/checkout/${FIXTURE_PRODUCT.key}`);
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.getByTestId('wallet-bkash')).toHaveText(FIXTURE_PAYMENTS.wallets[0].number);
    await expect(page.getByTestId('wallet-nagad')).toHaveText(FIXTURE_PAYMENTS.wallets[1].number);
    await expect(page.getByText('৳500').first()).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);

    await page.getByLabel(/Your email/).fill('Buyer@Example.com');
    await page.getByLabel('Nagad', { exact: true }).check();
    await page.getByLabel('The number you paid from').fill('01712345678');
    await page.getByLabel(/Transaction ID/).fill('71abcd12');
    await page.getByRole('button', { name: /verify my payment/ }).click();

    await expect(page).toHaveURL(new RegExp(`/thank-you\\?order=${ORDER_ID}&t=${TOKEN}`));
    await expect(page.getByRole('heading', { name: /Payment confirmed/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Download:/ })).toHaveAttribute('href', `/api/download?id=${ORDER_ID}&t=${TOKEN}`);
    expect(submitted).toMatchObject({ edition: FIXTURE_PRODUCT.key, email: 'Buyer@Example.com', wallet: 'nagad', trxId: '71abcd12', sender: '01712345678', website: '' });
    expect(errors).toEqual([]);
  });

  test('explains a duplicate transaction id in plain words', async ({ page }) => {
    await page.route(/\/api\/checkout(\?.*)?$/, checkoutApi((route) => route.fulfill({ status: 409, json: { error: 'duplicate' } })));
    await page.goto(CONNECTED + `/checkout/${FIXTURE_PRODUCT.key}`);
    await page.getByLabel(/Your email/).fill('buyer@example.com');
    await page.getByLabel('The number you paid from').fill('01712345678');
    await page.getByLabel(/Transaction ID/).fill('8N7A6D5CQ');
    await page.getByRole('button', { name: /verify my payment/ }).click();
    await expect(page.getByRole('alert')).toContainText('already been submitted');
    await expect(page.getByRole('alert')).toContainText(FIXTURE_PAYMENTS.supportEmail);
    await expect(page).toHaveURL(new RegExp(`/checkout/${FIXTURE_PRODUCT.key}$`));
  });

  test('waits while the payment is not verified yet', async ({ page }) => {
    await page.route(/\/api\/checkout(\?.*)?$/, checkoutApi((route) => route.fulfill({ json: order('pending') })));
    await page.goto(`${CONNECTED}/thank-you?order=${ORDER_ID}&t=${TOKEN}`);
    await expect(page.getByRole('heading', { name: 'Verifying your payment…' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Download:/ })).toHaveCount(0);
  });

  test('a made-up address and an unknown product are handled', async ({ page }) => {
    await page.goto(`${CONNECTED}/thank-you`);
    await expect(page.getByRole('heading', { name: "We couldn't find this order" })).toBeVisible();
    await page.goto(`${CONNECTED}/checkout/nonsense`);
    await expect(page.getByRole('heading', { name: "We couldn't find that product" })).toBeVisible();
  });

  test('admin: Store setup saves the wallet numbers and a product', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Store setup' }).click();
    await page.getByLabel('bKash number').fill('01711111111');
    await page.getByLabel('Support e-mail').fill('help@acme.example');
    await page.getByRole('button', { name: 'Save payment details' }).click();
    await expect(page.getByText('Payment details saved.')).toBeVisible();
    await page.getByRole('button', { name: 'Add product' }).click();
    await page.getByLabel('Product code').fill('acme-guide');
    await page.getByLabel('Name buyers see').fill('The Acme Guide');
    await page.getByLabel('Price (taka)').fill('500');
    await page.getByLabel('File in private storage').fill('acme-guide.pdf');
    await page.getByRole('button', { name: 'Save product' }).click();
    await expect(page.getByText('Product saved.')).toBeVisible();
    await expect(page.getByLabel('Product code')).toHaveValue('acme-guide');
  });

  test('a product whose checkout field holds a product code gets a Buy Now button that opens the checkout page', async ({ page }) => {
    await page.route(/\/api\/checkout(\?.*)?$/, checkoutApi((route) => route.fulfill({ status: 404, json: {} })));
    await login(page);
    await page.getByRole('button', { name: 'Products' }).click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('Title *').fill('English guide');
    await page.getByLabel(/Checkout link/).fill(FIXTURE_PRODUCT.key);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Item created.')).toBeVisible();
    await page.goto(CONNECTED + '/resources');
    await page.getByRole('button', { name: 'View English guide' }).click();
    if (page.viewportSize()!.width < 768) {
      const stage = await page.getByRole('button', { name: 'Zoom in on this picture' }).boundingBox();
      expect(stage!.height / page.viewportSize()!.height).toBeGreaterThanOrEqual(0.6); // the product takes most of the popup
      const details = page.getByRole('button', { name: 'Details' });
      await expect(details).toHaveAttribute('aria-expanded', 'false');
      await details.click();
      await expect(details).toHaveAttribute('aria-expanded', 'true');
      await details.click();
    }
    const buy = await page.getByRole('link', { name: 'Buy Now' }).boundingBox();
    expect(buy!.y + buy!.height).toBeLessThanOrEqual(page.viewportSize()!.height); // Buy Now is on screen without scrolling the popup
    await page.getByRole('link', { name: 'Buy Now' }).click();
    await expect(page).toHaveURL(new RegExp(`/checkout/${FIXTURE_PRODUCT.key}$`));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const id of ['bkash', 'nagad']) {
      const number = await page.getByTestId(`wallet-${id}`).boundingBox();
      const copy = await page.getByRole('button', { name: new RegExp(`Copy ${id}`, 'i') }).boundingBox();
      const apart = copy!.y >= number!.y + number!.height - 1 || copy!.x >= number!.x + number!.width;
      expect(apart).toBe(true); // the number never touches its Copy button
    }
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  });
});
