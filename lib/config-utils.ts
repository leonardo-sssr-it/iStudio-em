import { getConfigValue, getAppVersion, getAppName } from "@/hooks/use-app-config"

// Utility per accesso rapido alla configurazione senza hook
export const ConfigUtils = {
  // Versione dell'app
  getVersion: () => getAppVersion(),

  // Nome dell'app
  getAppName: () => getAppName(),

  // Qualsiasi altro valore di configurazione
  getValue: <K extends keyof import("@/types/supabase").Database["public"]["Tables"]["configurazione"]["Row"]>(
    key: K,
  ) => getConfigValue(key),

  // Verifica se un feature è abilitato (esempio)
  isFeatureEnabled: (featureName: string): boolean => {
    const features = getConfigValue("features") // assumendo che esista un campo JSON
    if (typeof features === "object" && features !== null) {
      return (features as any)[featureName] === true
    }
    return false
  },

  // Ottieni configurazione completa (se necessario)
  getFullConfig: () => {
    if (typeof window === "undefined") return null
    try {
      const stored = sessionStorage.getItem("app_config")
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },
}
