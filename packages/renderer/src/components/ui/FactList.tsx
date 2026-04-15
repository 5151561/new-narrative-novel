interface FactListProps {
  items: Array<{ id: string; label: string; value: string }>
}

export function FactList({ items }: FactListProps) {
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
          <dt className="text-xs uppercase tracking-[0.05em] text-text-soft">{item.label}</dt>
          <dd className="mt-1 text-sm leading-6 text-text-main">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
