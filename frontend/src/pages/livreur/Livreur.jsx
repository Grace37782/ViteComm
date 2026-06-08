import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNavLivreur from '../../components/livreur/BottomNav'

const LIVREUR = {
  prenom: 'Baba',
  type_vehicule: 'Zemidjan',
  immatriculation: 'RB-1234',
  score_reputation: 4.7,
  courses_terminees: 124,
  gains: 25400,
  disponible: true,
  distance_action: 12,
  horaire_debut: '06:00',
  horaire_fin: '20:00',
}

const COURSES_DISPONIBLES = [
  {
    id: 801,
    marche: 'Dantokpa',
    etals: ['Étal Maman Adjoua', 'Étal Brice Poisson'],
    destination: 'Akpakpa Centre',
    frais: 600,
    distance: '8 km',
    statut: 'en_attente',
  },
  {
    id: 802,
    marche: 'Missèbo',
    etals: ['Étal Kadidja'],
    destination: 'Zogbo',
    frais: 420,
    distance: '5 km',
    statut: 'en_attente',
  },
]

const COURSES_EN_COURS = [
  {
    id: 701,
    client: 'M. Kossi',
    destination: 'Porto Novo',
    montant: 520,
    statut: 'collecte',
    temps: '12 min',
  },
]

const STAT_CARD = [
  { label: 'Gains', value: `${LIVREUR.gains.toLocaleString()} F`, accent: '#1D9E75' },
  { label: 'Courses', value: LIVREUR.courses_terminees, accent: '#D85A30' },
  { label: 'Réputation', value: `${LIVREUR.score_reputation.toFixed(1)} ⭐`, accent: '#BA7517' },
]

