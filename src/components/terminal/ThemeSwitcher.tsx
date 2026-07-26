import { Palette, Sun, Moon } from "lucide-react";
import { useTerminalConfig, type PulsTheme } from "./config-store";

const themes: { id: PulsTheme; label: string; swatch: string[] }[] = [
  { id: "navy", label: "Navy", swatch: ["#060913", "#2DD4BF", "#EC4899"] },
  { id: "teal", label: "Teal", swatch: ["#03110F", "#22D3EE", "#2DD4BF"] },
  { id: "pink", label: "Pink", swatch: ["#12060E", "#EC4899", "#F472B6"] },
];

export function ThemeSwitcher() {
  const [cfg, update] = useTerminalConfig();
  return (
    <div
      data-tour="theme"
      className="flex items-center gap-2 px-2 py-1 rounded-md border border-glass-border bg-white/5 backdrop-blur-md"
    >
      <Palette className="size-3 text-teal shrink-0" />
      <div className="flex items-center gap-1">
        {themes.map((t) => {
          const active = cfg.theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => update({ theme: t.id })}
              title={`Puls ${t.label}`}
              className={
                "flex items-center gap-1 h-6 px-1.5 rounded transition-all " +
                (active
                  ? "bg-teal/15 ring-1 ring-teal/40"
                  : "hover:bg-white/5")
              }
            >
              <span className="flex -space-x-1">
                {t.swatch.map((c, i) => (
                  <span
                    key={i}
                    className="size-2.5 rounded-full border border-white/10"
                    style={{ background: c }}
                  />
                ))}
              </span>
              <span
                className={
                  "text-[9px] font-mono uppercase tracking-wider " +
                  (active ? "text-teal" : "text-slate-400")
                }
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="w-px h-4 bg-glass-border" />
      <button
        onClick={() =>
          update({ contrast: cfg.contrast === "high" ? "comfort" : "high" })
        }
        title={cfg.contrast === "high" ? "High contrast" : "Comfort contrast"}
        className="flex items-center gap-1 h-6 px-1.5 rounded hover:bg-white/5 text-slate-400"
      >
        {cfg.contrast === "high" ? (
          <Sun className="size-3 text-teal" />
        ) : (
          <Moon className="size-3" />
        )}
        <span className="text-[9px] font-mono uppercase tracking-wider">
          {cfg.contrast === "high" ? "High" : "Comfort"}
        </span>
      </button>
    </div>
  );
}
