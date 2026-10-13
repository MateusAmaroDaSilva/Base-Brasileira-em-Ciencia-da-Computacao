import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/account/Avatar'
import { AREAS } from '../data/areas'
import { squareAvatar } from '../lib/image'

export default function ProfilePage() {
  const { user, updateUser, setAvatar, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [institution, setInstitution] = useState(user?.institution ?? '')
  const [areas, setAreas] = useState<string[]>(user?.areas ?? [])
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  if (!user) return null

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    setPhotoError(null)
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setPhotoError('Use uma imagem JPEG, PNG ou WebP.')
    if (file.size > 10 * 1024 * 1024) return setPhotoError('A imagem é grande demais (máximo de 10 MB).')
    setPhotoBusy(true)
    try {
      await setAvatar(await squareAvatar(file))
    } catch (err) {
      setPhotoError(apiErrorMessage(err, 'Não foi possível enviar a foto.'))
    } finally {
      setPhotoBusy(false)
    }
  }

  async function dropPhoto() {
    setPhotoError(null)
    setPhotoBusy(true)
    try {
      await setAvatar(null)
    } catch (err) {
      setPhotoError(apiErrorMessage(err, 'Não foi possível remover a foto.'))
    } finally {
      setPhotoBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await updateUser({ name, institution, areas })
      setMessage({ ok: true, text: 'Perfil atualizado.' })
    } catch (err) {
      setMessage({ ok: false, text: apiErrorMessage(err, 'Não foi possível salvar.') })
    } finally {
      setSaving(false)
    }
  }

  const input =
    'h-11 w-full px-3.5 bg-white border border-linha rounded-[10px] text-[15px] focus:border-brand-300 outline-none !ring-0 focus:ring-2 focus:ring-brand-100'

  return (
    <section aria-labelledby="titulo-perfil" className="max-w-[560px]">
      <h1 id="titulo-perfil" className="text-[34px] lg:text-[42px] font-semibold">Meu perfil</h1>
      <p className="mt-2 text-sm">Seus dados e as áreas que você acompanha.</p>

      <form onSubmit={submit} className="mt-6 bg-white border border-linha rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-5 flex-wrap">
          <Avatar user={user} className="w-24 h-24 text-3xl" />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-brand-600">Foto de perfil</p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={photoBusy}
                className="h-9 px-4 rounded-lg bg-white border border-linha text-[13px] font-semibold text-brand-600 hover:border-brand-300 transition-colors disabled:opacity-60"
              >
                {photoBusy ? 'Enviando…' : user.avatar_url ? 'Trocar foto' : 'Enviar foto'}
              </button>
              {user.avatar_url && (
                <button
                  type="button"
                  onClick={dropPhoto}
                  disabled={photoBusy}
                  className="h-9 px-4 rounded-lg bg-white border border-linha text-[13px] font-semibold text-tinta hover:border-brand-300 transition-colors disabled:opacity-60"
                >
                  Remover
                </button>
              )}
            </div>
            <p className="text-[11px]">JPEG, PNG ou WebP. A imagem é recortada em quadrado.</p>
            {photoError && <p role="alert" className="text-xs text-red-800">{photoError}</p>}
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} className="sr-only" tabIndex={-1} aria-label="Escolher foto de perfil" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="perfil-nome" className="text-xs font-semibold text-brand-600">Nome completo</label>
          <input id="perfil-nome" className={input} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="perfil-email" className="text-xs font-semibold text-brand-600">E-mail</label>
          <input id="perfil-email" className={`${input} bg-brand-50`} value={user.email} readOnly />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="perfil-instituicao" className="text-xs font-semibold text-brand-600">Instituição</label>
          <input id="perfil-instituicao" className={input} value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={200} />
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
                  onClick={() => setAreas((prev) => (on ? prev.filter((a) => a !== area.label) : [...prev, area.label]))}
                  className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors ${
                    on ? 'bg-verde-50 border-verde-100 text-verde-600' : 'bg-white border-linha text-tinta hover:border-brand-300'
                  }`}
                >
                  {area.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        {message && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={`text-[13px] rounded-lg px-3 py-2.5 border ${
              message.ok ? 'bg-verde-50 border-verde-100 text-verde-700' : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-6 rounded-[10px] bg-verde-600 hover:bg-verde-700 text-white font-semibold text-[15px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="h-11 px-5 rounded-[10px] border border-brand-600 text-brand-600 font-semibold text-[15px] hover:bg-brand-50 transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </form>
    </section>
  )
}
