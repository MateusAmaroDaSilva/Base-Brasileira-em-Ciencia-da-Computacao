import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Landmark, Lock, Mail, User as UserIcon } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import Field, { inputShell } from '../components/auth/Field'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AREAS } from '../data/areas'

const OTHER = 'Outra instituição'
const INSTITUTIONS = [
  'UNIMAR — Universidade de Marília',
  'USP',
  'UNICAMP',
  'UNESP',
  'UFSCar',
  'UFRJ',
  'UFMG',
  'UFRGS',
  'UFPE',
  'UFSC',
  'UFPR',
  'UnB',
  'PUC-Rio',
  'PUC-SP',
  OTHER,
]

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [otherInstitution, setOtherInstitution] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={from} replace />

  function toggleArea(label: string) {
    setAreas((prev) => (prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('A senha precisa ter no mínimo 8 caracteres.')
    if (password !== confirm) return setError('A confirmação de senha não confere.')
    if (!accepted) return setError('É preciso aceitar os termos de uso e a política de privacidade.')

    setSubmitting(true)
    try {
      await register({
        name,
        email,
        institution: institution === OTHER ? otherInstitution : institution,
        areas,
        password,
        accept_terms: accepted,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível criar a conta.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Crie sua conta na BBCC"
      text="Sua conta guarda o que você pesquisa e o que quer ler depois."
      perks={['Histórico de buscas sempre à mão', 'Artigos salvos em um só lugar', 'Alertas das áreas que você segue']}
    >
      <h2 className="text-[34px] 2xl:text-[42px] font-semibold">Criar conta</h2>
      <p className="mt-1 text-sm 2xl:text-base">Leva menos de um minuto. É gratuito.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field
          label="Nome completo"
          autoComplete="name"
          required
          placeholder="Seu nome"
          icon={<UserIcon className="w-[18px] h-[18px]" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          placeholder="seu.nome@instituicao.br"
          icon={<Mail className="w-[18px] h-[18px]" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="campo-instituicao" className="text-xs font-semibold text-brand-600">
            Instituição
          </label>
          <div className={`${inputShell} relative`}>
            <Landmark className="w-[18px] h-[18px] text-tinta shrink-0" aria-hidden="true" />
            <select
              id="campo-instituicao"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className={`flex-1 min-w-0 appearance-none bg-transparent outline-none cursor-pointer pr-6 ${
                institution ? '' : 'text-[#6b6b6b]'
              }`}
            >
              <option value="">Selecione sua instituição</option>
              {INSTITUTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 pointer-events-none" aria-hidden="true" />
          </div>
          {institution === OTHER && (
            <input
              aria-label="Nome da instituição"
              placeholder="Nome da instituição"
              value={otherInstitution}
              onChange={(e) => setOtherInstitution(e.target.value)}
              className={`${inputShell} outline-none`}
            />
          )}
        </div>

        <fieldset>
          <legend className="text-xs font-semibold text-brand-600 mb-2">Áreas de interesse</legend>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => {
              const on = areas.includes(area.label)
              return (
                <button
                  key={area.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleArea(area.label)}
                  className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors ${
                    on
                      ? 'bg-verde-50 border-verde-100 text-verde-600'
                      : 'bg-white border-linha text-tinta hover:border-brand-300'
                  }`}
                >
                  {area.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px]">Usamos suas áreas para sugerir artigos e alertas.</p>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Senha"
            type="password"
            reveal
            autoComplete="new-password"
            required
            placeholder="Mínimo de 8 caracteres"
            icon={<Lock className="w-[18px] h-[18px]" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            required
            icon={<Lock className="w-[18px] h-[18px]" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <label className="flex items-start gap-2.5 text-[13px] cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#16325c]"
          />
          Li e aceito os termos de uso e a política de privacidade.
        </label>

        {error && (
          <p role="alert" className="text-[13px] bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 2xl:h-14 w-full rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white font-semibold text-[15px]
                     transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px]">
        Já tem conta?{' '}
        <Link to="/entrar" state={{ from }} className="font-semibold text-verde-600 hover:text-verde-700">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
