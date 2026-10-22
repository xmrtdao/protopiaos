import { createFileRoute } from "@tanstack/react-router";
import { Desktop } from "@/os/Desktop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Protopia OS — A familiar, private desktop" },
      { name: "description", content: "Protopia OS: a Windows-familiar desktop with Start menu, File Explorer, Writer and Sheets — private by default." },
      { property: "og:title", content: "Protopia OS — A familiar, private desktop" },
      { property: "og:description", content: "Leave Windows without losing your files or your favorite tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Desktop,
});
