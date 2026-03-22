export function MetaRow({ items }: { items: string[] }) {
  return (
    <div className="export-meta-row">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
