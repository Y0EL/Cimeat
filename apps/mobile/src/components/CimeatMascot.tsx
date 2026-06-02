import type { SvgProps } from 'react-native-svg'
import Svg, { Circle, G, Path } from 'react-native-svg'

export type CimeatMascotVariant = 'base' | 'happy' | 'wave' | 'thinking' | 'sleep'

interface CimeatMascotProps extends Omit<SvgProps, 'width' | 'height'> {
  variant?: CimeatMascotVariant
  width?: number | string
  height?: number | string
}

const garisUtama = {
  fill: 'none',
  stroke: '#000000',
  strokeWidth: 34,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const kepala =
  'M280 320C238 234 322 155 432 178C478 188 509 216 512 223C515 216 546 188 592 178C702 155 786 234 744 320C788 304 821 335 795 380C814 412 792 452 747 459C768 530 719 596 633 594C594 594 550 575 512 535C474 575 430 594 391 594C305 596 256 530 277 459C232 452 210 412 229 380C203 335 236 304 280 320Z'

const tubuh =
  'M276 459C190 386 84 430 94 536C50 566 52 648 113 666C86 713 112 783 184 778C177 837 242 890 325 851C363 915 459 895 512 778C565 895 661 915 699 851C782 890 847 837 840 778C912 783 938 713 911 666C972 648 974 566 930 536C940 430 834 386 748 459'

function BentukDasar() {
  return (
    <>
      <Path d={kepala} {...garisUtama} />
      <Path d={tubuh} {...garisUtama} />
    </>
  )
}

function MataDasar() {
  return (
    <>
      <Circle cx={406} cy={376} r={76} {...garisUtama} />
      <Circle cx={618} cy={376} r={76} {...garisUtama} />
      <Path
        d="M396 374C383 389 384 418 398 424C414 418 418 389 402 374"
        {...garisUtama}
      />
      <Path
        d="M628 374C615 389 616 418 630 424C646 418 650 389 634 374"
        {...garisUtama}
      />
    </>
  )
}

function WajahDasar() {
  return (
    <>
      <MataDasar />
      <Path d="M472 515C488 535 505 538 512 510C519 538 536 535 552 515" {...garisUtama} />
    </>
  )
}

function VarianHappy() {
  return (
    <>
      <MataDasar />
      <Path d="M466 512C486 548 538 548 558 512" {...garisUtama} />
      <Path d="M355 486C338 502 320 507 306 502" {...garisUtama} />
      <Path d="M669 486C686 502 704 507 718 502" {...garisUtama} />
    </>
  )
}

function VarianWave() {
  return (
    <>
      <Path d="M782 485C837 403 923 390 947 454C969 512 907 567 850 535" {...garisUtama} />
      <Path d="M888 410C882 373 902 344 934 326" {...garisUtama} />
      <Path d="M928 451C954 437 976 442 990 462" {...garisUtama} />
      <WajahDasar />
    </>
  )
}

function VarianThinking() {
  return (
    <>
      <Circle cx={406} cy={376} r={76} {...garisUtama} />
      <Circle cx={618} cy={376} r={76} {...garisUtama} />
      <Path
        d="M399 372C386 387 387 412 401 418C415 412 419 387 405 372"
        {...garisUtama}
      />
      <Path
        d="M619 386C606 401 607 426 621 432C635 426 639 401 625 386"
        {...garisUtama}
      />
      <Path d="M478 523C498 506 526 506 546 523" {...garisUtama} />
      <Path d="M654 568C688 542 731 557 733 603C734 638 701 659 670 643" {...garisUtama} />
      <Path d="M689 575C681 594 681 613 691 630" {...garisUtama} />
      <Circle cx={751} cy={249} r={20} {...garisUtama} />
      <Circle cx={808} cy={198} r={13} {...garisUtama} />
    </>
  )
}

function VarianSleep() {
  return (
    <>
      <Path d="M346 376C380 348 423 348 457 376" {...garisUtama} />
      <Path d="M566 376C600 348 643 348 677 376" {...garisUtama} />
      <Path d="M472 515C488 535 505 538 512 510C519 538 536 535 552 515" {...garisUtama} />
      <Path d="M720 220H812L724 318H816" {...garisUtama} />
      <Path d="M822 142H888L824 210H890" {...garisUtama} />
    </>
  )
}

function KontenVarian({ variant }: { variant: CimeatMascotVariant }) {
  if (variant === 'happy') return <VarianHappy />
  if (variant === 'wave') return <VarianWave />
  if (variant === 'thinking') return <VarianThinking />
  if (variant === 'sleep') return <VarianSleep />
  return <WajahDasar />
}

export function CimeatMascot({
  variant = 'base',
  width = 180,
  height = 180,
  accessibilityLabel = 'Maskot hamster Cimeat',
  ...props
}: CimeatMascotProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 1024 1024"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      <G>
        <BentukDasar />
        <KontenVarian variant={variant} />
      </G>
    </Svg>
  )
}
