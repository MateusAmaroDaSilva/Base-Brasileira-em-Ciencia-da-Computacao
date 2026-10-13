import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BookText, Lock, Mail } from 'lucide-react'
import AuthShell from '../components/auth/AuthShell'
import Field from '../components/auth/Field'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

const primaryButton =
  'h-12 2xl:h-14 w-full rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white font-semibold text-[15px] ' +
  'transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
const secondaryButton =
  'h-12 2xl:h-14 w-full rounded-[10px] bg-white border border-linha text-brand-600 font-semibold text-[15px] ' +
  'inline-flex items-center justify-center gap-2 opacity-60 cursor-not-allowed'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [forgot, setForgot] = useState(false)

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password, remember)
      navigate(from, { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível entrar.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Bem-vindo de volta à BBCC"
      text="Sua conta guarda o que você pesquisa e o que quer ler depois."
      perks={['Veja seu histórico de buscas', 'Salve artigos para ler depois', 'Receba alertas de novos artigos']}
    >
      <h2 className="text-[34px] 2xl:text-[42px] font-semibold">Entrar</h2>
      <p className="mt-1 text-sm 2xl:text-base">Acesse sua conta para continuar.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
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
        <Field
          label="Senha"
          type="password"
          reveal
          autoComplete="current-password"
          required
          placeholder="Sua senha"
          icon={<Lock className="w-[18px] h-[18px]" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between gap-3 text-[13px]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-[#16325c]"
            />
            Lembrar de mim
          </label>
          <button type="button" onClick={() => setForgot((v) => !v)} className="font-semibold text-verde-600 hover:text-verde-700">
            Esqueci minha senha
          </button>
        </div>

        {forgot && (
          <p role="status" className="text-[13px] bg-amarelo-100 border border-amarelo-200 text-[#6b5200] rounded-lg px-3 py-2.5">
            A recuperação de senha por e-mail ainda não está disponível. Fale com a equipe pela página{' '}
            <Link to="/sobre#contato" className="font-semibold underline">
              Sobre o projeto
            </Link>
            .
          </p>
        )}

        {error && (
          <p role="alert" className="text-[13px] bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !email || !password} className={primaryButton}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs" aria-hidden="true">
        <span className="flex-1 border-t border-linha" />
        ou
        <span className="flex-1 border-t border-linha" />
      </div>

      <div className="flex flex-col gap-3">
        <button type="button" disabled className={secondaryButton} title="Em breve">
          Entrar com ORCID
        </button>
        <button type="button" disabled className={secondaryButton} title="Em breve">
          <BookText className="w-4 h-4" aria-hidden="true" />
          Entrar com a conta da instituição
        </button>
      </div>

      <p className="mt-6 text-center text-[13px]">
        Ainda não tem conta?{' '}
        <Link to="/cadastrar" state={{ from }} className="font-semibold text-verde-600 hover:text-verde-700">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  )
}
