import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'

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
  const activeMouseRef = useRef(false)
  const lastPositionRef = useRef<number | null>(null)

  const readPosition = (event: PointerEvent<HTMLDivElement>) =>
    orientation === 'vertical' ? event.clientX : event.clientY
  const readMousePosition = (event: MouseEvent<HTMLDivElement>) =>
    orientation === 'vertical' ? event.clientX : event.clientY

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerIdRef.current !== null) {
      return
    }

    activePointerIdRef.current = event.pointerId
    lastPositionRef.current = readPosition(event)
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
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

    if (
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId) &&
      typeof event.currentTarget.releasePointerCapture === 'function'
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || activePointerIdRef.current !== null || activeMouseRef.current) {
      return
    }

    activeMouseRef.current = true
    lastPositionRef.current = readMousePosition(event)
    event.preventDefault()
  }

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || !activeMouseRef.current || lastPositionRef.current === null) {
      return
    }

    const position = readMousePosition(event)
    const delta = position - lastPositionRef.current
    lastPositionRef.current = position

    if (delta !== 0) {
      onResize(delta)
    }
  }

  const handleMouseEnd = () => {
    if (!activeMouseRef.current) {
      return
    }

    activeMouseRef.current = false
    lastPositionRef.current = null
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseEnd}
      onMouseLeave={handleMouseEnd}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex shrink-0 items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent',
        orientation === 'vertical' ? 'min-h-0 w-2 cursor-col-resize' : 'h-4 min-w-0 cursor-row-resize',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-2/70',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block rounded-full transition-colors group-hover:bg-line-strong group-focus-visible:bg-accent',
          orientation === 'vertical'
            ? 'h-full w-px bg-line-soft'
            : 'h-1 w-40 max-w-[45%] bg-line-strong shadow-ringwarm',
          disabled && 'group-hover:bg-line-soft',
        )}
      />
    </div>
  )
}
