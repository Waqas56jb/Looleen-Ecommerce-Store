import type { Review } from '@/types'
import { products } from './products'

const AUTHORS = [
  ['Noura A.', 'Riyadh'], ['Sara M.', 'Jeddah'], ['Reem K.', 'Dammam'], ['Lama S.', 'Khobar'],
  ['Hessa F.', 'Riyadh'], ['Maha T.', 'Mecca'], ['Dana Q.', 'Medina'], ['Abdullah R.', 'Riyadh'],
  ['Ghada H.', 'Jeddah'], ['Rawan B.', 'Abha'], ['Faisal O.', 'Dammam'], ['Joud N.', 'Taif'],
]

const TEMPLATES: [number, string, string][] = [
  [5, 'Exactly as described — and 100% original', 'You can tell it is the real product: batch code, texture and scent are identical to what I buy abroad. Delivered to my door in two days.'],
  [5, 'My holy grail', 'I have repurchased this three times. It works beautifully in the Saudi heat and lasts all day.'],
  [4, 'Lovely, would buy again', 'Great quality and well packaged. Took one star off only because I wish it came in a bigger size.'],
  [5, 'Fast delivery, premium packaging', 'Arrived the next day in Riyadh, wrapped beautifully with a sample included. The product itself is fantastic.'],
  [4, 'Good results after two weeks', 'Started seeing a real difference after about two weeks of daily use. Gentle and comfortable on my skin.'],
  [5, 'Worth every riyal', 'Pricier than drugstore options but the results speak for themselves. Glad to finally find an authorized seller.'],
  [3, 'Nice, but not for me', 'The quality is clearly there, but it was a little heavy for my oily skin. My sister loves it though.'],
  [5, 'Salon-quality results', 'I use this in my salon and my clients always ask about it. Genuine stock and consistent batches every time.'],
]

/** 3–5 deterministic reviews per product */
export const reviews: Review[] = products.flatMap((p, pi) => {
  const count = 3 + (pi % 3)
  return Array.from({ length: count }, (_, i) => {
    const [rating, title, comment] = TEMPLATES[(pi + i * 3) % TEMPLATES.length]
    const [author, city] = AUTHORS[(pi * 2 + i) % AUTHORS.length]
    const day = 1 + ((pi * 7 + i * 13) % 27)
    const month = 1 + ((pi + i) % 9)
    return {
      id: `r-${p.id}-${i}`,
      productId: p.id,
      author,
      city,
      rating,
      title,
      comment,
      date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      verified: (pi + i) % 4 !== 3,
      helpful: (pi * 3 + i * 5) % 41,
    }
  })
})
