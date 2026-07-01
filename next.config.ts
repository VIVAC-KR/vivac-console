import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용 self-contained Node 서버 출력
  output: "standalone",
};

export default nextConfig;
