import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNavLivreur from '../../components/livreur/BottomNav'

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
              date: 'Aujourd’hui, 14:20',
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
    <div className="w-full min-h-screen font-sans" style={{ background: '#F7F8F3', paddingBottom: 90 }}>
      <div className="relative overflow-hidden px-5 pt-5 pb-6" style={{ background: 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-white font-black text-lg">Commande livreur</div>
            <div className="text-white/80 text-xs mt-0.5">Suivez vos courses et prenez de nouvelles missions.</div>
          </div>
          <button
            onClick={() => navigate('/livreur/dashboard')}
            className="rounded-2xl px-4 py-2 text-xs font-black"
            style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: 'none' }}
          >
            Tableau de bord
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">Courses actives</div>
            <div className="text-2xl font-black text-white">{coursesActives.length}</div>
          </div>
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">Propositions</div>
            <div className="text-2xl font-black text-white">{coursesDisponibles.length}</div>
          </div>
          <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75 mb-2">Historique</div>
            <div className="text-2xl font-black text-white">{historique.length}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-black text-[#2C2C2A]">Mes courses actives</div>
              <div className="text-xs text-[#5F5E5A] mt-1">Pilotez votre journée livreur depuis un seul écran.</div>
            </div>
            <span className="text-xs text-[#5F5E5A]">{coursesActives.length} en cours</span>
          </div>

          <div className="space-y-3">
            {coursesActives.length === 0 && (
              <div className="text-sm text-[#888780]">Aucune course active. Acceptez une mission ci-dessous.</div>
            )}
            {coursesActives.map((course) => (
              <div key={course.id} className="rounded-3xl p-4" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-[#2C2C2A]">Commande #{course.id}</div>
                    <div className="text-xs text-[#888780]">Destination {course.destination}</div>
                  </div>
                  <span className="uppercase text-[10px] font-bold" style={{ color: course.statut === 'termine' ? '#1D9E75' : '#BA7517' }}>
                    {STATUS_LABEL[course.statut] || course.statut}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#5F5E5A]">
                  <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                    <div className="font-semibold">Client</div>
                    <div>{course.client}</div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
                    <div className="font-semibold">Montant</div>
                    <div>{course.frais.toLocaleString()} F</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-[#888780]">{course.temps}</div>
                  <button
                    onClick={() => avancerStatut(course.id)}
                    className="rounded-2xl px-4 py-3 font-black text-white"
                    style={{ background: '#D85A30', border: 'none' }}
                  >
                    {course.statut === 'collecte' ? 'Passer à livraison' : 'Marquer comme livrée'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1.5px solid #E8E6DF' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-black text-[#2C2C2A]">Courses à prendre</div>
              <div className="text-xs text-[#5F5E5A] mt-1">Choisissez une mission compatible avec votre zone.</div>
            </div>
            <span className="text-xs text-[#5F5E5A]">{coursesDisponibles.length} propositions</span>
          </div>

          <div className="flex flex-col gap-3">
            {coursesDisponibles.length === 0 && (
              <div className="text-sm text-[#888780]">Aucune nouvelle proposition pour le moment.</div>
            )}
            {coursesDisponibles.map((course) => (
              <div key={course.id} className="rounded-3xl p-4" style={{ background: '#FAFAF7', border: '1.5px solid #E8E6DF' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-sm text-[#2C2C2A]">Course #{course.id}</div>
                    <div className="text-xs text-[#888780] mt-1">{course.marche} → {course.destination}</div>
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
                <button
                  onClick={() => accepterCourse(course.id)}
                  className="mt-4 w-full rounded-2xl py-3 font-black text-white"
                  style={{ background: '#D85A30', border: 'none' }}
                >
                  Accepter cette course
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavLivreur />
    </div>
  )
}
