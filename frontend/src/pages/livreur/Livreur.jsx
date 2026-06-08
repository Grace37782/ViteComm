import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  { label: 'Gains', value: `${LIVREUR.gains.toLocaleString()} F`, accent: '#D85A30' },
  { label: 'Courses', value: LIVREUR.courses_terminees, accent: '#BA7517' },
  { label: 'Réputation', value: `${LIVREUR.score_reputation.toFixed(1)} ⭐`, accent: '#1D9E75' },
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
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* ══ PROFIL & STATS ══ */}
      <div className="rounded-2xl p-4"
        style={{ background: '#fff', border: '1.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: '#D85A30', color: '#fff' }}>
            {LIVREUR.prenom[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
              {LIVREUR.prenom}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {LIVREUR.type_vehicule} · {LIVREUR.immatriculation}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="font-black text-lg" style={{ color: '#BA7517' }}>{LIVREUR.score_reputation}</span>
              <span className="text-sm">⭐</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{LIVREUR.courses_terminees} courses</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {STAT_CARD.map((card) => (
            <div key={card.label} className="rounded-xl p-3"
              style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
              <div className="font-black text-lg" style={{ color: card.accent }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ DISPO ══ */}
      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Disponibilité</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Horaires et rayon d'action</div>
          </div>
          <button onClick={() => setDisponible((prev) => !prev)}
            className="rounded-2xl px-5 py-2 font-black text-sm cursor-pointer"
            style={{
              background: disponible ? '#D85A30' : 'var(--border)',
              color: disponible ? '#fff' : 'var(--text-secondary)',
              border: 'none',
            }}>
            {disponible ? 'En ligne' : 'Hors ligne'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Début</div>
            <input type="time" value={horaireDebut} onChange={(e) => setHoraireDebut(e.target.value)}
              className="mt-1 w-full bg-transparent outline-none text-sm font-black" style={{ color: 'var(--text-primary)' }} />
          </label>
          <label className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Fin</div>
            <input type="time" value={horaireFin} onChange={(e) => setHoraireFin(e.target.value)}
              className="mt-1 w-full bg-transparent outline-none text-sm font-black" style={{ color: 'var(--text-primary)' }} />
          </label>
          <label className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Rayon</div>
            <input type="number" min="1" value={distanceAction}
              onChange={(e) => setDistanceAction(Number(e.target.value))}
              className="mt-1 w-full bg-transparent outline-none text-sm font-black" style={{ color: 'var(--text-primary)' }} />
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>km</div>
          </label>
        </div>
      </div>

      {/* ══ VÉHICULE & COURSES EN COURS ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Mon véhicule</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Type et immatriculation</div>
            </div>
            <div className="text-xs font-bold" style={{ color: '#BA7517' }}>{LIVREUR.type_vehicule}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Véhicule</div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{LIVREUR.type_vehicule}</div>
            <div className="text-[10px] mt-2" style={{ color: 'var(--text-secondary)' }}>Immatriculation</div>
            <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{LIVREUR.immatriculation}</div>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid var(--border)' }}>
          <div className="text-sm font-black mb-3" style={{ color: 'var(--text-primary)' }}>Courses en cours</div>
          <div className="space-y-3">
            {enCours.map((course) => (
              <div key={course.id} className="rounded-xl p-3" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Commande #{course.id}</div>
                  <span className="text-xs font-bold" style={{ color: '#D85A30' }}>{course.statut}</span>
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Destination</div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{course.destination}</div>
                <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{course.client}</span>
                  <span>{course.montant.toLocaleString()} F</span>
                </div>
              </div>
            ))}
            {enCours.length === 0 && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Aucune course en cours.</div>
            )}
          </div>
        </div>
      </div>

      {/* ══ COURSES DISPONIBLES ══ */}
      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Courses disponibles</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Choisissez une course à prendre en charge.</div>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{courses.length} propositions</span>
        </div>
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-2xl p-4" style={{ background: '#FAFAF7', border: '1.5px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Course #{course.id}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Marché {course.marche} → {course.destination}</div>
                </div>
                <div className="text-sm font-black" style={{ color: '#D85A30' }}>{course.frais.toLocaleString()} F</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1.5px solid var(--border)' }}>
                  <div className="font-semibold">Étals</div>
                  <div>{course.etals.join(', ')}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1.5px solid var(--border)' }}>
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
            <div className="text-center text-sm py-10" style={{ color: 'var(--text-muted)' }}>Aucune course disponible pour le moment.</div>
          )}
        </div>
      </div>
    </div>
  )
}
