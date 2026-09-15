'use client'

import { useLayoutEffect } from 'react'

/** Apply the `lang` cookie to `<html>` without reading cookies in the root layout.
 *  `cookies()` in `layout.tsx` can throw `new URL('')` while Next collects `/_not-found`. */
export function HtmlLang() {
  useLayoutEffect(() => {
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/)
    const value = match?.[1]?.trim()
    document.documentElement.lang = value === 'de' ? 'de' : 'en'
  }, [])
  return null
}
