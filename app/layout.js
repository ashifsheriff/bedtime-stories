import '../styles/globals.css';

export const metadata = {
  title: 'Bedtime Story Viewer',
  description: 'View your bedtime stories with beautiful illustrations and narration',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 