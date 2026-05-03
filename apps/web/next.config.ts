import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 한 장 최대 50MB × 동시 업로드 여유 ~5장 분량
      // (Vercel 배포 시 4.5MB 하드캡이 별도 적용됨 — M10에서 클라이언트 직접 업로드로 전환 예정)
      bodySizeLimit: "250mb",
    },
  },
};

export default nextConfig;
