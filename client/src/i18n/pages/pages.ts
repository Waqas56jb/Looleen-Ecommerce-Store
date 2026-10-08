/**
 * Strings for the static/content pages area (About, Contact, FAQ, policies, 404).
 * Keep en and ar keys in sync — `ar` is typed as `typeof en`.
 *
 * Placeholders such as {store}, {email}, {threshold} are filled from STORE_CONFIG
 * by `useStaticCopy().f()` in src/components/static/copy.ts — never hardcode the
 * store name or business values here.
 */

export type PolicyBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'note'; title: string; text: string; tone?: 'rose' | 'champagne' | 'ink' }
  | { type: 'table'; caption?: string; head: string[]; rows: string[][] }
  | { type: 'cards'; items: { title: string; value: string; text: string }[] }
  | { type: 'link'; text: string; label: string; to: string }

export interface PolicySection {
  id: string
  title: string
  blocks: PolicyBlock[]
}

export interface PolicyCopy {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  intro: string
  sections: PolicySection[]
}

export interface FaqCategory {
  id: string
  title: string
  items: { q: string; a: string }[]
}

/* ============================================================================
   ENGLISH
   ============================================================================ */

const en = {
  shared: {
    lastUpdated: 'Last updated 1 October 2026',
    onThisPage: 'On this page',
    contents: 'Contents',
    needHelpTitle: 'Still need help?',
    needHelpText: 'Our beauty advisors reply on WhatsApp within minutes, Sunday to Thursday.',
    whatsappCta: 'Chat on WhatsApp',
    contactCta: 'Contact us',
    questionsTitle: 'Questions about this policy?',
    questionsText: 'Write to {email} or message us on WhatsApp — a real person will get back to you.',
  },

  about: {
    metaTitle: 'Our Story',
    metaDescription: '{store} brings 100% original international beauty to Saudi Arabia, sourced only from authorized distributors and delivered across the Kingdom.',
    hero: {
      eyebrow: 'Our Story',
      title: 'Beauty you can trust, delivered across the Kingdom',
      lead: '{store} was founded in Riyadh with one simple promise: every product you open is exactly what the brand intended — original, fresh and cared for from the official distributor to your door.',
      imageAlt: 'The {store} sign at our Riyadh home',
      caption: 'Our home in Riyadh — {tagline}',
    },
    story: {
      eyebrow: 'Who we are',
      title: 'Born in Riyadh, built on trust',
      paragraphs: [
        'We started {store} because buying beauty online in Saudi Arabia too often felt like a gamble. Unclear sources, faded packaging, perfumes that did not smell quite right. We knew women here deserved better.',
        'So we built the store we wanted to shop from ourselves: a curated edit of the world’s most loved skincare, makeup, haircare and fragrance — bought exclusively from each brand’s authorized Saudi distributor, stored in a climate-controlled warehouse and delivered with care.',
        'Today we serve customers and professional salons across the Kingdom, with advisors who speak your language and know your climate, your skin and your routine.',
      ],
      signature: 'The {store} team',
      imageAlt: 'A curated flat lay of beauty essentials',
    },
    promise: {
      eyebrow: 'Our promise',
      title: 'Four things we never compromise on',
      pillars: [
        { title: '100% original', text: 'Every product is genuine, carries its original batch code and is sold sealed — never refilled, repackaged or decanted.' },
        { title: 'Authorized distributors only', text: 'We buy directly from the official Saudi agents of each brand. No grey imports, no parallel stock, ever.' },
        { title: 'Climate-controlled care', text: 'Our Riyadh warehouse is temperature- and humidity-controlled, with insulated packaging in summer so formulas arrive as fresh as they left.' },
        { title: 'Expert advice', text: 'Trained beauty advisors help you choose the right shade, routine or fragrance — on WhatsApp, by phone or by email.' },
      ],
    },
    process: {
      eyebrow: 'The authenticity process',
      title: 'How every product earns its place on our shelf',
      intro: 'Authenticity is not a badge we print — it is a process we follow for every single unit.',
      steps: [
        { title: 'Authorized sourcing', text: 'We purchase only from brand-appointed Saudi distributors, with signed supply agreements and SFDA-registered stock.' },
        { title: 'Batch verification', text: 'Each delivery is checked on arrival: batch codes, expiry dates, Arabic labelling and seals are recorded against the distributor invoice.' },
        { title: 'Climate-controlled storage', text: 'Products are stored at 18–24°C with controlled humidity, away from light — protecting actives, pigments and fragrances.' },
        { title: 'Sealed delivery', text: 'Orders are packed in tamper-evident, insulated packaging and handed to trusted couriers, with full tracking to your door.' },
      ],
    },
    numbers: {
      eyebrow: '{store} in numbers',
      title: 'Growing with the Kingdom',
      stats: [
        { value: '45+', label: 'International brands' },
        { value: '13', label: 'Saudi cities served same-week' },
        { value: '1–3', label: 'Day delivery in major cities' },
        { value: '14', label: 'Day hassle-free returns' },
      ],
    },
    pro: {
      eyebrow: 'For professionals',
      title: 'Trusted by salons, spas and makeup artists',
      text: 'From professional colour and treatments to tools and disposables, our trade programme supplies the beauty professionals of Saudi Arabia with authentic stock, trade pricing and dependable delivery.',
      bullets: ['Trade pricing for verified salons and freelancers', 'B2B tax invoices with your VAT number', 'A dedicated account manager on WhatsApp'],
      cta: 'Open a professional account',
      imageAlt: 'A professional hair salon',
    },
    cta: {
      title: 'Find your next favourite',
      text: 'Explore new arrivals and the brands you love — every one of them original and authorized.',
      shop: 'Shop new arrivals',
      brands: 'Explore brands',
    },
  },

  contact: {
    metaTitle: 'Contact Us',
    metaDescription: 'Contact {store} client care by WhatsApp, phone or email. Beauty advice, order support and professional accounts across Saudi Arabia.',
    hero: {
      eyebrow: 'Client care',
      title: 'We are here for you',
      lead: 'Questions about an order, the right shade or a salon account? Our Riyadh-based team replies within 24 hours — usually much sooner.',
    },
    cards: {
      whatsapp: { title: 'WhatsApp', text: 'The fastest way to reach a beauty advisor.', action: 'Start a chat' },
      phone: { title: 'Call us', text: 'Speak to our client care team.', action: 'Call now' },
      email: { title: 'Email', text: 'For detailed requests and documents.', action: 'Send an email' },
      hours: { title: 'Working hours', text: 'Messages outside these hours are answered the next working day.' },
    },
    hoursValue: '{hours}',
    form: {
      eyebrow: 'Write to us',
      title: 'Send us a message',
      intro: 'Fill in the form and the right person from our team will get back to you.',
      name: 'Full name',
      namePlaceholder: 'e.g. Noura Al-Qahtani',
      email: 'Email address',
      phone: 'Mobile number',
      phoneHint: 'Saudi mobile, e.g. +966 5X XXX XXXX',
      topic: 'Topic',
      topicPlaceholder: 'Choose a topic',
      topics: {
        order: 'An order',
        advice: 'Product advice',
        salon: 'Salon / professional accounts',
        partnership: 'Partnerships',
        other: 'Something else',
      },
      orderNumber: 'Order number',
      orderHint: 'Found in your confirmation email, e.g. LK-100245',
      message: 'Message',
      messagePlaceholder: 'Tell us how we can help…',
      messageShort: 'Please write at least 10 characters',
      chooseTopic: 'Please choose a topic',
      submit: 'Send message',
      privacy: 'By sending this form you agree to our Privacy Policy. We only use your details to answer your request.',
      successTitle: 'Thank you, {name}',
      successText: 'Your message has reached our client care team. We will reply to {email} within 24 hours.',
      reference: 'Reference',
      sendAnother: 'Send another message',
    },
    business: {
      eyebrow: 'Business information',
      title: 'Registered in the Kingdom of Saudi Arabia',
      legalName: 'Legal name',
      cr: 'Commercial Registration',
      vat: 'VAT registration number',
      address: 'Registered address',
      note: 'All prices include 15% VAT. A ZATCA-compliant tax invoice is issued with every order.',
    },
    map: {
      eyebrow: 'Find us',
      title: 'Our Riyadh home',
      address: '{address}',
      directions: 'Get directions',
      imageAlt: 'Calm, light-filled interior',
    },
  },

  faq: {
    metaTitle: 'Help Centre & FAQ',
    metaDescription: 'Answers about delivery times, authenticity, Tabby & Tamara, returns, loyalty points and salon accounts at {store}.',
    hero: {
      eyebrow: 'Help centre',
      title: 'How can we help?',
      lead: 'Quick answers about orders, authenticity, payments and more.',
      searchLabel: 'Search the help centre',
      searchPlaceholder: 'Search e.g. delivery, Tabby, batch code…',
      clearSearch: 'Clear search',
    },
    all: 'All topics',
    resultsCount: '{count} answers for “{query}”',
    noResultsTitle: 'No answers found',
    noResultsText: 'Try a different word, or ask our team directly — we are happy to help.',
    categories: [
      {
        id: 'orders',
        title: 'Orders & Delivery',
        items: [
          { q: 'How long does delivery take?', a: 'Riyadh: 1–2 business days. Jeddah, Dammam, Khobar, Mecca and Medina: 2–3 business days. Other cities: 3–4 business days. Express delivery ({expressDays} business days) is available in major cities. Orders placed before 2 PM, Sunday to Thursday, leave our warehouse the same day.' },
          { q: 'How much does shipping cost?', a: 'Standard delivery is {standardPrice} SAR and free on orders over {threshold} SAR. Express delivery is {expressPrice} SAR. All shipping fees include VAT.' },
          { q: 'Do you deliver everywhere in Saudi Arabia?', a: 'Yes — we deliver to every region of the Kingdom through licensed courier partners. Adding your Saudi National Address short code helps your parcel arrive faster.' },
          { q: 'How can I track my order?', a: 'As soon as your order ships you will receive an SMS and WhatsApp message with a live tracking link. You can also follow it anytime from My Account › Orders.' },
          { q: 'Can I change or cancel my order?', a: 'Yes, within one hour of placing it, before it is packed. Message us on WhatsApp with your order number and we will update or cancel it for you.' },
          { q: 'Will I receive a VAT invoice?', a: 'Every order comes with a ZATCA-compliant electronic tax invoice showing our VAT number ({vat}). It is emailed to you and can be downloaded from your order details.' },
        ],
      },
      {
        id: 'authenticity',
        title: 'Authenticity',
        items: [
          { q: 'Are your products 100% original?', a: 'Yes. We buy exclusively from the authorized Saudi distributors and official agents of every brand we carry. We never sell grey imports, testers or repackaged products.' },
          { q: 'How can I check the batch code on my product?', a: 'The batch code is printed or embossed on the base of the product or the crimp of a tube, and usually matches the code on the outer box. Send us a photo on WhatsApp and we will confirm it against our distributor records.' },
          { q: 'Why might a price be higher than on other websites?', a: 'Unusually low prices often mean parallel imports, old stock or poor storage. Our stock comes through official channels with Arabic labelling and SFDA registration — and is stored correctly — which is what keeps it genuine and fresh.' },
          { q: 'Are your products registered with the SFDA?', a: 'Yes. All cosmetics we sell are notified with the Saudi Food & Drug Authority through the brand’s authorized importer.' },
          { q: 'How do you store products?', a: 'In our climate-controlled Riyadh warehouse at 18–24°C with controlled humidity. During summer, sensitive products such as sunscreens, fragrances and actives ship in insulated packaging.' },
        ],
      },
      {
        id: 'payments',
        title: 'Payments, Tabby & Tamara',
        items: [
          { q: 'Which payment methods do you accept?', a: 'Mada, Visa, Mastercard, Apple Pay, STC Pay, Tabby, Tamara and Cash on Delivery.' },
          { q: 'How does Tabby work?', a: 'Choose Tabby at checkout to split your order into 4 interest-free payments. The first is taken today and the rest every month — no fees when you pay on time. Tabby is Sharia-compliant.' },
          { q: 'How does Tamara work?', a: 'With Tamara you can split your purchase into 3 or 4 interest-free monthly payments, or pay the full amount within 30 days. Approval takes seconds at checkout.' },
          { q: 'Is there a fee for Cash on Delivery?', a: 'A Cash on Delivery fee of {codFee} SAR applies and COD is available for orders up to 2,000 SAR. Most couriers also accept Mada card payment at the door.' },
          { q: 'Do prices include VAT?', a: 'Yes. All prices on {store} include 15% VAT — the price you see is the price you pay, plus shipping where applicable.' },
          { q: 'Is my payment secure?', a: 'Payments are processed by PCI-DSS certified gateways with 3-D Secure verification. We never see or store your full card number.' },
        ],
      },
      {
        id: 'returns',
        title: 'Returns & Refunds',
        items: [
          { q: 'What is your return policy?', a: 'You can return unopened, unused products in their original sealed packaging within 14 days of delivery.' },
          { q: 'Can I return an opened product?', a: 'For hygiene and safety reasons, opened or used cosmetics, skincare, perfume and haircare cannot be returned — unless the product is defective, damaged or not what you ordered.' },
          { q: 'My item arrived damaged or wrong. What should I do?', a: 'Please let us know within 48 hours of delivery with a photo of the item and the packaging. We will send a free replacement or issue a full refund, including shipping.' },
          { q: 'When will I receive my refund?', a: 'Mada and credit cards: 5–10 business days. Apple Pay: same as the linked card. Tabby and Tamara: your remaining instalments are cancelled and paid amounts refunded within 3–5 business days. Cash on Delivery: bank transfer to your IBAN within 5–7 business days.' },
          { q: 'How do I start a return?', a: 'Go to My Account › Returns, select the order and items, and choose a pickup time. You can also start a return on WhatsApp. Free pickup is available in major cities.' },
        ],
      },
      {
        id: 'account',
        title: 'Account & Loyalty',
        items: [
          { q: 'How do I sign in?', a: 'Simply enter your Saudi mobile number and we will send you a one-time password (OTP) by SMS — no password to remember.' },
          { q: 'How do loyalty points work?', a: 'You earn {pointsPerSar} point for every 1 SAR you spend. Every 100 points are worth {pointsValue} SAR off a future order, and you can redeem them at checkout.' },
          { q: 'Do my points expire?', a: 'Points are valid for 12 months from the date they are earned. You can see your balance and expiry dates in My Account › Loyalty.' },
          { q: 'Can I check out as a guest?', a: 'Yes, guest checkout is available. Creating an account lets you track orders, save addresses and earn loyalty points.' },
          { q: 'How do I update my details or addresses?', a: 'Visit My Account › Profile to update your details and My Account › Addresses to add or edit delivery addresses, including your National Address short code.' },
        ],
      },
      {
        id: 'pro',
        title: 'Professionals & Salons',
        items: [
          { q: 'Do you offer salon pricing?', a: 'Yes. Verified salons, spas, barbers and freelance makeup artists receive trade pricing — typically 10–25% off professional lines — plus priority stock on launches.' },
          { q: 'How do I open a professional account?', a: 'Send us your Commercial Registration or Freelance Certificate through the contact form (topic: Salon / professional accounts). Applications are approved within 2 business days.' },
          { q: 'Is there a minimum order for trade customers?', a: 'Trade orders start from 500 SAR, and trade orders over 1,500 SAR ship free anywhere in the Kingdom.' },
          { q: 'Can I get a B2B tax invoice?', a: 'Yes. Add your company name and VAT number to your professional profile and every invoice will be issued as a full B2B tax invoice.' },
          { q: 'Can anyone buy professional products?', a: 'Most professional products are available to everyone. A few items intended for salon use only — such as colour developers and professional peels — are restricted to verified professionals.' },
        ],
      },
    ] as FaqCategory[],
  },

  shipping: {
    metaTitle: 'Shipping Policy',
    metaDescription: 'Delivery times, shipping fees and cash on delivery at {store}. Free standard delivery on orders over {threshold} SAR across Saudi Arabia.',
    eyebrow: 'Customer care',
    title: 'Shipping Policy',
    intro: 'Fast, careful delivery to every city in the Kingdom — with your beauty kept sealed, protected and climate-safe all the way.',
    sections: [
      {
        id: 'coverage',
        title: 'Where we deliver',
        blocks: [
          { type: 'p', text: '{store} delivers to all regions of the Kingdom of Saudi Arabia through licensed courier partners. We currently do not ship outside Saudi Arabia.' },
          { type: 'list', items: ['Home and office addresses in every Saudi city', 'Delivery with your Saudi National Address short code for faster routing', 'Delivery Sunday to Saturday in major cities; Sunday to Thursday elsewhere'] },
        ],
      },
      {
        id: 'fees',
        title: 'Shipping options & fees',
        blocks: [
          {
            type: 'cards',
            items: [
              { title: 'Standard', value: '{standardPrice} SAR', text: '{standardDays} business days · free on orders over {threshold} SAR' },
              { title: 'Express', value: '{expressPrice} SAR', text: '{expressDays} business days · major cities' },
              { title: 'Free delivery', value: '0 SAR', text: 'On standard delivery when your order reaches {threshold} SAR' },
            ],
          },
          {
            type: 'table',
            caption: 'Shipping fees (VAT included)',
            head: ['Method', 'Fee', 'Delivery time', 'Free shipping'],
            rows: [
              ['Standard', '{standardPrice} SAR', '{standardDays} business days', 'Orders over {threshold} SAR'],
              ['Express', '{expressPrice} SAR', '{expressDays} business days', '—'],
            ],
          },
        ],
      },
      {
        id: 'times',
        title: 'Delivery times by city',
        blocks: [
          { type: 'p', text: 'Delivery times are counted in business days from the moment your order leaves our Riyadh warehouse.' },
          {
            type: 'table',
            caption: 'Estimated delivery times',
            head: ['City', 'Standard', 'Express'],
            rows: [
              ['Riyadh', '1–2 days', 'Same or next day'],
              ['Jeddah', '2–3 days', '1–2 days'],
              ['Dammam & Khobar', '2–3 days', '1–2 days'],
              ['Mecca & Medina', '2–3 days', '1–2 days'],
              ['Taif & Jubail', '3–4 days', '2 days'],
              ['Abha & Tabuk', '3–4 days', '2–3 days'],
              ['Other cities & villages', '3–5 days', 'Not available'],
            ],
          },
        ],
      },
      {
        id: 'processing',
        title: 'Order processing',
        blocks: [
          { type: 'list', items: ['Orders placed before 2 PM, Sunday to Thursday, leave our warehouse the same day.', 'Orders placed on Friday or Saturday are processed on the next working day.', 'During Ramadan, White Friday and national holidays, please allow 1–2 extra days.'] },
          { type: 'note', title: 'Weekend & holiday orders', text: 'You can shop any time — we will confirm your order instantly and ship it as soon as our warehouse reopens.', tone: 'champagne' },
        ],
      },
      {
        id: 'tracking',
        title: 'Tracking your order',
        blocks: [
          { type: 'p', text: 'Once your parcel is on its way you will receive an SMS and a WhatsApp message with a live tracking link. You can also follow every step from My Account › Orders.' },
          { type: 'link', text: 'Already ordered?', label: 'Track your order', to: '/account/orders' },
        ],
      },
      {
        id: 'cod',
        title: 'Cash on Delivery',
        blocks: [
          { type: 'p', text: 'Cash on Delivery is available on orders up to 2,000 SAR for a fee of {codFee} SAR (VAT included). Most couriers can also accept Mada card payment at the door.' },
          { type: 'p', text: 'Please have the exact amount ready. Repeatedly refused COD orders may lead to COD being disabled on the account.' },
        ],
      },
      {
        id: 'packaging',
        title: 'Packaging & climate care',
        blocks: [
          { type: 'p', text: 'Every order is packed in tamper-evident packaging. From May to September, heat-sensitive products — fragrances, sunscreens, actives and lipsticks — travel in insulated packaging with cooling inserts.' },
          { type: 'note', title: 'Seal check', text: 'If the {store} security seal on your parcel is broken on arrival, please refuse the delivery or contact us within 48 hours.', tone: 'rose' },
        ],
      },
      {
        id: 'failed',
        title: 'Missed deliveries',
        blocks: [
          { type: 'p', text: 'Our courier will call before arriving and make two delivery attempts. If both are missed, the parcel is held at the nearest branch for 3 days before being returned to us. Shipping fees for returned parcels are non-refundable on prepaid orders.' },
        ],
      },
    ] as PolicySection[],
  } as PolicyCopy,

  returns: {
    metaTitle: 'Return & Refund Policy',
    metaDescription: '14-day returns on sealed, unused products at {store}. Refund timelines for Mada, cards, Tabby, Tamara and cash on delivery.',
    eyebrow: 'Customer care',
    title: 'Return & Refund Policy',
    intro: 'Changed your mind? You have 14 days. Something not right? We will make it right — quickly and fairly.',
    sections: [
      {
        id: 'overview',
        title: 'Our 14-day promise',
        blocks: [
          { type: 'p', text: 'You can return eligible products within 14 days of delivery for a full refund to your original payment method. This policy is in addition to your rights under the Saudi E-Commerce Law.' },
          {
            type: 'cards',
            items: [
              { title: 'Return window', value: '14 days', text: 'From the date of delivery' },
              { title: 'Damaged or wrong item', value: '48 hours', text: 'Report with photos for a free fix' },
              { title: 'Refund to Mada & cards', value: '5–10 days', text: 'Business days after inspection' },
            ],
          },
        ],
      },
      {
        id: 'eligible',
        title: 'What can be returned',
        blocks: [
          { type: 'list', items: ['Products that are unopened, unused and in their original sealed packaging', 'Items returned with all accessories, gifts and free samples included with them', 'Products purchased directly from {store} — online, by phone or on WhatsApp'] },
        ],
      },
      {
        id: 'exceptions',
        title: 'Hygiene exceptions',
        blocks: [
          { type: 'p', text: 'To protect every customer, the following cannot be returned once the seal or cellophane is broken — unless the product is defective, damaged or not what you ordered:' },
          { type: 'list', items: ['Opened or used makeup, skincare, haircare and body care', 'Perfumes and fragrances with a broken cellophane or used atomiser', 'Contact lenses, lash and brow products, and nail products', 'Professional products once mixed or partially used', 'Gift cards and e-vouchers'] },
          { type: 'note', title: 'Not sure about a shade?', text: 'Message our beauty advisors before you open it — we are happy to help you choose so nothing goes to waste.', tone: 'champagne' },
        ],
      },
      {
        id: 'damaged',
        title: 'Damaged, faulty or wrong items',
        blocks: [
          { type: 'p', text: 'If an item arrives damaged, leaking, faulty or different from what you ordered, contact us within 48 hours of delivery with a photo of the product and its packaging. We will arrange a free pickup and send a replacement or issue a full refund, including any shipping fee you paid.' },
        ],
      },
      {
        id: 'how',
        title: 'How to start a return',
        blocks: [
          { type: 'steps', items: ['Go to My Account › Returns and select your order.', 'Choose the items and a reason, and add photos if the item is damaged.', 'Pick a convenient pickup time — or drop the parcel at the courier branch.', 'Once we receive and inspect your return (1–2 business days), your refund is issued.'] },
          { type: 'link', text: 'Ready to send something back?', label: 'Start a return', to: '/account/returns' },
        ],
      },
      {
        id: 'refunds',
        title: 'Refund timelines',
        blocks: [
          {
            type: 'table',
            caption: 'Refunds by payment method',
            head: ['Payment method', 'Refunded to', 'Timeline'],
            rows: [
              ['Mada, Visa & Mastercard', 'Original card', '5–10 business days'],
              ['Apple Pay & STC Pay', 'Original card or wallet', '5–10 business days'],
              ['Tabby', 'Remaining instalments cancelled; paid amount refunded', '3–5 business days'],
              ['Tamara', 'Remaining instalments cancelled; paid amount refunded', '3–5 business days'],
              ['Cash on Delivery', 'Bank transfer to your Saudi IBAN', '5–7 business days'],
            ],
          },
          { type: 'p', text: 'Original shipping and Cash on Delivery fees are refunded only when the return is due to our error. Loyalty points used on the order are restored to your account.' },
        ],
      },
      {
        id: 'costs',
        title: 'Return shipping',
        blocks: [
          { type: 'p', text: 'Pickup is free for damaged, faulty or incorrect items. For change-of-mind returns, a pickup fee of {standardPrice} SAR is deducted from your refund. Exchanges for a different shade or size are treated as a return and a new order.' },
        ],
      },
    ] as PolicySection[],
  } as PolicyCopy,

  privacy: {
    metaTitle: 'Privacy Policy',
    metaDescription: 'How {store} collects, uses and protects your personal data in line with the Saudi Personal Data Protection Law (PDPL).',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    intro: 'Your trust matters more than any sale. This policy explains what personal data we collect, why, and the rights you have under the Saudi Personal Data Protection Law (PDPL).',
    sections: [
      {
        id: 'who',
        title: 'Who we are',
        blocks: [
          { type: 'p', text: '{store} is operated by {legalName}, a company registered in the Kingdom of Saudi Arabia (Commercial Registration {cr}), with its address at {address}. We are the controller of the personal data described in this policy.' },
        ],
      },
      {
        id: 'collect',
        title: 'Data we collect',
        blocks: [
          { type: 'list', items: ['Identity and contact data: name, mobile number, email address', 'Delivery data: addresses and National Address short code', 'Order data: products purchased, invoices, returns and support conversations', 'Payment data: payment method and transaction reference — card numbers are handled only by our certified payment providers', 'Technical data: device, browser, IP address and pages viewed, collected through cookies', 'Preferences you choose to share, such as skin type, hair type or favourite brands'] },
        ],
      },
      {
        id: 'use',
        title: 'How we use your data',
        blocks: [
          { type: 'list', items: ['To process, deliver and support your orders (performance of a contract)', 'To issue tax invoices and meet ZATCA and other legal obligations (legal obligation)', 'To prevent fraud and keep our store secure (legitimate interest)', 'To personalise recommendations and run the loyalty programme', 'To send offers and news — only with your consent, which you can withdraw at any time'] },
        ],
      },
      {
        id: 'share',
        title: 'Who we share it with',
        blocks: [
          { type: 'p', text: 'We never sell your personal data. We share only what is necessary with:' },
          { type: 'list', items: ['Licensed courier partners, to deliver your orders', 'Payment providers, including Tabby and Tamara when you choose them', 'Technology providers who host our store and send our messages, under strict data-processing agreements', 'Government authorities when required by Saudi law'] },
        ],
      },
      {
        id: 'storage',
        title: 'Storage & international transfers',
        blocks: [
          { type: 'p', text: 'Your data is stored on secure servers. Where a provider processes data outside the Kingdom, we transfer it only as permitted by the PDPL and its Implementing Regulations, with appropriate safeguards in place.' },
        ],
      },
      {
        id: 'retention',
        title: 'How long we keep it',
        blocks: [
          { type: 'p', text: 'We keep personal data only for as long as needed for the purposes above. Invoices and order records are kept for the period required by Saudi tax law; marketing data is deleted when you withdraw consent or close your account.' },
        ],
      },
      {
        id: 'rights',
        title: 'Your rights under the PDPL',
        blocks: [
          { type: 'list', items: ['The right to be informed about how your data is collected and used', 'The right to access your personal data and request a copy', 'The right to correct inaccurate or incomplete data', 'The right to request destruction of data that is no longer needed', 'The right to withdraw your consent at any time', 'The right to lodge a complaint with the Saudi Data & AI Authority (SDAIA)'] },
          { type: 'note', title: 'Making a request', text: 'Email {email} from the address linked to your account. We respond within 30 days.', tone: 'ink' },
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies',
        blocks: [
          { type: 'p', text: 'We use essential cookies to keep your bag and session working, and — with your consent — analytics cookies to improve the store. You can manage cookies in your browser settings at any time.' },
        ],
      },
      {
        id: 'security',
        title: 'Security',
        blocks: [
          { type: 'p', text: 'We protect your data with encryption in transit, access controls, OTP sign-in and regular security reviews. If a breach ever affected your data, we would notify you and the competent authority as required by law.' },
        ],
      },
    ] as PolicySection[],
  } as PolicyCopy,

  terms: {
    metaTitle: 'Terms & Conditions',
    metaDescription: 'The terms that apply when you shop at {store}: pricing including VAT, orders, authenticity guarantee and governing Saudi law.',
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
    intro: 'These terms govern your use of {store} and every purchase you make with us. Please read them carefully — by placing an order you agree to them.',
    sections: [
      {
        id: 'about',
        title: 'About these terms',
        blocks: [
          { type: 'p', text: 'The {store} website and services are operated by {legalName} (Commercial Registration {cr}, VAT number {vat}). We may update these terms from time to time; the version published on the date of your order applies to it.' },
        ],
      },
      {
        id: 'account',
        title: 'Your account',
        blocks: [
          { type: 'list', items: ['You must be at least 18 years old, or shop with the involvement of a parent or guardian.', 'You sign in with a one-time password sent to your Saudi mobile number; keep access to your phone secure.', 'Please make sure the information you give us is accurate and up to date.'] },
        ],
      },
      {
        id: 'authenticity',
        title: 'Authenticity guarantee',
        blocks: [
          { type: 'note', title: '100% original — guaranteed', text: 'Every product sold by {store} is genuine and sourced from the brand’s authorized distributor in Saudi Arabia. If any product is proven not to be authentic, we will refund you in full, including shipping.', tone: 'rose' },
        ],
      },
      {
        id: 'pricing',
        title: 'Pricing & VAT',
        blocks: [
          { type: 'p', text: 'All prices are shown in Saudi Riyals (SAR) and include 15% Value Added Tax. Shipping and Cash on Delivery fees, where applicable, are shown before you confirm your order.' },
          { type: 'p', text: 'We work hard to keep prices accurate. If a product is listed at an obvious pricing error, we will contact you before dispatch and you may choose to proceed at the correct price or cancel for a full refund.' },
        ],
      },
      {
        id: 'orders',
        title: 'Orders & acceptance',
        blocks: [
          { type: 'p', text: 'Your order is an offer to buy. A contract is formed when we confirm dispatch. We may decline or cancel an order — for example if an item is out of stock, a payment is not authorised, or quantities exceed reasonable personal use — and any amount paid will be refunded in full.' },
        ],
      },
      {
        id: 'payment',
        title: 'Payment',
        blocks: [
          { type: 'p', text: 'We accept Mada, Visa, Mastercard, Apple Pay, STC Pay, Tabby, Tamara and Cash on Delivery. Tabby and Tamara instalment plans are subject to the provider’s own terms and approval.' },
        ],
      },
      {
        id: 'delivery',
        title: 'Delivery & risk',
        blocks: [
          { type: 'p', text: 'Delivery estimates are set out in our Shipping Policy. Ownership and risk pass to you once the order is delivered to the address you provided.' },
          { type: 'link', text: 'Fees and delivery times by city', label: 'Read the Shipping Policy', to: '/shipping-policy' },
        ],
      },
      {
        id: 'returns',
        title: 'Returns',
        blocks: [
          { type: 'p', text: 'You may return eligible items within 14 days as described in our Return Policy, which forms part of these terms.' },
          { type: 'link', text: 'Conditions, exceptions and refund timelines', label: 'Read the Return Policy', to: '/return-policy' },
        ],
      },
      {
        id: 'promotions',
        title: 'Promotions & loyalty',
        blocks: [
          { type: 'p', text: 'Promo codes cannot be combined unless stated, have no cash value and may be withdrawn at any time. Loyalty points are earned on paid amounts excluding shipping, are valid for 12 months and are worth {pointsValue} SAR per 100 points.' },
        ],
      },
      {
        id: 'ip',
        title: 'Intellectual property',
        blocks: [
          { type: 'p', text: 'Brand names, logos and product images belong to their respective owners. The {store} name, design and content may not be copied or reused without our written permission.' },
        ],
      },
      {
        id: 'liability',
        title: 'Liability',
        blocks: [
          { type: 'p', text: 'Please read product labels and perform a patch test before using new cosmetics. To the extent permitted by law, our liability is limited to the value of the product purchased. Nothing in these terms limits your statutory rights as a consumer.' },
        ],
      },
      {
        id: 'law',
        title: 'Governing law',
        blocks: [
          { type: 'p', text: 'These terms are governed by the laws of the Kingdom of Saudi Arabia, including the E-Commerce Law and its Implementing Regulations. Any dispute will be referred to the competent courts in Riyadh.' },
        ],
      },
    ] as PolicySection[],
  } as PolicyCopy,

  notFound: {
    metaTitle: 'Page not found',
    eyebrow: 'Error 404',
    title: 'This page has gone off-shelf',
    text: 'The page you are looking for may have moved or no longer exists. Try a search, or let us point you somewhere beautiful.',
    searchLabel: 'Search the store',
    quickTitle: 'Popular destinations',
    backHome: 'Back to home',
    imageAlt: 'Beauty products arranged on a vanity',
  },
}

/* ============================================================================
   ARABIC
   ============================================================================ */

const ar: typeof en = {
  shared: {
    lastUpdated: 'آخر تحديث: 1 أكتوبر 2026',
    onThisPage: 'في هذه الصفحة',
    contents: 'المحتويات',
    needHelpTitle: 'هل ما زلتِ بحاجة إلى مساعدة؟',
    needHelpText: 'خبيرات الجمال لدينا يرددن عبر واتساب خلال دقائق، من الأحد إلى الخميس.',
    whatsappCta: 'تحدثي معنا عبر واتساب',
    contactCta: 'تواصلي معنا',
    questionsTitle: 'لديكِ سؤال حول هذه السياسة؟',
    questionsText: 'راسلينا على {email} أو عبر واتساب، وسيرد عليكِ أحد أفراد فريقنا مباشرة.',
  },

  about: {
    metaTitle: 'قصتنا',
    metaDescription: '{store} يقدّم لكِ منتجات تجميل عالمية أصلية 100% من الموزعين المعتمدين فقط، مع توصيل إلى جميع أنحاء المملكة.',
    hero: {
      eyebrow: 'قصتنا',
      title: 'جمال تثقين به، يصلكِ في كل أنحاء المملكة',
      lead: 'انطلق {store} من الرياض بوعد بسيط: كل منتج تفتحينه هو تمامًا كما أرادته العلامة التجارية — أصلي، طازج، ومحفوظ بعناية من الموزع الرسمي حتى باب منزلك.',
      imageAlt: 'لافتة {store} في مقرنا بالرياض',
      caption: 'مقرنا في الرياض — {tagline}',
    },
    story: {
      eyebrow: 'من نحن',
      title: 'وُلدنا في الرياض، وبُنينا على الثقة',
      paragraphs: [
        'أسسنا {store} لأن شراء منتجات التجميل عبر الإنترنت في السعودية كان أشبه بالمجازفة: مصادر غير واضحة، وعبوات باهتة، وعطور لا تشبه رائحتها الأصلية. كنا نؤمن أن المرأة هنا تستحق أفضل من ذلك.',
        'فبنينا المتجر الذي نتمنى أن نتسوق منه بأنفسنا: تشكيلة منتقاة من أكثر منتجات العناية بالبشرة والمكياج والشعر والعطور المحبوبة عالميًا — نشتريها حصريًا من الموزع السعودي المعتمد لكل علامة، ونحفظها في مستودع مكيّف الحرارة، ونوصلها إليكِ بكل عناية.',
        'واليوم نخدم عميلاتنا والصالونات المحترفة في مختلف مناطق المملكة، مع مستشارات يتحدثن لغتكِ ويعرفن مناخكِ وبشرتكِ وروتينكِ.',
      ],
      signature: 'فريق {store}',
      imageAlt: 'تشكيلة منسقة من أساسيات الجمال',
    },
    promise: {
      eyebrow: 'وعدنا',
      title: 'أربعة أمور لا نتنازل عنها أبدًا',
      pillars: [
        { title: 'أصلي 100%', text: 'كل منتج أصلي ويحمل رقم التشغيلة الأصلي ويُباع مغلّفًا — لا يُعاد تعبئته أو تغليفه أو تقسيمه أبدًا.' },
        { title: 'موزعون معتمدون فقط', text: 'نشتري مباشرة من الوكلاء الرسميين لكل علامة في السعودية. لا استيراد موازٍ ولا بضائع رمادية، إطلاقًا.' },
        { title: 'حفظ في بيئة مكيّفة', text: 'مستودعنا في الرياض مضبوط الحرارة والرطوبة، ونستخدم تغليفًا عازلًا في الصيف لتصلكِ التركيبات طازجة كما خرجت.' },
        { title: 'استشارة خبيرة', text: 'مستشارات جمال مدرَّبات يساعدنكِ في اختيار الدرجة أو الروتين أو العطر المناسب — عبر واتساب أو الهاتف أو البريد.' },
      ],
    },
    process: {
      eyebrow: 'رحلة الأصالة',
      title: 'كيف يستحق كل منتج مكانه على رفوفنا',
      intro: 'الأصالة ليست شارة نطبعها، بل منهجية نتبعها مع كل قطعة.',
      steps: [
        { title: 'توريد معتمد', text: 'نشتري فقط من الموزعين السعوديين المعيّنين من العلامات التجارية، بموجب اتفاقيات توريد موقّعة وبضائع مسجّلة لدى هيئة الغذاء والدواء.' },
        { title: 'التحقق من التشغيلة', text: 'نفحص كل شحنة عند وصولها: أرقام التشغيلة، وتواريخ الانتهاء، والملصقات العربية، والأختام، ونطابقها مع فاتورة الموزع.' },
        { title: 'تخزين مكيّف', text: 'نحفظ المنتجات في درجة حرارة بين 18 و24 مئوية ورطوبة مضبوطة وبعيدًا عن الضوء، حفاظًا على المواد الفعالة والألوان والعطور.' },
        { title: 'توصيل مختوم', text: 'نغلّف الطلبات في عبوات عازلة مانعة للعبث، ونسلّمها لشركات شحن موثوقة مع تتبع كامل حتى بابك.' },
      ],
    },
    numbers: {
      eyebrow: '{store} بالأرقام',
      title: 'ننمو مع المملكة',
      stats: [
        { value: '+45', label: 'علامة تجارية عالمية' },
        { value: '13', label: 'مدينة سعودية نخدمها خلال الأسبوع نفسه' },
        { value: '1–3', label: 'أيام للتوصيل في المدن الرئيسية' },
        { value: '14', label: 'يومًا للإرجاع بكل سهولة' },
      ],
    },
    pro: {
      eyebrow: 'للمحترفين',
      title: 'شريك موثوق للصالونات والسبا وخبيرات المكياج',
      text: 'من صبغات وعلاجات الشعر الاحترافية إلى الأدوات والمستلزمات، يزوّد برنامجنا التجاري محترفات الجمال في المملكة بمنتجات أصلية وأسعار خاصة وتوصيل يُعتمد عليه.',
      bullets: ['أسعار تجارية للصالونات والعاملات المستقلات الموثّقات', 'فواتير ضريبية للشركات تحمل رقمكِ الضريبي', 'مديرة حساب مخصصة عبر واتساب'],
      cta: 'افتحي حسابًا احترافيًا',
      imageAlt: 'صالون شعر احترافي',
    },
    cta: {
      title: 'اكتشفي مفضّلكِ القادم',
      text: 'تصفحي أحدث المنتجات والعلامات التي تحبينها — جميعها أصلية ومن موزعين معتمدين.',
      shop: 'تسوقي الجديد',
      brands: 'استكشفي العلامات',
    },
  },

  contact: {
    metaTitle: 'تواصلي معنا',
    metaDescription: 'تواصلي مع خدمة عملاء {store} عبر واتساب أو الهاتف أو البريد الإلكتروني. استشارات جمال ودعم الطلبات وحسابات المحترفين في جميع أنحاء السعودية.',
    hero: {
      eyebrow: 'خدمة العملاء',
      title: 'نحن هنا من أجلكِ',
      lead: 'لديكِ سؤال عن طلب، أو الدرجة المناسبة، أو حساب لصالونك؟ فريقنا في الرياض يرد خلال 24 ساعة — وغالبًا أسرع بكثير.',
    },
    cards: {
      whatsapp: { title: 'واتساب', text: 'أسرع طريقة للتواصل مع مستشارة جمال.', action: 'ابدئي المحادثة' },
      phone: { title: 'اتصلي بنا', text: 'تحدثي مع فريق خدمة العملاء.', action: 'اتصلي الآن' },
      email: { title: 'البريد الإلكتروني', text: 'للطلبات التفصيلية وإرسال المستندات.', action: 'أرسلي بريدًا' },
      hours: { title: 'ساعات العمل', text: 'نرد على الرسائل الواردة خارج هذه الأوقات في يوم العمل التالي.' },
    },
    hoursValue: 'الأحد – الخميس، 9:00 ص – 10:00 م',
    form: {
      eyebrow: 'راسلينا',
      title: 'أرسلي لنا رسالة',
      intro: 'املئي النموذج وسيتواصل معكِ الشخص المناسب من فريقنا.',
      name: 'الاسم الكامل',
      namePlaceholder: 'مثال: نورة القحطاني',
      email: 'البريد الإلكتروني',
      phone: 'رقم الجوال',
      phoneHint: 'رقم جوال سعودي، مثال: ‎+966 5X XXX XXXX',
      topic: 'الموضوع',
      topicPlaceholder: 'اختاري الموضوع',
      topics: {
        order: 'استفسار عن طلب',
        advice: 'استشارة حول منتج',
        salon: 'حسابات الصالونات والمحترفين',
        partnership: 'الشراكات',
        other: 'موضوع آخر',
      },
      orderNumber: 'رقم الطلب',
      orderHint: 'تجدينه في رسالة تأكيد الطلب، مثال: LK-100245',
      message: 'الرسالة',
      messagePlaceholder: 'أخبرينا كيف يمكننا مساعدتكِ…',
      messageShort: 'يرجى كتابة 10 أحرف على الأقل',
      chooseTopic: 'يرجى اختيار الموضوع',
      submit: 'إرسال الرسالة',
      privacy: 'بإرسال هذا النموذج فإنكِ توافقين على سياسة الخصوصية. نستخدم بياناتكِ فقط للرد على طلبك.',
      successTitle: 'شكرًا لكِ يا {name}',
      successText: 'وصلت رسالتكِ إلى فريق خدمة العملاء، وسنرد عليكِ على {email} خلال 24 ساعة.',
      reference: 'الرقم المرجعي',
      sendAnother: 'إرسال رسالة أخرى',
    },
    business: {
      eyebrow: 'معلومات المنشأة',
      title: 'منشأة مسجلة في المملكة العربية السعودية',
      legalName: 'الاسم التجاري',
      cr: 'السجل التجاري',
      vat: 'الرقم الضريبي',
      address: 'العنوان المسجل',
      note: 'جميع الأسعار شاملة ضريبة القيمة المضافة 15%، ونُصدر فاتورة ضريبية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك مع كل طلب.',
    },
    map: {
      eyebrow: 'موقعنا',
      title: 'مقرنا في الرياض',
      address: 'طريق الملك فهد، حي العليا، الرياض 12211، المملكة العربية السعودية',
      directions: 'احصلي على الاتجاهات',
      imageAlt: 'مساحة داخلية هادئة ومضيئة',
    },
  },

  faq: {
    metaTitle: 'مركز المساعدة والأسئلة الشائعة',
    metaDescription: 'إجابات حول مدة التوصيل والأصالة وتابي وتمارا والإرجاع ونقاط الولاء وحسابات الصالونات في {store}.',
    hero: {
      eyebrow: 'مركز المساعدة',
      title: 'كيف يمكننا مساعدتكِ؟',
      lead: 'إجابات سريعة حول الطلبات والأصالة والدفع وغيرها.',
      searchLabel: 'ابحثي في مركز المساعدة',
      searchPlaceholder: 'ابحثي مثلًا: التوصيل، تابي، رقم التشغيلة…',
      clearSearch: 'مسح البحث',
    },
    all: 'كل المواضيع',
    resultsCount: '{count} إجابة عن «{query}»',
    noResultsTitle: 'لم نجد إجابات',
    noResultsText: 'جرّبي كلمة أخرى، أو اسألي فريقنا مباشرة — يسعدنا مساعدتكِ.',
    categories: [
      {
        id: 'orders',
        title: 'الطلبات والتوصيل',
        items: [
          { q: 'كم يستغرق التوصيل؟', a: 'الرياض: 1–2 يوم عمل. جدة والدمام والخبر ومكة المكرمة والمدينة المنورة: 2–3 أيام عمل. باقي المدن: 3–4 أيام عمل. يتوفر التوصيل السريع ({expressDays} يوم عمل) في المدن الرئيسية. الطلبات التي تصل قبل الساعة 2 ظهرًا من الأحد إلى الخميس تُشحن في اليوم نفسه.' },
          { q: 'كم تكلفة الشحن؟', a: 'التوصيل العادي بـ {standardPrice} ريال ومجاني للطلبات التي تتجاوز {threshold} ريال، والتوصيل السريع بـ {expressPrice} ريال. جميع رسوم الشحن شاملة ضريبة القيمة المضافة.' },
          { q: 'هل توصلون إلى جميع مناطق المملكة؟', a: 'نعم، نوصل إلى جميع مناطق المملكة عبر شركاء شحن مرخّصين. إضافة الرمز المختصر لعنوانكِ الوطني تساعد على وصول الشحنة أسرع.' },
          { q: 'كيف أتتبع طلبي؟', a: 'بمجرد شحن طلبكِ ستصلكِ رسالة نصية ورسالة واتساب برابط تتبع مباشر، ويمكنكِ متابعته في أي وقت من حسابي › الطلبات.' },
          { q: 'هل يمكنني تعديل طلبي أو إلغاؤه؟', a: 'نعم، خلال ساعة من تقديمه وقبل تغليفه. راسلينا عبر واتساب برقم الطلب وسنعدّله أو نلغيه لكِ.' },
          { q: 'هل سأحصل على فاتورة ضريبية؟', a: 'يرافق كل طلب فاتورة ضريبية إلكترونية متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك وتحمل رقمنا الضريبي ({vat})، تُرسل إلى بريدكِ ويمكن تنزيلها من تفاصيل الطلب.' },
        ],
      },
      {
        id: 'authenticity',
        title: 'الأصالة',
        items: [
          { q: 'هل منتجاتكم أصلية 100%؟', a: 'نعم. نشتري حصريًا من الموزعين السعوديين المعتمدين والوكلاء الرسميين لكل علامة نبيعها، ولا نبيع أبدًا منتجات مستوردة بشكل موازٍ أو عينات تجريبية أو منتجات معاد تغليفها.' },
          { q: 'كيف أتحقق من رقم التشغيلة على المنتج؟', a: 'رقم التشغيلة مطبوع أو محفور أسفل المنتج أو على طرف الأنبوب، ويطابق عادةً الرقم الموجود على العلبة الخارجية. أرسلي لنا صورة عبر واتساب وسنتحقق منه مقابل سجلات الموزع.' },
          { q: 'لماذا قد يكون السعر أعلى من مواقع أخرى؟', a: 'الأسعار المنخفضة بشكل غير طبيعي تعني غالبًا استيرادًا موازيًا أو مخزونًا قديمًا أو تخزينًا سيئًا. منتجاتنا تأتي عبر القنوات الرسمية بملصقات عربية وتسجيل لدى هيئة الغذاء والدواء، وتُحفظ بالطريقة الصحيحة — وهذا ما يضمن أصالتها وجودتها.' },
          { q: 'هل منتجاتكم مسجلة لدى هيئة الغذاء والدواء؟', a: 'نعم. جميع مستحضرات التجميل التي نبيعها مسجّلة لدى الهيئة العامة للغذاء والدواء عن طريق المستورد المعتمد للعلامة.' },
          { q: 'كيف تحفظون المنتجات؟', a: 'في مستودعنا المكيّف بالرياض بدرجة حرارة بين 18 و24 مئوية ورطوبة مضبوطة. وفي الصيف تُشحن المنتجات الحساسة مثل واقيات الشمس والعطور والمواد الفعالة في تغليف عازل.' },
        ],
      },
      {
        id: 'payments',
        title: 'الدفع وتابي وتمارا',
        items: [
          { q: 'ما طرق الدفع المتاحة؟', a: 'مدى، وفيزا، وماستركارد، وApple Pay، وSTC Pay، وتابي، وتمارا، والدفع عند الاستلام.' },
          { q: 'كيف يعمل تابي؟', a: 'اختاري تابي عند إتمام الطلب لتقسيم المبلغ على 4 دفعات بدون فوائد: الأولى اليوم والباقي شهريًا، دون أي رسوم عند السداد في الموعد. تابي متوافق مع أحكام الشريعة.' },
          { q: 'كيف تعمل تمارا؟', a: 'مع تمارا يمكنكِ تقسيم مشترياتكِ على 3 أو 4 دفعات شهرية بدون فوائد، أو دفع المبلغ كاملًا خلال 30 يومًا. الموافقة تتم خلال ثوانٍ عند إتمام الطلب.' },
          { q: 'هل توجد رسوم للدفع عند الاستلام؟', a: 'تُضاف رسوم قدرها {codFee} ريال للدفع عند الاستلام، وهو متاح للطلبات حتى 2,000 ريال. ويقبل معظم المندوبين الدفع ببطاقة مدى عند الباب.' },
          { q: 'هل الأسعار شاملة ضريبة القيمة المضافة؟', a: 'نعم. جميع الأسعار في {store} شاملة ضريبة القيمة المضافة 15% — السعر الذي تشاهدينه هو ما تدفعينه، إضافة إلى رسوم الشحن عند انطباقها.' },
          { q: 'هل الدفع آمن؟', a: 'تتم معالجة المدفوعات عبر بوابات حاصلة على شهادة PCI-DSS مع التحقق الثلاثي 3-D Secure، ولا نطّلع على رقم بطاقتكِ الكامل ولا نحفظه.' },
        ],
      },
      {
        id: 'returns',
        title: 'الإرجاع والاسترداد',
        items: [
          { q: 'ما سياسة الإرجاع لديكم؟', a: 'يمكنكِ إرجاع المنتجات غير المفتوحة وغير المستخدمة في عبوتها الأصلية المغلقة خلال 14 يومًا من الاستلام.' },
          { q: 'هل يمكنني إرجاع منتج مفتوح؟', a: 'لأسباب صحية وحفاظًا على السلامة، لا يمكن إرجاع مستحضرات التجميل والعناية بالبشرة والعطور والعناية بالشعر بعد فتحها أو استخدامها — إلا إذا كان المنتج معيبًا أو تالفًا أو غير مطابق لطلبك.' },
          { q: 'وصلني منتج تالف أو خاطئ، ماذا أفعل؟', a: 'أبلغينا خلال 48 ساعة من الاستلام مع صورة للمنتج والتغليف، وسنرسل لكِ بديلًا مجانًا أو نعيد المبلغ كاملًا شاملًا الشحن.' },
          { q: 'متى أستلم المبلغ المسترد؟', a: 'مدى والبطاقات الائتمانية: 5–10 أيام عمل. Apple Pay: حسب البطاقة المرتبطة. تابي وتمارا: تُلغى الأقساط المتبقية ويُعاد المبلغ المدفوع خلال 3–5 أيام عمل. الدفع عند الاستلام: تحويل بنكي إلى رقم الآيبان خلال 5–7 أيام عمل.' },
          { q: 'كيف أبدأ طلب إرجاع؟', a: 'من حسابي › المرتجعات اختاري الطلب والمنتجات وحددي موعد الاستلام، أو ابدئي الإرجاع عبر واتساب. الاستلام مجاني في المدن الرئيسية.' },
        ],
      },
      {
        id: 'account',
        title: 'الحساب ونقاط الولاء',
        items: [
          { q: 'كيف أسجل الدخول؟', a: 'أدخلي رقم جوالكِ السعودي وسنرسل لكِ رمز تحقق لمرة واحدة (OTP) برسالة نصية — دون الحاجة إلى كلمة مرور.' },
          { q: 'كيف تعمل نقاط الولاء؟', a: 'تحصلين على {pointsPerSar} نقطة مقابل كل 1 ريال تنفقينه، وكل 100 نقطة تساوي خصم {pointsValue} ريال على طلب لاحق، ويمكنكِ استبدالها عند إتمام الطلب.' },
          { q: 'هل تنتهي صلاحية النقاط؟', a: 'النقاط صالحة لمدة 12 شهرًا من تاريخ اكتسابها، ويمكنكِ متابعة رصيدكِ وتواريخ الانتهاء من حسابي › نقاط الولاء.' },
          { q: 'هل يمكنني الشراء كزائرة؟', a: 'نعم، الشراء كزائرة متاح. أما إنشاء حساب فيتيح لكِ تتبع الطلبات وحفظ العناوين وكسب نقاط الولاء.' },
          { q: 'كيف أحدّث بياناتي أو عناويني؟', a: 'من حسابي › الملف الشخصي لتحديث بياناتك، ومن حسابي › العناوين لإضافة عناوين التوصيل أو تعديلها، بما فيها الرمز المختصر للعنوان الوطني.' },
        ],
      },
      {
        id: 'pro',
        title: 'المحترفون والصالونات',
        items: [
          { q: 'هل لديكم أسعار خاصة للصالونات؟', a: 'نعم. تحصل الصالونات ومراكز السبا والحلاقون وخبيرات المكياج المستقلات الموثّقون على أسعار تجارية — عادةً خصم بين 10% و25% على الخطوط الاحترافية — مع أولوية في المنتجات الجديدة.' },
          { q: 'كيف أفتح حسابًا احترافيًا؟', a: 'أرسلي لنا السجل التجاري أو وثيقة العمل الحر عبر نموذج التواصل (الموضوع: حسابات الصالونات والمحترفين)، ونعتمد الطلبات خلال يومي عمل.' },
          { q: 'هل يوجد حد أدنى لطلبات المحترفين؟', a: 'تبدأ الطلبات التجارية من 500 ريال، والطلبات التجارية التي تتجاوز 1,500 ريال تُشحن مجانًا إلى أي مكان في المملكة.' },
          { q: 'هل يمكنني الحصول على فاتورة ضريبية للمنشآت؟', a: 'نعم. أضيفي اسم المنشأة ورقمها الضريبي إلى ملفكِ الاحترافي، وستصدر جميع فواتيركِ كفواتير ضريبية كاملة بين المنشآت.' },
          { q: 'هل يمكن لأي شخص شراء المنتجات الاحترافية؟', a: 'معظم المنتجات الاحترافية متاحة للجميع، باستثناء عدد محدود مخصص للاستخدام في الصالونات فقط — مثل مطوّرات الصبغة والتقشير الاحترافي — وهي متاحة للمحترفين الموثّقين فقط.' },
        ],
      },
    ],
  },

  shipping: {
    metaTitle: 'سياسة الشحن',
    metaDescription: 'مدة التوصيل ورسوم الشحن والدفع عند الاستلام في {store}. توصيل عادي مجاني للطلبات التي تتجاوز {threshold} ريال في جميع أنحاء السعودية.',
    eyebrow: 'خدمة العملاء',
    title: 'سياسة الشحن',
    intro: 'توصيل سريع وحريص إلى كل مدن المملكة — مع بقاء منتجاتكِ مختومة ومحمية من الحرارة طوال الطريق.',
    sections: [
      {
        id: 'coverage',
        title: 'مناطق التوصيل',
        blocks: [
          { type: 'p', text: 'يوصل {store} إلى جميع مناطق المملكة العربية السعودية عبر شركاء شحن مرخّصين، ولا نشحن حاليًا خارج المملكة.' },
          { type: 'list', items: ['التوصيل إلى المنازل والمكاتب في جميع المدن السعودية', 'التوصيل باستخدام الرمز المختصر للعنوان الوطني لتسريع الوصول', 'التوصيل طوال أيام الأسبوع في المدن الرئيسية، ومن الأحد إلى الخميس في باقي المدن'] },
        ],
      },
      {
        id: 'fees',
        title: 'خيارات الشحن والرسوم',
        blocks: [
          {
            type: 'cards',
            items: [
              { title: 'التوصيل العادي', value: '{standardPrice} ريال', text: '{standardDays} أيام عمل · مجاني للطلبات فوق {threshold} ريال' },
              { title: 'التوصيل السريع', value: '{expressPrice} ريال', text: '{expressDays} يوم عمل · المدن الرئيسية' },
              { title: 'توصيل مجاني', value: '0 ريال', text: 'للتوصيل العادي عندما يبلغ طلبكِ {threshold} ريال' },
            ],
          },
          {
            type: 'table',
            caption: 'رسوم الشحن (شاملة الضريبة)',
            head: ['الطريقة', 'الرسوم', 'مدة التوصيل', 'الشحن المجاني'],
            rows: [
              ['عادي', '{standardPrice} ريال', '{standardDays} أيام عمل', 'للطلبات فوق {threshold} ريال'],
              ['سريع', '{expressPrice} ريال', '{expressDays} يوم عمل', '—'],
            ],
          },
        ],
      },
      {
        id: 'times',
        title: 'مدة التوصيل حسب المدينة',
        blocks: [
          { type: 'p', text: 'تُحتسب مدة التوصيل بأيام العمل من لحظة خروج طلبكِ من مستودعنا في الرياض.' },
          {
            type: 'table',
            caption: 'مدة التوصيل التقديرية',
            head: ['المدينة', 'عادي', 'سريع'],
            rows: [
              ['الرياض', '1–2 يوم', 'في اليوم نفسه أو التالي'],
              ['جدة', '2–3 أيام', '1–2 يوم'],
              ['الدمام والخبر', '2–3 أيام', '1–2 يوم'],
              ['مكة المكرمة والمدينة المنورة', '2–3 أيام', '1–2 يوم'],
              ['الطائف والجبيل', '3–4 أيام', 'يومان'],
              ['أبها وتبوك', '3–4 أيام', '2–3 أيام'],
              ['المدن والقرى الأخرى', '3–5 أيام', 'غير متاح'],
            ],
          },
        ],
      },
      {
        id: 'processing',
        title: 'تجهيز الطلبات',
        blocks: [
          { type: 'list', items: ['الطلبات التي تصل قبل الساعة 2 ظهرًا من الأحد إلى الخميس تخرج من مستودعنا في اليوم نفسه.', 'الطلبات التي تصل يومي الجمعة والسبت تُجهَّز في يوم العمل التالي.', 'خلال رمضان والجمعة البيضاء والإجازات الرسمية، قد يستغرق التوصيل يومًا أو يومين إضافيين.'] },
          { type: 'note', title: 'طلبات العطلات ونهاية الأسبوع', text: 'تسوقي في أي وقت — سنؤكد طلبكِ فورًا ونشحنه بمجرد عودة المستودع للعمل.', tone: 'champagne' },
        ],
      },
      {
        id: 'tracking',
        title: 'تتبع الطلب',
        blocks: [
          { type: 'p', text: 'بمجرد انطلاق شحنتكِ ستصلكِ رسالة نصية ورسالة واتساب برابط تتبع مباشر، ويمكنكِ متابعة كل خطوة من حسابي › الطلبات.' },
          { type: 'link', text: 'هل طلبتِ بالفعل؟', label: 'تتبعي طلبكِ', to: '/account/orders' },
        ],
      },
      {
        id: 'cod',
        title: 'الدفع عند الاستلام',
        blocks: [
          { type: 'p', text: 'الدفع عند الاستلام متاح للطلبات حتى 2,000 ريال مقابل رسوم قدرها {codFee} ريال (شاملة الضريبة)، ويقبل معظم المندوبين الدفع ببطاقة مدى عند الباب.' },
          { type: 'p', text: 'يرجى تجهيز المبلغ المطلوب. قد يؤدي رفض الطلبات المتكرر إلى إيقاف خيار الدفع عند الاستلام في الحساب.' },
        ],
      },
      {
        id: 'packaging',
        title: 'التغليف والحماية من الحرارة',
        blocks: [
          { type: 'p', text: 'نغلّف كل طلب بعبوة مانعة للعبث. ومن مايو إلى سبتمبر، تُشحن المنتجات الحساسة للحرارة — العطور وواقيات الشمس والمواد الفعالة وأحمر الشفاه — في تغليف عازل مع عناصر تبريد.' },
          { type: 'note', title: 'تحققي من الختم', text: 'إذا وجدتِ ختم {store} الأمني على الشحنة مكسورًا عند الاستلام، يرجى رفض الشحنة أو التواصل معنا خلال 48 ساعة.', tone: 'rose' },
        ],
      },
      {
        id: 'failed',
        title: 'تعذّر التوصيل',
        blocks: [
          { type: 'p', text: 'يتصل المندوب قبل الوصول ويحاول التوصيل مرتين. إذا تعذّر التسليم في المحاولتين تُحفظ الشحنة في أقرب فرع لمدة 3 أيام ثم تُعاد إلينا. ولا تُسترد رسوم الشحن للشحنات المرتجعة في الطلبات المدفوعة مسبقًا.' },
        ],
      },
    ],
  },

  returns: {
    metaTitle: 'سياسة الإرجاع والاسترداد',
    metaDescription: 'إرجاع خلال 14 يومًا للمنتجات المغلقة وغير المستخدمة في {store}، ومدد الاسترداد لمدى والبطاقات وتابي وتمارا والدفع عند الاستلام.',
    eyebrow: 'خدمة العملاء',
    title: 'سياسة الإرجاع والاسترداد',
    intro: 'غيّرتِ رأيكِ؟ لديكِ 14 يومًا. هناك خطأ ما؟ سنصلحه بسرعة وإنصاف.',
    sections: [
      {
        id: 'overview',
        title: 'وعدنا خلال 14 يومًا',
        blocks: [
          { type: 'p', text: 'يمكنكِ إرجاع المنتجات المؤهلة خلال 14 يومًا من الاستلام واسترداد المبلغ كاملًا إلى وسيلة الدفع الأصلية. تأتي هذه السياسة إضافةً إلى حقوقكِ بموجب نظام التجارة الإلكترونية السعودي.' },
          {
            type: 'cards',
            items: [
              { title: 'مدة الإرجاع', value: '14 يومًا', text: 'من تاريخ الاستلام' },
              { title: 'منتج تالف أو خاطئ', value: '48 ساعة', text: 'أبلغينا بالصور لحل مجاني' },
              { title: 'الاسترداد إلى مدى والبطاقات', value: '5–10 أيام', text: 'أيام عمل بعد الفحص' },
            ],
          },
        ],
      },
      {
        id: 'eligible',
        title: 'ما يمكن إرجاعه',
        blocks: [
          { type: 'list', items: ['المنتجات غير المفتوحة وغير المستخدمة في عبوتها الأصلية المغلقة', 'المنتجات المرتجعة مع جميع ملحقاتها والهدايا والعينات المرفقة بها', 'المنتجات المشتراة مباشرة من {store} — عبر الموقع أو الهاتف أو واتساب'] },
        ],
      },
      {
        id: 'exceptions',
        title: 'الاستثناءات الصحية',
        blocks: [
          { type: 'p', text: 'حرصًا على سلامة جميع عميلاتنا، لا يمكن إرجاع المنتجات التالية بعد كسر الختم أو إزالة الغلاف — إلا إذا كانت معيبة أو تالفة أو غير مطابقة لطلبك:' },
          { type: 'list', items: ['المكياج ومنتجات العناية بالبشرة والشعر والجسم المفتوحة أو المستخدمة', 'العطور التي أُزيل غلافها أو استُخدم بخّاخها', 'العدسات اللاصقة ومنتجات الرموش والحواجب والأظافر', 'المنتجات الاحترافية بعد خلطها أو استخدام جزء منها', 'بطاقات الهدايا والقسائم الإلكترونية'] },
          { type: 'note', title: 'لستِ متأكدة من الدرجة؟', text: 'راسلي مستشارات الجمال قبل فتح المنتج — يسعدنا مساعدتكِ في الاختيار حتى لا يضيع شيء.', tone: 'champagne' },
        ],
      },
      {
        id: 'damaged',
        title: 'المنتجات التالفة أو المعيبة أو الخاطئة',
        blocks: [
          { type: 'p', text: 'إذا وصلكِ منتج تالف أو مسرّب أو معيب أو مختلف عن طلبك، تواصلي معنا خلال 48 ساعة من الاستلام مع صورة للمنتج وتغليفه. سنرتب استلامه مجانًا ونرسل بديلًا أو نعيد المبلغ كاملًا شاملًا رسوم الشحن.' },
        ],
      },
      {
        id: 'how',
        title: 'كيف تبدئين طلب الإرجاع',
        blocks: [
          { type: 'steps', items: ['ادخلي إلى حسابي › المرتجعات واختاري الطلب.', 'حددي المنتجات وسبب الإرجاع، وأرفقي صورًا إن كان المنتج تالفًا.', 'اختاري موعدًا مناسبًا للاستلام — أو سلّمي الشحنة في فرع شركة الشحن.', 'بعد استلام المرتجع وفحصه (1–2 يوم عمل) نصدر المبلغ المسترد.'] },
          { type: 'link', text: 'جاهزة لإرجاع منتج؟', label: 'ابدئي طلب الإرجاع', to: '/account/returns' },
        ],
      },
      {
        id: 'refunds',
        title: 'مدد الاسترداد',
        blocks: [
          {
            type: 'table',
            caption: 'الاسترداد حسب طريقة الدفع',
            head: ['طريقة الدفع', 'يُسترد إلى', 'المدة'],
            rows: [
              ['مدى وفيزا وماستركارد', 'البطاقة الأصلية', '5–10 أيام عمل'],
              ['Apple Pay وSTC Pay', 'البطاقة أو المحفظة الأصلية', '5–10 أيام عمل'],
              ['تابي', 'إلغاء الأقساط المتبقية وإعادة المبلغ المدفوع', '3–5 أيام عمل'],
              ['تمارا', 'إلغاء الأقساط المتبقية وإعادة المبلغ المدفوع', '3–5 أيام عمل'],
              ['الدفع عند الاستلام', 'تحويل بنكي إلى رقم الآيبان السعودي', '5–7 أيام عمل'],
            ],
          },
          { type: 'p', text: 'تُسترد رسوم الشحن الأصلية ورسوم الدفع عند الاستلام فقط عندما يكون الإرجاع بسبب خطأ من جهتنا، وتُعاد نقاط الولاء المستخدمة في الطلب إلى حسابك.' },
        ],
      },
      {
        id: 'costs',
        title: 'رسوم شحن المرتجعات',
        blocks: [
          { type: 'p', text: 'الاستلام مجاني للمنتجات التالفة أو المعيبة أو الخاطئة. أما عند الإرجاع لتغيير الرأي فتُخصم رسوم استلام قدرها {standardPrice} ريال من المبلغ المسترد. ويُعامل استبدال الدرجة أو الحجم كإرجاع وطلب جديد.' },
        ],
      },
    ],
  },

  privacy: {
    metaTitle: 'سياسة الخصوصية',
    metaDescription: 'كيف يجمع {store} بياناتكِ الشخصية ويستخدمها ويحميها وفقًا لنظام حماية البيانات الشخصية في المملكة العربية السعودية.',
    eyebrow: 'قانوني',
    title: 'سياسة الخصوصية',
    intro: 'ثقتكِ أهم لدينا من أي عملية بيع. توضح هذه السياسة البيانات الشخصية التي نجمعها وسبب جمعها، والحقوق التي يكفلها لكِ نظام حماية البيانات الشخصية السعودي.',
    sections: [
      {
        id: 'who',
        title: 'من نحن',
        blocks: [
          { type: 'p', text: 'يُدار {store} من قِبل {legalName}، وهي منشأة مسجلة في المملكة العربية السعودية (سجل تجاري رقم {cr})، وعنوانها {address}. ونحن جهة التحكم في البيانات الشخصية الموضحة في هذه السياسة.' },
        ],
      },
      {
        id: 'collect',
        title: 'البيانات التي نجمعها',
        blocks: [
          { type: 'list', items: ['بيانات الهوية والتواصل: الاسم ورقم الجوال والبريد الإلكتروني', 'بيانات التوصيل: العناوين والرمز المختصر للعنوان الوطني', 'بيانات الطلبات: المنتجات المشتراة والفواتير والمرتجعات ومحادثات الدعم', 'بيانات الدفع: وسيلة الدفع والرقم المرجعي للعملية — أما أرقام البطاقات فلا يتعامل معها إلا مزودو الدفع المعتمدون', 'البيانات التقنية: الجهاز والمتصفح وعنوان IP والصفحات التي تزورينها، وتُجمع عبر ملفات تعريف الارتباط', 'التفضيلات التي تختارين مشاركتها، مثل نوع البشرة أو الشعر أو علاماتكِ المفضلة'] },
        ],
      },
      {
        id: 'use',
        title: 'كيف نستخدم بياناتكِ',
        blocks: [
          { type: 'list', items: ['لمعالجة طلباتكِ وتوصيلها ودعمها (تنفيذ العقد)', 'لإصدار الفواتير الضريبية والوفاء بمتطلبات هيئة الزكاة والضريبة والجمارك وغيرها (التزام نظامي)', 'لمنع الاحتيال والحفاظ على أمان المتجر (مصلحة مشروعة)', 'لتخصيص التوصيات وإدارة برنامج الولاء', 'لإرسال العروض والأخبار — بموافقتكِ فقط، ويمكنكِ سحبها في أي وقت'] },
        ],
      },
      {
        id: 'share',
        title: 'مع من نشاركها',
        blocks: [
          { type: 'p', text: 'لا نبيع بياناتكِ الشخصية أبدًا، ونشارك فقط ما يلزم مع:' },
          { type: 'list', items: ['شركاء الشحن المرخّصين لتوصيل طلباتك', 'مزودي خدمات الدفع، بما فيهم تابي وتمارا عند اختيارهما', 'مزودي التقنية الذين يستضيفون متجرنا ويرسلون رسائلنا، بموجب اتفاقيات صارمة لمعالجة البيانات', 'الجهات الحكومية عندما يقتضي النظام السعودي ذلك'] },
        ],
      },
      {
        id: 'storage',
        title: 'التخزين والنقل خارج المملكة',
        blocks: [
          { type: 'p', text: 'تُحفظ بياناتكِ على خوادم آمنة. وفي حال معالجة أحد المزودين للبيانات خارج المملكة، فإننا لا ننقلها إلا بالقدر الذي يسمح به نظام حماية البيانات الشخصية ولوائحه التنفيذية، ومع توفير الضمانات المناسبة.' },
        ],
      },
      {
        id: 'retention',
        title: 'مدة الاحتفاظ بالبيانات',
        blocks: [
          { type: 'p', text: 'نحتفظ بالبيانات الشخصية فقط للمدة اللازمة للأغراض المذكورة أعلاه. تُحفظ الفواتير وسجلات الطلبات للمدة التي تفرضها الأنظمة الضريبية السعودية، وتُحذف بيانات التسويق عند سحب موافقتكِ أو إغلاق حسابك.' },
        ],
      },
      {
        id: 'rights',
        title: 'حقوقكِ وفق نظام حماية البيانات الشخصية',
        blocks: [
          { type: 'list', items: ['الحق في العلم بكيفية جمع بياناتكِ واستخدامها', 'الحق في الوصول إلى بياناتكِ الشخصية وطلب نسخة منها', 'الحق في تصحيح البيانات غير الدقيقة أو غير المكتملة', 'الحق في طلب إتلاف البيانات التي لم تعد هناك حاجة إليها', 'الحق في سحب موافقتكِ في أي وقت', 'الحق في تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)'] },
          { type: 'note', title: 'تقديم طلب', text: 'راسلينا على {email} من البريد المرتبط بحسابك، وسنرد خلال 30 يومًا.', tone: 'ink' },
        ],
      },
      {
        id: 'cookies',
        title: 'ملفات تعريف الارتباط',
        blocks: [
          { type: 'p', text: 'نستخدم ملفات تعريف الارتباط الأساسية لتعمل سلة التسوق والجلسة بشكل صحيح، و— بموافقتكِ — ملفات التحليلات لتحسين المتجر. ويمكنكِ إدارتها من إعدادات المتصفح في أي وقت.' },
        ],
      },
      {
        id: 'security',
        title: 'أمن البيانات',
        blocks: [
          { type: 'p', text: 'نحمي بياناتكِ بالتشفير أثناء النقل، وضوابط الوصول، وتسجيل الدخول برمز التحقق، والمراجعات الأمنية الدورية. وفي حال تعرّض بياناتكِ لأي اختراق، سنبلغكِ ونبلغ الجهة المختصة وفق ما يقتضيه النظام.' },
        ],
      },
    ],
  },

  terms: {
    metaTitle: 'الشروط والأحكام',
    metaDescription: 'الشروط المطبقة عند التسوق من {store}: الأسعار شاملة الضريبة، والطلبات، وضمان الأصالة، والنظام السعودي الحاكم.',
    eyebrow: 'قانوني',
    title: 'الشروط والأحكام',
    intro: 'تنظّم هذه الشروط استخدامكِ لمتجر {store} وجميع مشترياتكِ منه. يرجى قراءتها بعناية، فبإتمام الطلب فإنكِ توافقين عليها.',
    sections: [
      {
        id: 'about',
        title: 'حول هذه الشروط',
        blocks: [
          { type: 'p', text: 'يُدار موقع {store} وخدماته من قِبل {legalName} (سجل تجاري {cr}، رقم ضريبي {vat}). وقد نحدّث هذه الشروط من وقت لآخر، وتنطبق على طلبكِ النسخة المنشورة بتاريخ تقديمه.' },
        ],
      },
      {
        id: 'account',
        title: 'حسابكِ',
        blocks: [
          { type: 'list', items: ['يجب ألا يقل عمركِ عن 18 عامًا، أو أن تتسوقي بمشاركة ولي الأمر.', 'تسجلين الدخول برمز تحقق يُرسل إلى جوالكِ السعودي، لذا احرصي على حماية هاتفك.', 'يرجى التأكد من دقة المعلومات التي تقدمينها وتحديثها باستمرار.'] },
        ],
      },
      {
        id: 'authenticity',
        title: 'ضمان الأصالة',
        blocks: [
          { type: 'note', title: 'أصلي 100% — مضمون', text: 'كل منتج يبيعه {store} أصلي ومورَّد من الموزع المعتمد للعلامة في المملكة. وإذا ثبت أن أي منتج غير أصلي، نعيد لكِ المبلغ كاملًا شاملًا الشحن.', tone: 'rose' },
        ],
      },
      {
        id: 'pricing',
        title: 'الأسعار وضريبة القيمة المضافة',
        blocks: [
          { type: 'p', text: 'جميع الأسعار معروضة بالريال السعودي وشاملة ضريبة القيمة المضافة 15%. وتظهر رسوم الشحن والدفع عند الاستلام، عند انطباقها، قبل تأكيد الطلب.' },
          { type: 'p', text: 'نحرص على دقة الأسعار. وإذا عُرض منتج بسعر خاطئ بشكل واضح، سنتواصل معكِ قبل الشحن لتختاري بين المتابعة بالسعر الصحيح أو الإلغاء واسترداد المبلغ كاملًا.' },
        ],
      },
      {
        id: 'orders',
        title: 'الطلبات وقبولها',
        blocks: [
          { type: 'p', text: 'يُعد طلبكِ عرضًا للشراء، ويُبرم العقد عند تأكيدنا للشحن. ويحق لنا رفض الطلب أو إلغاؤه — مثلًا عند نفاد المنتج، أو عدم اعتماد الدفع، أو تجاوز الكميات حدود الاستخدام الشخصي المعقول — مع إعادة أي مبلغ مدفوع كاملًا.' },
        ],
      },
      {
        id: 'payment',
        title: 'الدفع',
        blocks: [
          { type: 'p', text: 'نقبل مدى وفيزا وماستركارد وApple Pay وSTC Pay وتابي وتمارا والدفع عند الاستلام. وتخضع خطط التقسيط عبر تابي وتمارا لشروط مزود الخدمة وموافقته.' },
        ],
      },
      {
        id: 'delivery',
        title: 'التوصيل وانتقال المسؤولية',
        blocks: [
          { type: 'p', text: 'توضح سياسة الشحن مدد التوصيل التقديرية. وتنتقل إليكِ الملكية والمسؤولية بمجرد تسليم الطلب إلى العنوان الذي قدمتِه.' },
          { type: 'link', text: 'الرسوم ومدد التوصيل حسب المدينة', label: 'اقرئي سياسة الشحن', to: '/shipping-policy' },
        ],
      },
      {
        id: 'returns',
        title: 'الإرجاع',
        blocks: [
          { type: 'p', text: 'يمكنكِ إرجاع المنتجات المؤهلة خلال 14 يومًا وفق سياسة الإرجاع، والتي تُعد جزءًا من هذه الشروط.' },
          { type: 'link', text: 'الشروط والاستثناءات ومدد الاسترداد', label: 'اقرئي سياسة الإرجاع', to: '/return-policy' },
        ],
      },
      {
        id: 'promotions',
        title: 'العروض ونقاط الولاء',
        blocks: [
          { type: 'p', text: 'لا يمكن الجمع بين أكواد الخصم ما لم يُذكر خلاف ذلك، وليس لها قيمة نقدية، ويجوز إيقافها في أي وقت. تُكتسب نقاط الولاء على المبالغ المدفوعة دون رسوم الشحن، وهي صالحة لمدة 12 شهرًا، وتساوي كل 100 نقطة {pointsValue} ريال.' },
        ],
      },
      {
        id: 'ip',
        title: 'الملكية الفكرية',
        blocks: [
          { type: 'p', text: 'أسماء العلامات التجارية وشعاراتها وصور المنتجات مملوكة لأصحابها. ولا يجوز نسخ اسم {store} أو تصميمه أو محتواه أو إعادة استخدامه دون إذن كتابي منا.' },
        ],
      },
      {
        id: 'liability',
        title: 'حدود المسؤولية',
        blocks: [
          { type: 'p', text: 'يرجى قراءة ملصقات المنتجات وإجراء اختبار حساسية قبل استخدام أي مستحضر جديد. وفي الحدود التي يسمح بها النظام، تقتصر مسؤوليتنا على قيمة المنتج المشترى، ولا يحدّ أي مما ورد في هذه الشروط من حقوقكِ النظامية كمستهلكة.' },
        ],
      },
      {
        id: 'law',
        title: 'النظام الحاكم',
        blocks: [
          { type: 'p', text: 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية، بما فيها نظام التجارة الإلكترونية ولائحته التنفيذية، ويُحال أي نزاع إلى المحاكم المختصة في مدينة الرياض.' },
        ],
      },
    ],
  },

  notFound: {
    metaTitle: 'الصفحة غير موجودة',
    eyebrow: 'خطأ 404',
    title: 'يبدو أن هذه الصفحة نفدت من الرف',
    text: 'ربما نُقلت الصفحة التي تبحثين عنها أو لم تعد موجودة. جرّبي البحث، أو دعينا نرشدكِ إلى وجهة جميلة.',
    searchLabel: 'ابحثي في المتجر',
    quickTitle: 'وجهات مقترحة',
    backHome: 'العودة إلى الرئيسية',
    imageAlt: 'منتجات تجميل مرتبة على طاولة الزينة',
  },
}

export const pages = { en, ar }
export type PagesCopy = typeof en
