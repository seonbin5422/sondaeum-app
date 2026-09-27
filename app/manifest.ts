import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "손다음",
    short_name: "손다음",
    description: "말 한마디면, 보고서는 AI가 작성해줍니다",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffb133",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
