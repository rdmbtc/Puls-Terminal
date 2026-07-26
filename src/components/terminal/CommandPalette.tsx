import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ArrowUpRight,
  Bell,
  BellOff,
  BookOpen,
  Palette,
  Radar,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";
import { useTerminalConfig } from "./config-store";

export type PaletteMarket = { slug: string; ticker: string; question: string };

export type PaletteAction =
  | { kind: "select-market"; slug: string }
  | { kind: "focus"; target: "arena" | "orderbook" | "swarm" | "roster" | "arb" }
  | { kind: "cycle-theme" }
  | { kind: "toggle-contrast" }
  | { kind: "toggle-alerts" }
  | { kind: "start-tour" };

export function CommandPalette({
  open,
  onOpenChange,
  onAction,
  markets,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAction: (a: PaletteAction) => void;
  markets: PaletteMarket[];
}) {
  const [cfg] = useTerminalConfig();

  // Global hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (open) return; // don't intercept while palette open
      if (meta && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        onAction({ kind: "cycle-theme" });
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onAction({ kind: "toggle-alerts" });
      }
      if (e.key === "?" && !meta) {
        onAction({ kind: "start-tour" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange, onAction]);

  const run = (a: PaletteAction) => {
    onOpenChange(false);
    onAction(a);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search markets…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Markets">
          {markets.map((m) => (
            <CommandItem
              key={m.slug}
              value={`market ${m.ticker} ${m.question}`}
              onSelect={() => run({ kind: "select-market", slug: m.slug })}
            >
              <ArrowUpRight />
              <span className="font-mono text-xs text-teal mr-2">{m.ticker}</span>
              <span className="truncate">{m.question}</span>
              <CommandShortcut>Show market</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => run({ kind: "focus", target: "arena" })}>
            <Target />
            Focus Arena
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run({ kind: "focus", target: "orderbook" })}>
            <Waves />
            Open Order Book
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run({ kind: "focus", target: "swarm" })}>
            <Sparkles />
            Swarm Visualizer
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run({ kind: "focus", target: "arb" })}>
            <Radar />
            Arb Scanner
            <CommandShortcut>G R</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => run({ kind: "cycle-theme" })}>
            <Palette />
            Cycle Puls theme (navy → teal → pink)
            <CommandShortcut>⌘⇧T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run({ kind: "toggle-contrast" })}>
            <Palette />
            Toggle contrast (comfort ↔ high)
          </CommandItem>
          <CommandItem onSelect={() => run({ kind: "toggle-alerts" })}>
            {cfg.alertsMuted ? <BellOff /> : <Bell />}
            {cfg.alertsMuted ? "Unmute alerts" : "Mute alerts"}
            <CommandShortcut>⌘⇧N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run({ kind: "start-tour" })}>
            <BookOpen />
            Start guided tour
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
