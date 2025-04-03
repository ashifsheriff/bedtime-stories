import dynamic from 'next/dynamic';

// Use dynamic import for the slideshow since it uses browser APIs
const BedtimeSlideshow = dynamic(() => import('../BedtimeSlideshow'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <BedtimeSlideshow />
    </main>
  );
} 