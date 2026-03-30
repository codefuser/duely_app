import { useEffect, useState, useCallback } from 'react';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  accent: string;
  accentFg: string;
  darkAccent: string;
  darkAccentFg: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'teal', name: 'Teal', primary: '168 76% 42%', accent: '168 50% 94%', accentFg: '168 76% 30%', darkAccent: '168 40% 15%', darkAccentFg: '168 76% 60%' },
  { id: 'ocean', name: 'Ocean', primary: '217 91% 60%', accent: '217 50% 94%', accentFg: '217 91% 30%', darkAccent: '217 40% 15%', darkAccentFg: '217 91% 60%' },
  { id: 'sunset', name: 'Sunset', primary: '25 95% 53%', accent: '25 50% 94%', accentFg: '25 95% 30%', darkAccent: '25 40% 15%', darkAccentFg: '25 95% 60%' },
  { id: 'purple', name: 'Purple', primary: '262 83% 58%', accent: '262 50% 94%', accentFg: '262 83% 30%', darkAccent: '262 40% 15%', darkAccentFg: '262 83% 60%' },
  { id: 'rose', name: 'Rose', primary: '350 89% 60%', accent: '350 50% 94%', accentFg: '350 89% 30%', darkAccent: '350 40% 15%', darkAccentFg: '350 89% 60%' },
  { id: 'forest', name: 'Forest', primary: '152 69% 31%', accent: '152 50% 94%', accentFg: '152 69% 20%', darkAccent: '152 40% 12%', darkAccentFg: '152 69% 50%' },
];

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyColors(primary: string, accent: string, accentFg: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-foreground', accentFg);
  root.style.setProperty('--ring', primary);
}

export function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('duely_dark_mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [themeId, setThemeId] = useState(() => localStorage.getItem('duely_theme') || 'teal');
  const [customColor, setCustomColor] = useState(() => localStorage.getItem('duely_custom_color') || '#22b8a0');

  const applyTheme = useCallback((id: string, isDark: boolean, custom?: string) => {
    if (id === 'custom' && custom) {
      const hsl = hexToHSL(custom);
      const parts = hsl.split(' ').map(s => parseFloat(s));
      const h = parts[0], s = parts[1];
      const accent = isDark ? `${h} ${Math.round(s * 0.5)}% 15%` : `${h} ${Math.round(s * 0.65)}% 94%`;
      const accentFg = isDark ? `${h} ${Math.round(s)}% 60%` : `${h} ${Math.round(s)}% 30%`;
      applyColors(hsl, accent, accentFg);
    } else {
      const preset = THEME_PRESETS.find(t => t.id === id) || THEME_PRESETS[0];
      if (isDark) {
        applyColors(preset.primary, preset.darkAccent, preset.darkAccentFg);
      } else {
        applyColors(preset.primary, preset.accent, preset.accentFg);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('duely_dark_mode', String(dark));
    applyTheme(themeId, dark, customColor);
  }, [dark, themeId, customColor, applyTheme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
    localStorage.setItem('duely_theme', id);
  }, []);

  const setCustom = useCallback((hex: string) => {
    setCustomColor(hex);
    localStorage.setItem('duely_custom_color', hex);
    setThemeId('custom');
    localStorage.setItem('duely_theme', 'custom');
  }, []);

  return { dark, toggleDark: () => setDark(d => !d), themeId, setTheme, customColor, setCustom };
}
