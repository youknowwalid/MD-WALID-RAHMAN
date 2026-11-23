import { useEffect, useState } from 'react';
import { CheckoutConfig, fetchCheckoutConfig } from './payments';

/** The shop's products, wallets and support e-mail (set in the admin). undefined = still loading, null = could not be loaded. */
export function useCheckoutConfig(): CheckoutConfig | null | undefined {
  const [config, setConfig] = useState<CheckoutConfig | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    fetchCheckoutConfig().then((c) => { if (live) setConfig(c); });
    return () => { live = false; };
  }, []);
  return config;
}