export default function Livreur() {
  const navigate = useNavigate()
  const [disponible, setDisponible] = useState(LIVREUR.disponible)
  const [horaireDebut, setHoraireDebut] = useState(LIVREUR.horaire_debut)
  const [horaireFin, setHoraireFin] = useState(LIVREUR.horaire_fin)
  const [distanceAction, setDistanceAction] = useState(LIVREUR.distance_action)
  const [courses, setCourses] = useState(COURSES_DISPONIBLES)
  const [enCours, setEnCours] = useState(COURSES_EN_COURS)

  function accepterCourse(id) {
    setCourses((prev) => prev.filter((c) => c.id !== id))
    const course = COURSES_DISPONIBLES.find((c) => c.id === id)
    if (!course) return
    setEnCours((prev) => [
      ...prev,
      {
        id: course.id,
        client: 'Nouveau client',
        destination: course.destination,
        montant: course.frais,
        statut: 'collecte',
        temps: 'En cours',
      },
    ])
  }

  return (
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 80 }}>
      <div className="relative overflow-hidden px-5 pt-5 pb-6"
        style={{ background: 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <div className="text-white font-black text-lg">Bonjour {LIVREUR.prenom} 👋</div>
            <div className="text-white/80 text-xs mt-0.5">Espace Livreur — ViteComm</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/livreur/commandes')}
              className="rounded-2xl px-4 py-2 text-xs font-black"
              style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: 'none' }}
            >
              Commandes
            </button>
            <button
              onClick={() => navigate('/livreur/retours')}
              className="rounded-2xl px-4 py-2 text-xs font-black"
              style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: 'none' }}
            >
              Retours
            </button>
          </div>
          <div className="rounded-2xl px-4 py-3 text-xs font-black"
            style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
            {disponible ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STAT_CARD.map((card) => (
            <div key={card.label} className="rounded-3xl p-4"
              style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">{card.label}</div>
              <div className="text-2xl font-black text-white" style={{ color: card.accent }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-[#2C2C2A]">Disponibilité</div>
              <div className="text-xs text-[#5F5E5A] mt-1">Choisissez vos horaires et votre rayon d’action.</div>
            </div>
            <button onClick={() => setDisponible((prev) => !prev)}
              className="rounded-2xl px-5 py-3 font-black text-sm cursor-pointer"
              style={{
                background: disponible ? '#1D9E75' : '#E8EEDA',
                color: disponible ? '#fff' : '#854F0B',
                border: 'none',
              }}>
              {disponible ? 'Actif' : 'Inactif'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <label className="rounded-2xl p-4" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
              <div className="text-xs font-semibold text-[#5F5E5A]">Heure de début</div>
              <input type="time" value={horaireDebut} onChange={(e) => setHoraireDebut(e.target.value)}
                className="mt-2 w-full bg-transparent outline-none text-sm font-black text-[#2C2C2A]" />
            </label>
            <label className="rounded-2xl p-4" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
              <div className="text-xs font-semibold text-[#5F5E5A]">Heure de fin</div>
              <input type="time" value={horaireFin} onChange={(e) => setHoraireFin(e.target.value)}
                className="mt-2 w-full bg-transparent outline-none text-sm font-black text-[#2C2C2A]" />
            </label>
            <label className="rounded-2xl p-4" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
              <div className="text-xs font-semibold text-[#5F5E5A]">Rayon d’action</div>
              <input type="number" min="1" value={distanceAction}
                onChange={(e) => setDistanceAction(Number(e.target.value))}
                className="mt-2 w-full bg-transparent outline-none text-sm font-black text-[#2C2C2A]"
                style={{ WebkitAppearance: 'none' }} />
              <div className="text-xs text-[#888780] mt-1">km</div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-black text-[#2C2C2A]">Mon véhicule</div>
                <div className="text-xs text-[#888780]">Type et immatriculation</div>
              </div>
              <div className="text-xs font-bold text-[#BA7517]">{LIVREUR.type_vehicule}</div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
              <div className="text-xs text-[#5F5E5A]">Véhicule</div>
              <div className="font-black text-sm text-[#2C2C2A]">{LIVREUR.type_vehicule}</div>
              <div className="text-xs text-[#5F5E5A] mt-3">Immatriculation</div>
              <div className="font-black text-sm text-[#2C2C2A]">{LIVREUR.immatriculation}</div>
            </div>
          </div>

          <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
            <div className="text-sm font-black text-[#2C2C2A] mb-4">Courses en cours</div>
            <div className="space-y-3">
              {enCours.map((course) => (
                <div key={course.id} className="rounded-2xl p-3" style={{ background: '#F7F8F3', border: '1.5px solid #E8E6DF' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-black text-sm text-[#2C2C2A]">Commande #{course.id}</div>
                    <span className="text-xs font-bold text-[#0F6E56]">{course.statut}</span>
                  </div>
                  <div className="text-xs text-[#5F5E5A]">Destination</div>
                  <div className="font-semibold text-sm text-[#2C2C2A]">{course.destination}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#888780]">
                    <span>{course.client}</span>
                    <span>{course.montant.toLocaleString()} F</span>
                  </div>
                </div>
              ))}
              {enCours.length === 0 && (
                <div className="text-xs text-[#888780]">Aucune course en cours. Acceptez une nouvelle course.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-black text-[#2C2C2A]">Courses disponibles</div>
              <div className="text-xs text-[#888780]">Choisissez une course à prendre en charge.</div>
            </div>
            <span className="text-xs text-[#5F5E5A]">{courses.length} propositions</span>
          </div>

          <div className="flex flex-col gap-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-3xl p-4" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-sm text-[#2C2C2A]">Course #{course.id}</div>
                    <div className="text-xs text-[#888780] mt-1">Marché {course.marche} → {course.destination}</div>
                  </div>
                  <div className="text-sm font-black text-[#D85A30]">{course.frais.toLocaleString()} F</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#5F5E5A]">
                  <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                    <div className="font-semibold">Étals</div>
                    <div>{course.etals.join(', ')}</div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                    <div className="font-semibold">Distance</div>
                    <div>{course.distance}</div>
                  </div>
                </div>
                <button onClick={() => accepterCourse(course.id)}
                  className="mt-4 w-full rounded-2xl py-3 font-black text-white cursor-pointer"
                  style={{ background: '#D85A30', border: 'none' }}>
                  Accepter cette course
                </button>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="text-center text-sm text-[#888780] py-10">Aucune course disponible pour le moment.</div>
            )}
          </div>
        </div>
      </div>
      <BottomNavLivreur />
    </div>
  )
}
