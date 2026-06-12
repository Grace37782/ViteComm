import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setDeferredPrompt(null)
      setShow(false)
      localStorage.removeItem('pwa-install-dismissed')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setIsInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
    setIsInstalling(false)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!show || !deferredPrompt) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #863bff, #a78bfa)' }}
        />

        {/* Content */}
        <div className="p-5">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
            style={{
              background: 'var(--bg)',
              border: 'none',
              color: 'var(--text-muted)',
            }}
          >
            <X size={14} />
          </button>

          {/* Icon + Text */}
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #863bff20, #863bff10)' }}
            >
              <Smartphone size={24} style={{ color: '#863bff' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-black text-base mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Installer ViteComm
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ajoutez ViteComm à votre écran d'accueil pour un accès rapide et une expérience comme une app native.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
              style={{
                background: 'var(--bg)',
                color: 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Pas maintenant
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #863bff, #7c3aed)',
                color: '#fff',
                border: 'none',
                opacity: isInstalling ? 0.7 : 1,
              }}
            >
              <Download size={15} />
              {isInstalling ? 'Installation...' : 'Installer'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
