import { useRef, type KeyboardEvent, type PointerEvent } from 'react'

import { cn } from '@/lib/cn'

interface WorkbenchSashProps {
  orientation: 'vertical' | 'horizontal'
  label: string
  onResize: (delta: number) => void
  disabled?: boolean
  valueNow?: number
  valueMin?: number
  valueMax?: number
  valueText?: string
}

export function WorkbenchSash({
  orientation,
  label,
  onResize,
  disabled = false,
  valueNow,
  valueMin,
  valueMax,
  valueText,
}: WorkbenchSashProps) {
  const activePointerIdRef = useRef<number | null>(null)
  const lastPositionRef = useRef<number | null>(null)

  const readPosition = (event: PointerEvent<HTMLDivElement>) =>
    orientation === 'vertical' ? event.clientX : event.clientY

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerIdRef.current !== null) {
      return
    }

    activePointerIdRef.current = event.pointerId
    lastPositionRef.current = readPosition(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (
      disabled ||
      activePointerIdRef.current !== event.pointerId ||
      lastPositionRef.current === null
    ) {
      return
    }

    const position = readPosition(event)
    const delta = position - lastPositionRef.current
    lastPositionRef.current = position

    if (delta !== 0) {
      onResize(delta)
    }
  }

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    activePointerIdRef.current = null
    lastPositionRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return
    }

    const deltaByKey =
      orientation === 'vertical'
        ? { ArrowLeft: -16, ArrowRight: 16 }[event.key]
        : { ArrowUp: -16, ArrowDown: 16 }[event.key]

    if (deltaByKey === undefined) {
      return
    }

    event.preventDefault()
    onResize(deltaByKey)
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-valuenow={valueNow}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      aria-valuetext={valueText}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex shrink-0 items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
        orientation === 'vertical' ? 'min-h-0 w-2 cursor-col-resize' : 'h-2 min-w-0 cursor-row-resize',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-2/70',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block rounded-full bg-line-soft transition-colors group-hover:bg-line-strong',
          orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
          disabled && 'group-hover:bg-line-soft',
        )}
      />
    </div>
  )
}
