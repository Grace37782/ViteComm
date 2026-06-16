import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Apple, Flame, Leaf, Fish, Drumstick, Egg, Wheat, Package, Citrus, Carrot, Droplets, Bean, CircleDot, Salad, Cherry, AlertTriangle, Search, Folder, Pencil, Trash2, ChevronDown, Camera } from 'lucide-react'

const PAGE_SIZE = 10
const EMOJIS = [Apple, Flame, Leaf, Fish, Drumstick, Egg, Wheat, Package, Citrus, Carrot, Droplets, Bean, CircleDot, Salad, Cherry]
const UNITES = ['kg', 'tas', 'pièce', 'régime', 'litre', 'paquet', 'boîte']

function FormProduit({ initial, categories, onSave, onCancel }) {
  const vide = { emoji: 'Apple', nom: '', description: '', prix: '', stock: '', unite: 'kg', categorie: '' }
  const [form, setForm] = useState(initial || vide)
  const [erreurs, setErreurs] = useState({})
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(initial?.photo_url || null)
  const fileRef = useRef(null)

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

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!valider()) return
    setSaving(true)
    try {
      const result = await onSave({ ...form, prix: +form.prix, stock: +form.stock })
      // Upload photo if a new one was selected and we have a product ID
      if (photoFile && result?.id) {
        const fd = new FormData()
        fd.append('photo', photoFile)
        await api.post(`/vendor/products/${result.id}/photo`, fd)
      }
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
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Photo du produit</div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
            style={{ background: 'var(--surface-alt)', border: '1.5px dashed var(--border)' }}
            onClick={() => fileRef.current?.click()}>
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera size={20} style={{ color: '#BA7517' }} />
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              style={{ background: '#FAEEDA', color: '#BA7517', border: 'none' }}>
              {photoPreview ? 'Changer' : 'Ajouter'}
            </button>
            {photoPreview && (
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: 'var(--surface-alt)', color: 'var(--text-muted)', border: 'none' }}>
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Icône du produit</div>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((Icon, idx) => (
            <button key={idx} type="button" onClick={() => set('emoji', Icon.displayName || Icon.name)}
              className="w-9 h-9 rounded-xl cursor-pointer transition-all flex items-center justify-center"
              style={{
                background: form.emoji === (Icon.displayName || Icon.name) ? '#FAEEDA' : 'var(--surface-alt)',
                border: `1.5px solid ${form.emoji === (Icon.displayName || Icon.name) ? '#BA7517' : 'var(--border)'}`,
                transform: form.emoji === (Icon.displayName || Icon.name) ? 'scale(1.1)' : 'none',
              }}>
              <Icon size={18} style={{ color: '#BA7517' }} />
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
        {erreurs.nom && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.nom}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Description *</label>
        <input type="text" placeholder="Courte description du produit"
          value={form.description} onChange={(e) => set('description', e.target.value)}
          className="px-4 py-3 rounded-xl text-sm outline-none"
          style={erreurs.description ? err : base} />
        {erreurs.description && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.description}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Prix (F) *</label>
          <input type="number" placeholder="250" value={form.prix} min={1}
            onChange={(e) => set('prix', e.target.value)}
            className="px-3 py-3 rounded-xl text-sm outline-none"
            style={erreurs.prix ? err : base} />
          {erreurs.prix && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.prix}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Stock *</label>
          <input type="number" placeholder="10" value={form.stock} min={0}
            onChange={(e) => set('stock', e.target.value)}
            className="px-3 py-3 rounded-xl text-sm outline-none"
            style={erreurs.stock ? err : base} />
          {erreurs.stock && <span className="text-xs flex items-center gap-1" style={{ color: '#E24B4A' }}><AlertTriangle size={12} /> {erreurs.stock}</span>}
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

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
  const visibleItems = filtres.slice(0, visibleCount)
  const hasMore = visibleCount < filtres.length

  async function ajouter(data) {
    const created = await api.post('/vendor/products', data)
    setProduits((p) => [...p, created])
    setMode(null)
    return created
  }

  async function modifier(data) {
    const updated = await api.put(`/vendor/products/${data.id}`, data)
    setProduits((p) => p.map((x) => x.id === data.id ? updated : x))
    setMode(null)
    return updated
  }

  async function supprimer(id) {
    await api.delete(`/vendor/products/${id}`)
    setProduits((p) => p.filter((x) => x.id !== id))
    setConfirmSup(null)
  }

  if (loading) {
    return (
    <div className="px-4 py-4 flex flex-col gap-4 mx-auto max-w-4xl">
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
          <div className="flex justify-center mb-3"><AlertTriangle size={40} style={{ color: '#E24B4A' }} /></div>
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
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Rechercher un produit…"
            value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
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
            <button key={c} onClick={() => { setFiltreCategorie(c); setVisibleCount(PAGE_SIZE) }}
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
          <div className="flex justify-center mb-3"><Package size={48} style={{ color: 'var(--text-muted)' }} /></div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
            {search ? `Aucun produit pour "${search}"` : 'Aucun produit. Ajoutez-en un !'}
          </p>
        </div>
      ) : (
        visibleItems.map((p) => (
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
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: p.stock <= 2 ? '#FAEEDA' : 'var(--surface-alt)' }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} style={{ color: '#BA7517' }} />
                    )}
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
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background: '#E6F1FB', color: '#2B6CB0' }}>
                          <Folder size={10} /> {p.categorie}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{
                          background: p.stock <= 2 ? '#FAEEDA' : '#E1F5EE',
                          color: p.stock <= 2 ? '#854F0B' : '#0F6E56',
                        }}>
                        {p.stock <= 2 && <AlertTriangle size={10} />} Stock: {p.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setMode({ edit: p })}
                      className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                      style={{ background: '#E6F1FB', border: 'none' }}><Pencil size={14} style={{ color: '#2B6CB0' }} /></button>
                    <button onClick={() => setConfirmSup(p.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                      style={{ background: '#FAECE7', border: 'none' }}><Trash2 size={14} style={{ color: '#D85A30' }} /></button>
                  </div>
                </div>
              </div>
            )}

            {confirmSup === p.id && (
              <div className="rounded-2xl p-4 mt-1"
                style={{ background: '#FAECE7', border: '1.5px solid #F5C4B3' }}>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#993C1D' }}>
                  <Trash2 size={14} /> Supprimer "{p.nom}" ? Action irréversible.
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

      {hasMore && (
        <button onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
          className="w-full py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
          <ChevronDown size={14} /> Charger plus ({filtres.length - visibleCount} restant{filtres.length - visibleCount > 1 ? 's' : ''})
        </button>
      )}

    </div>
  )
}
