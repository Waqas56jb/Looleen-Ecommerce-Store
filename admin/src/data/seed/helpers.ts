/** Deterministic PRNG so mock data is identical on every load (mulberry32) */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
    shuffle: <T,>(arr: readonly T[]): T[] => {
      const out = [...arr]
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
  }
}

/** Seeds are generated relative to the moment the demo DB is first created */
export const SEED_NOW = Date.now()
export const DAY = 86_400_000
export const HOUR = 3_600_000

export const daysAgo = (d: number, hourOffset = 0) => new Date(SEED_NOW - d * DAY - hourOffset * HOUR).toISOString()
export const daysFromNow = (d: number) => new Date(SEED_NOW + d * DAY).toISOString()

export const round2 = (n: number) => Math.round(n * 100) / 100

export const FIRST_NAMES_F = ['Noura', 'Sara', 'Reem', 'Lama', 'Hessa', 'Maha', 'Dana', 'Ghada', 'Rawan', 'Joud', 'Alanoud', 'Shahad', 'Haifa', 'Lujain', 'Ruba', 'Abeer', 'Wejdan', 'Nouf', 'Razan', 'Asma', 'Bayan', 'Malak', 'Hind', 'Afnan', 'Deem', 'Taif', 'Arwa', 'Lina']
export const FIRST_NAMES_M = ['Ahmed', 'Abdullah', 'Faisal', 'Khalid', 'Mohammed', 'Saud', 'Turki', 'Omar', 'Nawaf', 'Yousef', 'Fahad', 'Majed', 'Sultan', 'Bandar']
export const LAST_NAMES = ['Al-Qahtani', 'Al-Harbi', 'Al-Dossary', 'Al-Shehri', 'Al-Ghamdi', 'Al-Otaibi', 'Al-Zahrani', 'Al-Mutairi', 'Al-Shammari', 'Al-Anazi', 'Al-Subaie', 'Al-Malki', 'Al-Juhani', 'Al-Rashidi', 'Al-Amri', 'Al-Saud', 'Al-Faraj', 'Al-Sulaiman', 'Al-Hamad', 'Al-Tamimi']

export const DISTRICTS: Record<string, string[]> = {
  riyadh: ['Al Malqa', 'Al Olaya', 'Al Yasmin', 'Hittin', 'Al Nakheel', 'Al Sahafa', 'Al Rawdah', 'Al Narjis'],
  jeddah: ['Al Rawdah', 'Al Shati', 'Al Salamah', 'Al Zahra', 'Obhur', 'Al Andalus'],
  dammam: ['Al Faisaliyah', 'Al Shati', 'Al Mazruiyah', 'Al Nur'],
  khobar: ['Al Ulaya', 'Al Khobar Al Shamaliyah', 'Al Rakah', 'Al Aqrabiyah'],
  mecca: ['Al Aziziyah', 'Al Awali', 'Al Shawqiyah'],
  medina: ['Al Aziziyah', 'Quba', 'Al Khalidiyah'],
  abha: ['Al Mansak', 'Al Khalidiyah'],
  tabuk: ['Al Muruj', 'Al Faisaliyah'],
  taif: ['Al Shuhada', 'Al Hawiyah'],
  jubail: ['Al Fanateer', 'Al Deffi'],
}

export const STREETS = ['King Fahd Road', 'Prince Sultan Street', 'Tahlia Street', 'King Abdulaziz Road', 'Olaya Street', 'Anas Ibn Malik Road', 'Prince Mohammed bin Abdulaziz Road', 'Al Madinah Road', 'King Abdullah Road', 'Prince Turki Street']

export function saudiPhone(r: ReturnType<typeof rng>) {
  return `+966 5${r.int(0, 9)} ${r.int(100, 999)} ${r.int(1000, 9999)}`
}

export const ADMIN_IPS = ['94.97.112.18', '188.48.21.204', '37.104.66.91', '5.156.200.13', '212.26.44.130']
