import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'

const EMOJIS = ['🍅','🧅','🥬','🌶️','🍌','🐟','🥚','🌽','🫘','🥕','🍆','🧄','🫑','🥦','🍊']
const UNITES = ['kg', 'tas', 'pièce', 'régime', 'litre', 'paquet', 'boîte']

function FormProduit({ initial, categories, onSave, onCancel }) {
  const vide = { emoji: '🍅', nom: '', description: '', prix: '', stock: '', unite: 'kg', categorie: '' }
  const [form, setForm] = useState(initial || vide)
  const [erreurs, setErreurs] = useState({})
  const [saving, setSaving] = useState(false)

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }))
    setErreurs((p) => ({ ...p, [k]: '' }))
  }

  function valider() {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Nom requis'
    if (!form.description.trim()) e.description = 'Description requise'
    if (!form.prix || isNaN(+form.prix) || +form.prix <= 0) e.prix = 'Prix positif requis'
    if (form.stock === '' || isNaN(+form.stock) || +form.stock < 0) e.stock = 'Stock valide requis'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!valider()) return
    setSaving(true)
    try {
      await onSave({ ...form, prix: +form.prix, stock: +form.stock })
    } finally {
      setSaving(false)
    }
  }

  const base = { background: 'var(--surface-alt)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }
  const err = { background: '#FAECE7', border: '1.5px solid #E24B4A', color: 'var(--text-primary)' }

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '2px solid #BA7517' }}>

      <div>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Icône du produit</div>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => set('emoji', e)}
              className="w-9 h-9 rounded-xl text-xl cursor-pointer transition-all"
              style={{
                background: form.emoji === e ? '#FAEEDA' : 'var(--surface-alt)',
                border: `1.5px solid ${form.emoji === e ? '#BA7517' : 'var(--border)'}`,
                transform: form.emoji === e ? 'scale(1.1)' : 'none',
              }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Nom du produit *</label>
        <input type="text" placeholder="Ex: Tomates fraîches"
          value={form.nom} onChange={(e) => set('nom', e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none"
          style={erreurs.nom ? err : base} />
        {erreurs.nom && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.nom}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Description *</label>
        <input type="text" placeholder="Courte description du produit"
          value={form.description} onChange={(e) => set('description', e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none"
          style={erreurs.description ? err : base} />
        {erreurs.description && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.description}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Prix (F) *</label>
          <input type="number" placeholder="250" value={form.prix} min={1}
            onChange={(e) => set('prix', e.target.value)}
            className="px-3 py-3 rounded-xl text-sm outline-none"
            style={erreurs.prix ? err : base} />
          {erreurs.prix && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.prix}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Stock *</label>
          <input type="number" placeholder="10" value={form.stock} min={0}
            onChange={(e) => set('stock', e.target.value)}
            className="px-3 py-3 rounded-xl text-sm outline-none"
            style={erreurs.stock ? err : base} />
          {erreurs.stock && <span className="text-xs" style={{ color: '#E24B4A' }}>⚠ {erreurs.stock}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Unité</label>
          <select value={form.unite} onChange={(e) => set('unite', e.target.value)}
            className="px-3 py-3 rounded-xl text-sm outline-none cursor-pointer"
            style={base}>
            {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Catégorie</label>
          <select value={form.categorie} onChange={(e) => set('categorie', e.target.value)}
            className="px-3 py-3 rounded-xl text-sm outline-none cursor-pointer"
            style={base}>
            {categories.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3 rounded-xl text-white text-sm font-black cursor-pointer"
          style={{ background: saving ? '#999' : '#BA7517', border: 'none', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Enregistrement…' : initial ? '✓ Modifier' : '+ Ajouter le produit'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--surface-alt)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function CatalogueVendeur() {
  const navigate = useNavigate()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(null)
  const [search, setSearch] = useState('')
  const [confirmSup, setConfirmSup] = useState(null)
  const [filtreCategorie, setFiltreCategorie] = useState('Toutes')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([
        api.get('/vendor/products'),
        api.get('/vendor/categories')
      ])
      setProduits(prods)
      setCategories(cats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const categoriesDisponibles = ['Toutes', ...categories.map((c) => c.nom)]

  const filtres = produits.filter((p) => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchCategorie = filtreCategorie === 'Toutes' || p.categorie === filtreCategorie
    return matchSearch && matchCategorie
  })

  async function ajouter(data) {
    const created = await api.post('/vendor/products', data)
    setProduits((p) => [...p, created])
    setMode(null)
  }

  async function modifier(data) {
    const updated = await api.put(`/vendor/products/${data.id}`, data)
    setProduits((p) => p.map((x) => x.id === data.id ? updated : x))
    setMode(null)
  }

  async function supprimer(id) {
    await api.delete(`/vendor/products/${id}`)
    setProduits((p) => p.filter((x) => x.id !== id))
    setConfirmSup(null)
  }

  if (loading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-3">
          <div><div className="h-4 rounded w-28 mb-1" style={{ background: 'var(--border)' }} /><div className="h-3 rounded w-16" style={{ background: 'var(--border)' }} /></div>
          <div className="h-9 rounded-full w-28" style={{ background: 'var(--border)' }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-bold text-sm" style={{ color: '#E24B4A' }}>{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: '#BA7517', color: '#fff' }}>Réessayer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Mon catalogue</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{produits.length} produits</div>
          </div>
          <button onClick={() => setMode('add')}
            className="px-4 py-2 rounded-full text-sm font-black cursor-pointer flex-shrink-0"
            style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
            + Ajouter
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <span className="text-base">🔍</span>
          <input type="text" placeholder="Rechercher un produit…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--text-primary)' }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {categoriesDisponibles.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {categoriesDisponibles.map((c) => (
            <button key={c} onClick={() => setFiltreCategorie(c)}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap cursor-pointer"
              style={{
                background: filtreCategorie === c ? '#BA7517' : 'var(--surface)',
                color: filtreCategorie === c ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${filtreCategorie === c ? '#BA7517' : 'var(--border)'}`,
              }}>
              {c}
            </button>
          ))}
        </div>
      )}

      {mode === 'add' && (
        <FormProduit categories={categories} onSave={ajouter} onCancel={() => setMode(null)} />
      )}

      {filtres.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
            {search ? `Aucun produit pour "${search}"` : 'Aucun produit. Ajoutez-en un !'}
          </p>
        </div>
      ) : (
        filtres.map((p) => (
          <div key={p.id}>
            {mode?.edit?.id === p.id ? (
              <FormProduit initial={mode.edit} categories={categories} onSave={modifier} onCancel={() => setMode(null)} />
            ) : (
              <div className="rounded-2xl p-4 transition-all"
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${p.stock <= 2 ? '#FAC775' : 'var(--border)'}`,
                  boxShadow: 'var(--shadow)',
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: p.stock <= 2 ? '#FAEEDA' : 'var(--surface-alt)' }}>
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{p.nom}</div>
                    <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{p.description}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full"
                        style={{ background: '#FAEEDA', color: '#BA7517' }}>
                        {p.prix.toLocaleString()} F/{p.unite}
                      </span>
                      {p.categorie && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: '#E6F1FB', color: '#2B6CB0' }}>
                          📂 {p.categorie}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: p.stock <= 2 ? '#FAEEDA' : '#E1F5EE',
                          color: p.stock <= 2 ? '#854F0B' : '#0F6E56',
                        }}>
                        {p.stock <= 2 ? '⚠️ ' : ''}Stock: {p.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setMode({ edit: p })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base cursor-pointer"
                      style={{ background: '#E6F1FB', border: 'none' }}>✏️</button>
                    <button onClick={() => setConfirmSup(p.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base cursor-pointer"
                      style={{ background: '#FAECE7', border: 'none' }}>🗑️</button>
                  </div>
                </div>
              </div>
            )}

            {confirmSup === p.id && (
              <div className="rounded-2xl p-4 mt-1"
                style={{ background: '#FAECE7', border: '1.5px solid #F5C4B3' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#993C1D' }}>
                  🗑️ Supprimer "{p.nom}" ? Action irréversible.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => supprimer(p.id)}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-black cursor-pointer"
                    style={{ background: '#D85A30', border: 'none' }}>Supprimer</button>
                  <button onClick={() => setConfirmSup(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

    </div>
  )
}
