// What each live Paddle price unlocks. Price IDs are not secret (they are visible in checkout);
// the files themselves live in the PRIVATE Supabase Storage bucket `paid-downloads` and are
// only ever handed out through /api/download after Paddle confirms the payment.
export const BUCKET = 'paid-downloads';

export const CATALOG = {
  // English edition, $29 one-time
  pri_01m4fppbkfzqnbdk9sggyy03kk: {
    name: 'Automate Your Facebook Business with AI (English edition)',
    path: 'English.pdf',
    filename: 'Automate-Your-Facebook-Business-with-AI-English.pdf',
  },
  // Bangla edition, $29 one-time
  pri_01m4fprynt2xpb82ef5zmpzfbd: {
    name: 'Automate Your Facebook Business with AI (Bangla edition)',
    path: 'Bangla.pdf',
    filename: 'Automate-Your-Facebook-Business-with-AI-Bangla.pdf',
  },
};
