/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'
import fr from '../i18n/fr.json'
import en from '../i18n/en.json'

const LangContext = createContext(null)
const STORAGE_KEY = 'vc_lang'

const LANGUAGES = {
  fr: { label: 'Français', flag: '🇫🇷', messages: fr },
  en: { label: 'English', flag: '🇬🇧', messages: en },
}

function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && LANGUAGES[stored]) return stored
  } catch { /* localStorage unavailable */ }
  return 'fr'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang)

  const setLang = useCallback((newLang) => {
    if (!LANGUAGES[newLang]) return
    setLangState(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch { /* localStorage unavailable */ }
    document.documentElement.setAttribute('lang', newLang)
  }, [])

  const t = useCallback((key, params = {}) => {
    const messages = LANGUAGES[lang]?.messages || LANGUAGES.fr.messages
    let text = messages[key] || key
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    }
    return text
  }, [lang])

  const currentLang = LANGUAGES[lang] || LANGUAGES.fr

  return (
    <LangContext.Provider value={{ lang, setLang, t, currentLang, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
