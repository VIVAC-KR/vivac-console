import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// 서드파티 스크립트(Daum 우편번호 / Kakao Geocoder)와 폰트 CDN만 허용한다.
// 이 콘솔은 DB 전체 덤프까지 내려받을 수 있어, CDN 하나가 뚫렸을 때
// 임의 출처 스크립트가 붙는 경로를 출처 제한으로 먼저 끊는다.
// 'unsafe-inline'은 layout.tsx의 FOUC 방지 인라인 스크립트 때문 — nonce로 바꾸면 제거 가능.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://t1.daumcdn.net https://dapi.kakao.com https://*.daumcdn.net`,
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://*.daumcdn.net https://*.kakaocdn.net",
  "connect-src 'self' https://dapi.kakao.com https://*.daumcdn.net",
  "frame-src https://www.openstreetmap.org https://postcode.map.daum.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Docker 배포용 self-contained Node 서버 출력
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
