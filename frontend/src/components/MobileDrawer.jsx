import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, LogOut } from 'lucide-react'

export default function MobileDrawer({ navTabs, accentColor, brandLabel, onLogout, onTabSelect, currentTab }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const handleTabClick = (tabPath) => {
    if (onTabSelect) {
      onTabSelect(tabPath)
    } else {
      navigate(tabPath)
    }
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [location.pathname])

  const initials = ((user?.prenom?.[0] || '') + (user?.nom?.[0] || '')).toUpperCase() || '?'

  return (
    <>
      {/* Hamburger button — only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}
      >
        <Menu size={18} color="#fff" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[998] transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="md:hidden fixed top-0 left-0 bottom-0 z-[999] w-72 max-w-[85vw] transition-transform duration-300 ease-out flex flex-col"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          background: 'var(--surface)',
          boxShadow: open ? '8px 0 30px rgba(0,0,0,0.2)' : 'none',
        }}
      >
        {/* Drawer header */}
        <div
          className="px-5 pt-6 pb-5 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
        >
          <div className="flex items-center gap-3">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover border-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-black" style={{ color: accentColor }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-white font-black text-sm truncate">{brandLabel}</div>
              <div className="text-white/60 text-xs truncate">{user?.prenom} {user?.nom}</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none' }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {navTabs.map(tab => {
            const active = currentTab
              ? currentTab === tab.path
              : onTabSelect
                ? location.pathname === tab.path
                : (location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'))
            return (
              <button
                key={tab.path}
                onClick={() => handleTabClick(tab.path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer mb-1"
                style={{
                  background: active ? `${accentColor}18` : 'transparent',
                  color: active ? accentColor : 'var(--text-secondary)',
                  border: 'none',
                  textAlign: 'left',
                }}
              >
                <tab.icon size={18} style={{ flexShrink: 0 }} />
                {tab.label}
                {active && (
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ background: accentColor }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Logout button */}
        <div className="px-3 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold cursor-pointer"
            style={{ background: 'rgba(226,75,74,0.08)', color: '#E24B4A', border: 'none' }}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  )
}
