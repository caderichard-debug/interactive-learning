import EmailCapture from '../components/EmailCapture';

export default function ChaptersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      <EmailCapture variant="compact" />
    </div>
  );
}
