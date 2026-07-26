import { useEffect, useState, useCallback } from "react";

export type PulsTheme = "navy" | "teal" | "pink";
export type PulsContrast = "comfort" | "high";

export type TerminalConfig = {
  theme: PulsTheme;
  contrast: PulsContrast;
  cols: [number, number, number]; // left, center, right (percents, sum ~100)
  tourSeen: boolean;
  alertsMuted: boolean;
};

const KEY = "puls-terminal-config-v1";

const defaultConfig: TerminalConfig = {
  theme: "navy",
  contrast: "comfort",
  cols: [25, 50, 25],
  tourSeen: false,
  alertsMuted: false,
};

function read(): TerminalConfig {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) };
  } catch {
    return defaultConfig;
  }
}

function write(cfg: TerminalConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

/** Broadcast to other hook instances so all consumers stay in sync. */
const listeners = new Set<(cfg: TerminalConfig) => void>();

export function useTerminalConfig() {
  const [cfg, setCfg] = useState<TerminalConfig>(defaultConfig);

  useEffect(() => {
    setCfg(read());
    const listener = (next: TerminalConfig) => setCfg(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const update = useCallback((patch: Partial<TerminalConfig>) => {
    setCfg((prev) => {
      const next = { ...prev, ...patch };
      write(next);
      listeners.forEach((l) => l(next));
      return next;
    });
  }, []);

  // Apply theme + contrast to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.pulsTheme = cfg.theme;
    document.documentElement.dataset.pulsContrast = cfg.contrast;
  }, [cfg.theme, cfg.contrast]);

  return [cfg, update] as const;
}
