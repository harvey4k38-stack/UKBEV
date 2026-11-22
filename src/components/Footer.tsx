import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { brands, navigate, marketing, apiFetch } = useStore();
  const [email, setEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [cookiesAccepted, setCookiesAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sourcehouse_cookies_v1') === 'accepted';
    } catch {
      return false;
    }
  });

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await apiFetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setNewsletterMsg('Subscribed to UK Beverages updates.');
      setEmail('');
    } catch (err) {
      setNewsletterMsg(err instanceof Error ? err.message : 'Unable to subscribe.');
    }
  };

  const acceptCookies = () => {
    setCookiesAccepted(true);
    try {
      localStorage.setItem('sourcehouse_cookies_v1', 'accepted');
    } catch {
      // ignore
    }
  };

  const company = marketing?.companySettings;

  return (
    <footer className="border-t border-black/10 bg-[#14181F] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4 space-y-4">
          <button
            onClick={() => navigate('/')}
            className="font-editorial text-2xl font-semibold tracking-wide text-white"
          >
            UK BEVERAGES
          </button>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Premium international bottled water delivered across the United Kingdom. Single cases, bulk household packs, and flexible recurring deliveries.
          </p>
          <form onSubmit={handleSubscribeNewsletter} className="pt-2 space-y-2 max-w-sm">
            <label htmlFor="footer-newsletter" className="block text-xs font-medium text-slate-300">
              Receive seasonal allocation & restock notes
            </label>
            <div className="flex gap-2">
              <input
                id="footer-newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.co.uk"
                className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#7CC4D8] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#14181F] hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                Join
              </button>
            </div>
            {newsletterMsg && <p className="text-xs text-[#7CC4D8]">{newsletterMsg}</p>}
          </form>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Water Brands</h3>
          <ul className="space-y-2 text-sm">
            {brands.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => navigate(`/brands/${b.slug}`)}
                  className="text-slate-400 hover:text-white transition-colors text-left"
                >
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Shop & Delivery</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => navigate('/shop')} className="text-slate-400 hover:text-white">
                Shop All Water
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/subscriptions')} className="text-slate-400 hover:text-white">
                Water Subscriptions
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/delivery')} className="text-slate-400 hover:text-white">
                UK Delivery & Postcode Check
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/origins')} className="text-slate-400 hover:text-white">
                Our Water & Brand Origins
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/story')} className="text-slate-400 hover:text-white">
                Our Story
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/faqs')} className="text-slate-400 hover:text-white">
                FAQs & Mineral Guide
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Support & Legal</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => navigate('/contact')} className="text-slate-400 hover:text-white">
                Contact Customer Care
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/account')} className="text-slate-400 hover:text-white">
                Customer Account & Order Lookup
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/legal/delivery')} className="text-slate-400 hover:text-white">
                Delivery & Returns Policy
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/legal/subscriptions')} className="text-slate-400 hover:text-white">
                Subscription Terms
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/legal/privacy')} className="text-slate-400 hover:text-white">
                Privacy Policy & Cookies
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/legal/terms')} className="text-slate-400 hover:text-white">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/admin')} className="text-slate-500 hover:text-slate-300 text-xs pt-1">
                Operations Console
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-1">
            <p>
              {company?.legalName || 'UK Beverages Ltd'} · Company No.{' '}
              {company?.companyNumber || '14892310'} · VAT {company?.vatNumber || 'GB 412 8940 22'}
            </p>
            <p>{company?.address || 'Unit 7, Park Royal Distribution Centre, London NW10 7PQ'}</p>
          </div>
          <p className="text-slate-500">
            Independent UK consumer retailer. All prices in GBP inclusive of 20% UK VAT.
          </p>
        </div>
      </div>

      {/* Subtle UK Cookie Consent Bar */}
      {!cookiesAccepted && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-4 sm:left-4 z-50 sm:max-w-sm rounded-xl border border-white/15 bg-[#14181F] p-3.5 sm:p-4 text-xs text-slate-200 shadow-2xl">
          <p className="leading-relaxed">
            We use essential cookies to keep your shopping bag, postcode check, and account session secure.{' '}
            <button
              onClick={() => navigate('/legal/privacy')}
              className="underline hover:text-white"
            >
              Privacy & Cookie Policy
            </button>
            .
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={acceptCookies}
              className="rounded-lg bg-white px-3.5 py-1.5 font-semibold text-[#14181F] hover:bg-slate-200"
            >
              Accept Essential
            </button>
            <button
              onClick={acceptCookies}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
