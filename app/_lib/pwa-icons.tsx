import { ImageResponse } from 'next/og';

const buildIconMarkup = (size: number) => {
  const inset = Math.round(size * 0.12);
  const borderWidth = Math.max(6, Math.round(size * 0.06));
  const flareSize = Math.round(size * 0.32);
  const glowSize = Math.round(size * 0.58);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 28% 24%, #38bdf8 0%, #2563eb 45%, #0033ff 80%, #001861 100%)',
        borderRadius: Math.round(size * 0.22),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: `${inset}px`,
          borderRadius: '30%',
          border: `${borderWidth}px solid rgba(255, 255, 255, 0.24)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${Math.round(size * 0.12)}px`,
          right: `${Math.round(size * 0.12)}px`,
          width: `${flareSize}px`,
          height: `${flareSize}px`,
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.28)',
          filter: 'blur(0.5px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: `${Math.round(size * 0.08)}px`,
          left: `${Math.round(size * 0.08)}px`,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          borderRadius: '45% 55% 60% 40%',
          background: 'rgba(59, 130, 246, 0.3)',
          filter: 'blur(0.5px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${Math.round(size * 0.52)}px`,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
          color: '#f8fafc',
          fontFamily: 'Inter, "SF Pro Display", "Segoe UI", sans-serif',
        }}
      >
        RS
      </div>
    </div>
  );
};

export const createBrandIconResponse = (size: number) =>
  new ImageResponse(buildIconMarkup(size), {
    width: size,
    height: size,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
