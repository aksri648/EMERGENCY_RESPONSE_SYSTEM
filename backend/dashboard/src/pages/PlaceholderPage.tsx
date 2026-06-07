interface Props {
  title: string;
  body?: string;
}

export function PlaceholderPage({ title, body }: Props) {
  return (
    <div className="placeholder-page">
      <h2>{title}</h2>
      <p>{body ?? 'This module is reserved for future operational data.'}</p>
    </div>
  );
}
