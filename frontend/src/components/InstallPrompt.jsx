import { useState, useEffect, useCallback } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isStandalone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )

  useEffect(() => {
    if (isStandalone) return

    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowButton(true)
      setTimeout(() => setShowModal(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setDeferredPrompt(null)
      setShowModal(false)
      setShowButton(false)
      localStorage.removeItem('pwa-install-dismissed')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    setIsInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowModal(false)
      setShowButton(false)
    }
    setDeferredPrompt(null)
    setIsInstalling(false)
  }, [deferredPrompt])

  const handleDismiss = () => {
    setShowModal(false)
    setShowButton(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (isStandalone || !deferredPrompt) return null

  return (
    <>
      {/* Floating install button */}
      {showButton && !showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-4 z-[999] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #863bff, #7c3aed)',
            border: 'none',
            animation: 'bounceIn 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}
          title="Installer ViteComm"
        >
          <Download size={22} color="#fff" />
        </button>
      )}

      {/* Full modal */}
      {showModal && (
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
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #863bff, #a78bfa)' }}
            />

            <div className="p-5">
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
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  )
}
