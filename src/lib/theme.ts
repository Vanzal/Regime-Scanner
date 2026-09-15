/** localStorage key shared with the pre-paint boot script in `app/layout.tsx`. */
export const THEME_STORAGE_KEY = 'theme'

export type SiteTheme = 'light' | 'dark'

export function applySiteTheme(theme: SiteTheme) {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // storage blocked — class still updates for this session
  }
}

export function readStoredTheme(): SiteTheme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Blocking boot snippet — keep in sync with `applySiteTheme`. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var r=document.documentElement;if(t==='light'){r.classList.remove('dark');r.classList.add('light');}else{r.classList.remove('light');r.classList.add('dark');}}catch(e){}})();`
