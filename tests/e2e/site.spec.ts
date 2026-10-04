import { expect, test, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    await expect(page).toHaveTitle('Walid Rahman | Brand Developer');
    await expect(page.locator('h1')).toContainText('Walid Rahman.');
    await expect(page.getByRole('heading', { name: 'Brand One' })).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeAttached();
    // Fabricated placeholder content must be gone
    await expect(page.getByText('Sarah Johnson')).toHaveCount(0);
    await expect(page.getByText('Add introductory video URL')).toHaveCount(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Brand Developer/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://walidrahman.com/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://walidrahman.com/og-image.png');
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

  test('project and blog pages open from the home page and back-navigation works', async ({ page }) => {
    await page.goto(CONNECTED + '/');
    await page.locator('a[href="/projects/brand-one"]').first().click();
    await expect(page).toHaveURL(/\/projects\/brand-one$/);
    await expect(page.locator('h1')).toHaveText('Brand One');
    await expect(page).toHaveTitle('Brand One | Walid Rahman');
    await page.getByRole('link', { name: 'All Projects' }).click();
    await expect(page).toHaveURL(/\/#projects$/);

    await page.locator('a[href="/blog/hello-world"]').first().click();
    await expect(page.locator('h1')).toHaveText('Hello World');
    await expect(page.getByRole('heading', { name: 'A heading' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'one' }).first()).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });

  test('unknown pages show a 404 that is not indexed', async ({ page }) => {
    await page.goto(CONNECTED + '/projects/does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('contact form saves a message and shows confirmation', async ({ page, request }) => {
    await page.goto(CONNECTED + '/#contact');
    await page.getByLabel('Name', { exact: true }).fill('Jane Visitor');
    await page.getByLabel('Email', { exact: true }).fill('jane@example.com');
    await page.getByLabel('Subject').fill('Hello');
    await page.getByLabel('Message').fill('I would like to work with you.');
    await page.waitForTimeout(3200); // the anti-spam timer
    await page.getByRole('button', { name: 'Send Message' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Thank you' })).toBeVisible();
    const db = await (await request.get(`${API}/__db`)).json();
    expect(db.contact_submissions).toHaveLength(1);
    expect(db.contact_submissions[0]).toMatchObject({ name: 'Jane Visitor', email: 'jane@example.com', message: 'I would like to work with you.' });
  });

  test('contact form: bots (honeypot / too fast) are silently dropped', async ({ page, request }) => {
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

test.describe('zero-configuration mode (no database connected)', () => {
  test('site works with built-in content and no errors', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(PLAIN + '/');
    await expect(page.locator('h1')).toContainText('Walid Rahman.');
    await expect(page.getByRole('heading', { name: 'Brand Identity' })).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Executive Director' })).toBeAttached();
    await expect(page.getByText('Selected projects will be shown here soon.')).toBeAttached();
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
    await page.goto(CONNECTED + '/projects/shiny-new-project');
    await expect(page.locator('h1')).toHaveText('Shiny New Project');
    await expect(page.getByText('Web App').first()).toBeVisible();

    await page.goto(CONNECTED + '/admin');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Delete Shiny New Project' }).click();
    await expect(page.getByText('Deleted.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shiny New Project' })).toHaveCount(0);
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
    expect(saved.image).toMatch(/^http:\/\/127\.0\.0\.1:54321\/storage\/v1\/object\/public\/site-media\/images\/.+\.webp$/);
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
    await page.getByLabel('Public e-mail').fill('hello@walidrahman.com');
    await page.getByRole('button', { name: 'Add a social link' }).click();
    await page.getByLabel('Network 1').fill('LinkedIn');
    await page.getByLabel('Link 1').first().fill('https://linkedin.com/in/example');
    await page.getByRole('button', { name: 'Save & Publish' }).click();
    await expect(page.getByText('Settings saved and published.')).toBeVisible();

    await page.goto(CONNECTED + '/');
    await expect(page.getByRole('link', { name: 'hello@walidrahman.com' }).first()).toHaveAttribute('href', 'mailto:hello@walidrahman.com');
    await expect(page.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute('href', 'https://linkedin.com/in/example');
  });

  test('SEO settings change the page title and description', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'SEO Settings' }).click();
    await page.getByLabel('Home page title').fill('Custom Title For Walid');
    await page.getByLabel('Description', { exact: true }).fill('A custom description.');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('SEO settings saved.')).toBeVisible();
    await page.goto(CONNECTED + '/');
    await expect(page).toHaveTitle('Custom Title For Walid');
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
