import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { BookingRule, RaquetaConfig } from '../types/raqueta';
import { DEFAULT_CONFIG, makeDefaultRule } from '../constants/raqueta-defaults';

const CONFIG_PATH = `${FileSystem.documentDirectory}raqueta-config.json`;

interface RaquetaState {
  config: RaquetaConfig;
  loaded: boolean;
  addRule: () => BookingRule;
  updateRule: (id: string, patch: Partial<BookingRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

const RaquetaContext = createContext<RaquetaState | undefined>(undefined);

export function RaquetaProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RaquetaConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  // Load persisted config once on mount.
  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(CONFIG_PATH);
        if (info.exists) {
          const raw = await FileSystem.readAsStringAsync(CONFIG_PATH);
          const parsed = JSON.parse(raw) as RaquetaConfig;
          if (parsed && Array.isArray(parsed.rules)) {
            setConfig({ rules: parsed.rules, history: parsed.history ?? [] });
          }
        }
      } catch {
        // Corrupt or unreadable config -> fall back to defaults silently.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist on every change once the initial load has settled.
  useEffect(() => {
    if (!loaded) return;
    FileSystem.writeAsStringAsync(CONFIG_PATH, JSON.stringify(config)).catch(() => {});
  }, [config, loaded]);

  const addRule = useCallback((): BookingRule => {
    const rule = makeDefaultRule();
    setConfig(prev => ({ ...prev, rules: [...prev.rules, rule] }));
    return rule;
  }, []);

  const updateRule = useCallback((id: string, patch: Partial<BookingRule>) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(r => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteRule = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, rules: prev.rules.filter(r => r.id !== id) }));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    }));
  }, []);

  return (
    <RaquetaContext.Provider value={{ config, loaded, addRule, updateRule, deleteRule, toggleRule }}>
      {children}
    </RaquetaContext.Provider>
  );
}

export function useRaqueta() {
  const ctx = useContext(RaquetaContext);
  if (!ctx) throw new Error('useRaqueta must be used within RaquetaProvider');
  return ctx;
}
