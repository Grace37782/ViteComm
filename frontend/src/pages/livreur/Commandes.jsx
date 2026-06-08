import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const COURSES_AVAILABLE = [
  {
    id: 901,
    marche: 'Dantokpa',
    destination: 'Hôpital La Croix',
    frais: 520,
    distance: '7 km',
    etals: ['Étal Maman Adjoua', 'Étal Brice Poisson'],
  },
  {
    id: 902,
    marche: 'Missèbo',
    destination: 'Adidogomé',
    frais: 460,
    distance: '6 km',
    etals: ['Étal Kadidja'],
  },
]

const INITIAL_ACTIVES = [
  {
    id: 801,
    client: 'M. Kossi',
    destination: 'Porto Novo',
    frais: 600,
    statut: 'collecte',
    temps: '12 min',
  },
]

const STATUS_LABEL = {
  collecte: 'Collecte en cours',
  livraison: 'En route vers le client',
  termine: 'Livrée',
}

const STATUS_COLOR = {
  collecte: '#BA7517',
  livraison: '#D85A30',
  termine: '#1D9E75',
}

export default function CommandesLivreur() {
  const navigate = useNavigate()
  const [coursesDisponibles, setCoursesDisponibles] = useState(COURSES_AVAILABLE)
  const [coursesActives, setCoursesActives] = useState(INITIAL_ACTIVES)
  const [historique, setHistorique] = useState([])

  function accepterCourse(id) {
    const course = coursesDisponibles.find((course) => course.id === id)
    if (!course) return
    setCoursesDisponibles((prev) => prev.filter((item) => item.id !== id))
    setCoursesActives((prev) => [
      ...prev,
      {
        id: course.id,
        client: 'Client ViteComm',
        destination: course.destination,
        frais: course.frais,
        statut: 'collecte',
        temps: 'En attente',
      },
    ])
  }

  function avancerStatut(id) {
    setCoursesActives((prev) =>
      prev.map((course) => {
        if (course.id !== id) return course
        if (course.statut === 'collecte') {
          return { ...course, statut: 'livraison', temps: '6 min' }
        }
        if (course.statut === 'livraison') {
          setHistorique((history) => [
            {
              ...course,
              statut: 'termine',
              temps: 'Livrée',
              date: 'Aujourd\'hui, 14:20',
            },
            ...history,
          ])
          return null
        }
        return course
      }).filter(Boolean)
    )
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* ══ STATS ══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Actives', value: coursesActives.length, accent: '#D85A30' },
          { label: 'Propositions', value: coursesDisponibles.length, accent: '#BA7517' },
          { label: 'Historique', value: historique.length, accent: '#1D9E75' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3"
            style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
            <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#888780' }}>{s.label}</div>
            <div className="font-black text-xl" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ══ COURSES ACTIVES ══ */}
      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-black" style={{ color: '#2C2C2A' }}>Mes courses actives</div>
            <div className="text-xs" style={{ color: '#888780' }}>Pilotez votre journée livreur.</div>
          </div>
          <span className="text-xs" style={{ color: '#5F5E5A' }}>{coursesActives.length} en cours</span>
        </div>
        <div className="space-y-3">
          {coursesActives.length === 0 && (
            <div className="text-sm" style={{ color: '#888780' }}>Aucune course active. Acceptez une mission ci-dessous.</div>
          )}
          {coursesActives.map((course) => (
            <div key={course.id} className="rounded-2xl p-4" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black" style={{ color: '#2C2C2A' }}>Commande #{course.id}</div>
                  <div className="text-xs" style={{ color: '#888780' }}>Destination {course.destination}</div>
                </div>
                <span className="uppercase text-[10px] font-bold" style={{ color: STATUS_COLOR[course.statut] || '#BA7517' }}>
                  {STATUS_LABEL[course.statut] || course.statut}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs" style={{ color: '#5F5E5A' }}>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Client</div>
                  <div>{course.client}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Montant</div>
                  <div>{course.frais.toLocaleString()} F</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs" style={{ color: '#888780' }}>{course.temps}</div>
                <button onClick={() => avancerStatut(course.id)}
                  className="rounded-2xl px-4 py-3 font-black text-white"
                  style={{ background: '#D85A30', border: 'none' }}>
                  {course.statut === 'collecte' ? 'Passer à livraison' : 'Marquer comme livrée'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ COURSES À PRENDRE ══ */}
      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-black" style={{ color: '#2C2C2A' }}>Courses à prendre</div>
            <div className="text-xs" style={{ color: '#888780' }}>Choisissez une mission compatible avec votre zone.</div>
          </div>
          <span className="text-xs" style={{ color: '#5F5E5A' }}>{coursesDisponibles.length} propositions</span>
        </div>
        <div className="flex flex-col gap-3">
          {coursesDisponibles.length === 0 && (
            <div className="text-sm py-10" style={{ color: '#888780' }}>Aucune nouvelle proposition pour le moment.</div>
          )}
          {coursesDisponibles.map((course) => (
            <div key={course.id} className="rounded-2xl p-4" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-black text-sm" style={{ color: '#2C2C2A' }}>Course #{course.id}</div>
                  <div className="text-xs mt-1" style={{ color: '#888780' }}>{course.marche} → {course.destination}</div>
                </div>
                <div className="text-sm font-black" style={{ color: '#D85A30' }}>{course.frais.toLocaleString()} F</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs" style={{ color: '#5F5E5A' }}>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Étals</div>
                  <div>{course.etals.join(', ')}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                  <div className="font-semibold">Distance</div>
                  <div>{course.distance}</div>
                </div>
              </div>
              <button onClick={() => accepterCourse(course.id)}
                className="mt-4 w-full rounded-2xl py-3 font-black text-white"
                style={{ background: '#D85A30', border: 'none' }}>
                Accepter cette course
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
