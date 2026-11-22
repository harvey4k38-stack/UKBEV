import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';

export function OriginsPage() {
  const { brands, navigate } = useStore();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 space-y-16">
      <SeoHead
        title="Our Water & Global Brand Origins | UK Beverages"
        description="Explore the geological sources and verified mineral analyses of Evian, FIJI Water, Highland Spring, Icelandic Glacial, and Tongariro Natural Spring Water."
      />

      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
          Provenance &amp; Mineralogy
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#14181F]">
          Our Water &amp; Global Origins
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Every bottled water in our UK portfolio owes its character to the rock strata, altitude, and filtration time of its source. Select any brand below to enter its interactive 3D landscape and underground aquifer cross-section.
        </p>
      </div>

      {/* Verified Mineral Comparison Table */}
      <section className="overflow-x-auto rounded-2xl border border-black/8 bg-white">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-black/8 bg-[#EFECE6]/70 text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="py-3.5 px-5">Brand &amp; Source</th>
              <th className="py-3.5 px-4">Country</th>
              <th className="py-3.5 px-4">pH</th>
              <th className="py-3.5 px-4">TDS (mg/L)</th>
              <th className="py-3.5 px-4">Silica</th>
              <th className="py-3.5 px-4">Calcium</th>
              <th className="py-3.5 px-4">Magnesium</th>
              <th className="py-3.5 px-5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/6 font-mono tabular-nums">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-black/[0.015]">
                <td className="py-4 px-5 font-sans">
                  <p className="font-semibold text-[#14181F]">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.sourceName}</p>
                </td>
                <td className="py-4 px-4 font-sans text-slate-700">{b.country}</td>
                <td className="py-4 px-4 font-semibold text-[#0F5C6E]">{b.mineralProfile.ph}</td>
                <td className="py-4 px-4">{b.mineralProfile.tds}</td>
                <td className="py-4 px-4">{b.mineralProfile.silica ?? '—'}</td>
                <td className="py-4 px-4">{b.mineralProfile.calcium ?? '—'}</td>
                <td className="py-4 px-4">{b.mineralProfile.magnesium ?? '—'}</td>
                <td className="py-4 px-5 font-sans text-right">
                  <button
                    onClick={() => navigate(`/brands/${b.slug}`)}
                    className="text-xs font-semibold text-[#0F5C6E] hover:underline whitespace-nowrap"
                  >
                    Explore source →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Detailed Brand Cards */}
      <section className="space-y-8">
        {brands.map((b) => (
          <div
            key={b.id}
            className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-black/8 bg-white overflow-hidden"
          >
            <div className="lg:col-span-5 h-64 lg:h-auto bg-[#14202C]">
              <img
                src={b.heroImage}
                alt={`${b.name} landscape in ${b.region}`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#0F5C6E]">{b.country}</span>
                  <span aria-hidden="true">·</span>
                  <span>{b.region}</span>
                  <span aria-hidden="true">·</span>
                  <span>{b.elevation}</span>
                </div>
                <h2 className="font-editorial text-3xl font-semibold text-[#14181F]">{b.name}</h2>
                <p className="text-sm text-slate-700 leading-relaxed">{b.description}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{b.geologicalStory}</p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/brands/${b.slug}`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E] transition-colors"
                >
                  Discover where {b.name} comes from <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function StoryPage() {
  const { navigate } = useStore();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-14 space-y-12">
      <SeoHead
        title="Our Story – Independent UK Bottled Water Retail | UK Beverages"
        description="Learn how UK Beverages curates and delivers Evian, FIJI Water, Highland Spring, Icelandic Glacial, and Tongariro across the United Kingdom."
      />

      <div className="space-y-4 border-b border-black/8 pb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
          About UK Beverages
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#14181F]">
          One Trusted UK Destination for the World&apos;s Finest Springs
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
          Finding authentic international mineral and spring waters in the UK used to mean visiting multiple specialist grocers or settling for unpredictable supermarket stock. UK Beverages was built to solve that for UK households.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-2">
          <h2 className="font-editorial text-2xl font-semibold text-[#14181F]">
            Curated Range, Verified Data
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We publish transparent, verified mineral analyses (pH, TDS, silica, calcium, magnesium) and accurate geographical provenance for every brand we retail—without exaggerated wellness claims.
          </p>
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-2">
          <h2 className="font-editorial text-2xl font-semibold text-[#14181F]">
            Independent UK Retail
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            UK Beverages operates strictly as an independent UK consumer distributor and online retailer. We hold stock locally at our London Park Royal depot for dependable UK dispatch.
          </p>
        </div>
        <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-2">
          <h2 className="font-editorial text-2xl font-semibold text-[#14181F]">
            Built for Repeat Convenience
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            From 750ml flint glass table bottles to 24-pack rPET cases and flexible weekly or monthly subscriptions, our service keeps your home effortlessly stocked.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#14181F] text-white p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-editorial text-3xl font-semibold">Explore Our Five Water Sources</h2>
          <p className="text-sm text-slate-300">
            Compare mineral profiles or follow each water on its journey from rainfall to spring.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => navigate('/origins')}
            className="rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-[#14181F]"
          >
            View Origins
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="rounded-lg border border-white/25 px-5 py-2.5 text-xs font-semibold text-white"
          >
            Shop All Water
          </button>
        </div>
      </div>
    </div>
  );
}

export function FaqsPage() {
  const faqs = [
    {
      q: 'Is Icelandic Glacial extracted directly from a glacier?',
      a: 'No. Icelandic Glacial is sourced from the underground Ölfus Spring in southwest Iceland, where regional rainfall and snowmelt filter naturally through porous volcanic lava rock into a subterranean spring.',
    },
    {
      q: 'Where is Tongariro Natural Spring Water sourced?',
      a: 'Tongariro Natural Spring Water is sourced from a deep underground aquifer 738 metres above sea level in the foothills of Tongariro National Park in the central North Island of New Zealand.',
    },
    {
      q: 'Do your prices include UK VAT?',
      a: 'Yes. All consumer retail prices displayed on UK Beverages are in GBP (£) and include standard 20% UK VAT, itemized clearly at checkout and on your order confirmation.',
    },
    {
      q: 'How do water subscriptions work?',
      a: 'Select "Subscribe & Save" on any eligible product or use the Subscription Builder to choose weekly, fortnightly, or monthly UK delivery. You can pause, swap brands, change your address, or cancel anytime in Customer Account.',
    },
    {
      q: 'Which UK postcodes do you deliver to?',
      a: 'We deliver across England, Wales, Scotland (mainland and Highlands & Islands), and Northern Ireland. Channel Islands (GY, JE) and Isle of Man (IM) are currently excluded from standard online checkout.',
    },
    {
      q: 'Do you offer wholesale or B2B trade accounts on this website?',
      a: 'No. This website is dedicated strictly to consumer retail and home deliveries across the UK.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-14 space-y-10">
      <SeoHead
        title="Frequently Asked Questions | UK Beverages"
        description="Answers on bottled water provenance, mineral profiles, UK VAT pricing, courier delivery zones, and subscription management."
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      <div className="space-y-3 border-b border-black/8 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
          Customer Care &amp; Provenance
        </p>
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#14181F]">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="divide-y divide-black/10 rounded-2xl border border-black/8 bg-white px-6 sm:px-8">
        {faqs.map((f, i) => (
          <div key={i} className="py-6 space-y-2">
            <h2 className="text-base font-semibold text-[#14181F]">{f.q}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const { marketing, apiFetch } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [postcode, setPostcode] = useState('');
  const [subject, setSubject] = useState('Order or Delivery Enquiry');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const company = marketing?.companySettings;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, postcode, subject, message }),
    });
    setSent(true);
    setMessage('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-14">
      <SeoHead
        title="Contact Customer Care | UK Beverages"
        description="Reach the UK Beverages consumer customer care team for delivery questions, order updates, or subscription support."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            UK Customer Care
          </p>
          <h1 className="font-editorial text-4xl font-semibold text-[#14181F]">Contact Us</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our London customer care team responds Monday to Friday, 09:00–17:30 GMT.
          </p>

          <div className="space-y-4 rounded-2xl border border-black/8 bg-white p-6 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#0F5C6E] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-[#14181F]">Email</p>
                <p className="text-slate-600">{company?.supportEmail || 'hello@ukbeverages.co.uk'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-[#0F5C6E] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-[#14181F]">Telephone</p>
                <p className="text-slate-600 font-mono">
                  {company?.supportPhone || '+44 (0)20 7946 0821'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#0F5C6E] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-[#14181F]">UK Distribution Address</p>
                <p className="text-slate-600">
                  {company?.address || 'Unit 7, Park Royal Distribution Centre, London NW10 7PQ'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-black/8 bg-white p-6 sm:p-8">
          {sent ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-[#0F5C6E] mx-auto" />
              <h2 className="font-editorial text-2xl font-semibold">Message Received</h2>
              <p className="text-sm text-slate-600">
                Thank you for contacting UK Beverages. Our team will reply by email within one working day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-editorial text-2xl font-semibold">Send a Message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Your Name *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm bg-white"
                  >
                    <option>Order or Delivery Enquiry</option>
                    <option>Subscription Support</option>
                    <option>Product &amp; Mineral Information</option>
                    <option>Damaged Case Replacement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    UK Postcode (Optional)
                  </label>
                  <input
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#14181F] px-6 py-3 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
              >
                Send Enquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function LegalPage({ type }: { type: string }) {
  const { marketing } = useStore();
  const c = marketing?.companySettings;

  const titles: Record<string, string> = {
    privacy: 'Privacy & Cookie Policy (UK GDPR)',
    terms: 'Consumer Terms & Conditions',
    returns: 'Returns & Damaged Goods Policy',
    delivery: 'UK Delivery Policy',
    subscriptions: 'Recurring Subscription Terms',
  };

  const title = titles[type] || 'Legal & Consumer Disclosures';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-14 space-y-6">
      <SeoHead
        title={`${title} | UK Beverages`}
        description={`${title} for ${c?.legalName || 'UK Beverages Ltd'}.`}
      />

      <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
        UK Consumer Disclosures
      </p>
      <h1 className="font-editorial text-4xl font-semibold text-[#14181F]">{title}</h1>

      <div className="rounded-2xl border border-black/8 bg-white p-8 space-y-5 text-sm text-slate-700 leading-relaxed">
        <p>
          <strong>Trader Identity:</strong> {c?.legalName || 'UK Beverages Ltd'}{' '}
          trading as {c?.tradingName || 'UK Beverages'}, Company Registration{' '}
          {c?.companyNumber || '14892310'}, VAT Registration {c?.vatNumber || 'GB 412 8940 22'},
          registered at {c?.address || 'Unit 7, Park Royal Distribution Centre, London NW10 7PQ'}.
        </p>

        {type === 'privacy' && (
          <>
            <p>
              We process personal data (name, UK delivery address, email, telephone, order history) strictly to fulfil your retail purchases, validate UK courier zones, and manage recurring subscriptions in accordance with the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018.
            </p>
            <p>
              Essential cookies are used to retain your shopping bag, checked postcode, and authenticated customer session. For data access or erasure requests, email {c?.supportEmail || 'hello@ukbeverages.co.uk'}.
            </p>
          </>
        )}

        {type === 'returns' && (
          <>
            <p>
              Under the UK Consumer Contracts Regulations 2013, you have 14 calendar days from receipt to return unopened, undamaged cases in original packaging. If glass or PET cases arrive damaged in transit, report within 48 hours with your order number for a prompt replacement or full GBP refund.
            </p>
          </>
        )}

        {type === 'subscriptions' && (
          <>
            <p>
              Recurring water subscriptions renew automatically at your chosen weekly, fortnightly, or monthly interval at the prevailing subscriber discount shown at checkout. You may pause, skip, change products, or cancel anytime without penalty in Customer Account before your next scheduled dispatch date.
            </p>
          </>
        )}

        {(type === 'terms' || type === 'delivery' || !titles[type]) && (
          <>
            <p>
              All prices are stated in Pounds Sterling (GBP) inclusive of 20% UK VAT. Delivery eligibility and fees are determined by UK postcode zone prior to payment. Estimated transit windows apply to working days (Monday–Friday, excluding UK bank holidays).
            </p>
            <p>
              UK Beverages operates as an independent retail distributor of established natural mineral and spring water brands and makes no claim of exclusive brand ownership.
            </p>
            <p>
              Interactive satellite origin views incorporate Google Maps Platform features and are subject to the{' '}
              <a
                href="https://maps.google.com/help/terms_maps/?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#0F5C6E]"
              >
                Google Maps/Google Earth Additional Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/privacy?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#0F5C6E]"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
