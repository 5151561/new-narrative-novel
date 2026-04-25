export type ProcessLogSource = 'stdout' | 'stderr'

export class ProcessLogBuffer {
  private readonly maxLines: number
  private readonly lines: string[] = []

  constructor(maxLines = 200) {
    this.maxLines = Math.max(1, maxLines)
  }

  append(source: ProcessLogSource, chunk: string | Buffer): void {
    const text = chunk.toString()
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trimEnd()
      if (!trimmed) {
        continue
      }

      this.lines.push(`[${source}] ${trimmed}`)
    }

    if (this.lines.length > this.maxLines) {
      this.lines.splice(0, this.lines.length - this.maxLines)
    }
  }

  getLines(): string[] {
    return [...this.lines]
  }
}
