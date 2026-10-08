import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Reveal, SectionHeading, SmartImage } from '@/components/common'
import { featuredCategoryTiles } from '@/data/categories'
import { useT } from '@/i18n'
import { cn } from '@/utils'

/*
 * Desktop mosaic (4 cols × 2 rows):
 *   [ 0 ][   1   ][ 2 ]
 *   [ 0 ][ 3 ][ 4 ][ 5 ]
 */
const TILE_LAYOUT = ['lg:row-span-2', 'lg:col-span-2', '', '', '', '']

export function CategoryMosaic() {
  const { t, l } = useT()
  return (
    <section className="container-x py-16 sm:py-20 lg:py-28" aria-labelledby="home-categories">
      <Reveal>
        <SectionHeading eyebrow={t('home.categories.eyebrow')} title={<span id="home-categories">{t('home.categories.title')}</span>} description={t('home.categories.description')} />
      </Reveal>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:grid-rows-[300px_300px] xl:grid-rows-[340px_340px]">
        {featuredCategoryTiles.map((tile, i) => (
          <Reveal as="li" key={tile.href} delay={i * 70} className={cn('min-w-0', TILE_LAYOUT[i])}>
            <Link to={tile.href} className="group relative block aspect-[3/4] overflow-hidden rounded-xs sm:aspect-[4/5] lg:aspect-auto lg:h-full">
              <SmartImage
                src={tile.image}
                alt={l(tile.name)}
                width={i === 0 ? 900 : 700}
                height={i === 0 ? 1200 : 700}
                wrapperClassName="absolute! inset-0"
                className="transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/5 to-transparent transition-opacity duration-500 group-hover:opacity-90" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
                <span>
                  <span className="hidden text-[10px] font-semibold tracking-[0.22em] text-white/75 uppercase sm:block">{t('home.categories.explore')}</span>
                  <span className={cn('mt-1 block font-serif leading-tight font-medium text-white', i === 0 ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl')}>{l(tile.name)}</span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors duration-300 group-hover:bg-white group-hover:text-ink sm:size-11" aria-hidden>
                  <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
