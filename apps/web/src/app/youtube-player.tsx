"use client";

export function YouTubePlayer({ videoId }: { videoId: string }) {
  const src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&controls=0&autoplay=0&playsinline=1&modestbranding=1&rel=0`;

  return (
    <iframe
      title="folder-bgm"
      src={src}
      allow="autoplay; encrypted-media"
      className="fixed bottom-0 right-0 w-px h-px opacity-0 pointer-events-none"
      tabIndex={-1}
    />
  );
}
