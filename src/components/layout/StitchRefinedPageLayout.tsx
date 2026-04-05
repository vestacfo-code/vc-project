import type { ReactNode } from 'react'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { cn } from '@/lib/utils'

/** Shared canvas behind marketing and legal pages (Stitch-aligned: cream/mist + amber/gold glows). */
export function StitchAmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-vesta-cream via-vesta-mist/25 to-vesta-mist/50" />
      <div className="absolute -top-32 right-0 h-[min(28rem,90vw)] w-[min(28rem,90vw)] translate-x-1/3 rounded-full bg-amber-400/18 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[min(22rem,80vw)] w-[min(22rem,80vw)] -translate-x-1/3 translate-y-1/3 rounded-full bg-vesta-mist/90 blur-3xl" />
      <div className="absolute top-1/4 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-vesta-gold/12 blur-3xl" />
    </div>
  )
}

/** Light-canvas adaptation of Stitch Vesta Onyx: tonal surfaces, gold accent, soft depth instead of heavy borders. */
export const stitchTonalCard =
  'rounded-2xl bg-white/80 backdrop-blur-md shadow-[0_8px_40px_-12px_rgba(27,58,92,0.1)] ring-1 ring-vesta-navy/[0.06]'

export const stitchTonalCardMuted =
  'rounded-2xl bg-vesta-mist/40 backdrop-blur-sm shadow-[0_6px_32px_-10px_rgba(27,58,92,0.07)] ring-1 ring-vesta-navy/[0.05]'

export const stitchIconTile =
  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-vesta-gold/15 ring-1 ring-vesta-gold/30 text-vesta-gold'

/** Navy gradient icon well — set size in className (e.g. h-12 w-12 or h-14 w-14). */
export const stitchFeatureIconCircle =
  'inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-vesta-navy to-vesta-navy-muted text-white shadow-sm'

export const stitchPageTitle =
  'font-stitch text-4xl font-semibold tracking-tight text-vesta-navy sm:text-5xl md:text-[2.75rem]'

export const stitchPageTitleLg =
  'font-stitch text-4xl font-semibold tracking-tight text-vesta-navy sm:text-5xl md:text-6xl'

export const stitchLead = 'font-stitch-body text-vesta-navy/80'

type ContentMax = '3xl' | '4xl' | '5xl'

type StitchRefinedPageLayoutProps = {
  children: ReactNode
  headerVariant?: 'light' | 'dark'
  contentMax?: ContentMax
  containerClassName?: string
}

const maxWidthClass: Record<ContentMax, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
}

export function StitchRefinedPageLayout({
  children,
  headerVariant = 'light',
  contentMax = '4xl',
  containerClassName,
}: StitchRefinedPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-vesta-cream font-stitch-body">
      <div className="relative flex-1">
        <StitchAmbientBackground />

        <div className="relative z-10 flex min-h-0 flex-col">
          <Header variant={headerVariant} />
          <div
            className={cn(
              'container mx-auto flex-1 px-4 py-14 sm:py-16',
              maxWidthClass[contentMax],
              containerClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
