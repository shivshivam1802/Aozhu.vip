import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AOZHU",
    short_name: "AOZHU",
    description:
      "AOZHU is a powerful smart link generator that lets users create WhatsApp direct chat links, dynamic redirects, UTM campaign URLs, QR codes, and shareable smart links instantly.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F6F4",
    theme_color: "#10221C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  }
}
