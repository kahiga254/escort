'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hide React's error overlay
    const errorOverlay = document.querySelector('nextjs-portal');
    if (errorOverlay) {
      errorOverlay.remove();
    }
    
    // Hide any dev overlays
    const devOverlays = document.querySelectorAll('[data-nextjs-dialog]');
    devOverlays.forEach(el => el.remove());
  }, []);

  return (
    <div style={{ display: 'none' }}>
      {/* Empty div to satisfy React */}
    </div>
  );
}