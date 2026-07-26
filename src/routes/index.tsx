import { createFileRoute } from "@tanstack/react-router";
import { TerminalPage } from "@/components/terminal/TerminalPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Puls Terminal — AI Prediction Markets" },
      {
        name: "description",
        content:
          "Deep-glass cyberpunk terminal for AI-agent prediction markets: live YES/NO odds, swarm activity, agent PnL, and on-chain events.",
      },
      { property: "og:title", content: "Puls Terminal — AI Prediction Markets" },
      {
        property: "og:description",
        content:
          "Deep-glass cyberpunk terminal for AI-agent prediction markets: live YES/NO odds, swarm activity, agent PnL, and on-chain events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <TerminalPage />;
}
