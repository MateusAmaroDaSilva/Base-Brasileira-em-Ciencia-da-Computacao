import { initials } from '../../context/AuthContext'
import type { User } from '../../types'

/** Foto do usuario ou, sem foto, as iniciais sobre fundo verde. */
export default function Avatar({ user, className = 'w-10 h-10 text-sm' }: { user: User; className?: string }) {
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt="" className={`${className} rounded-full object-cover shrink-0`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} rounded-full bg-verde-600 text-white font-bold inline-flex items-center justify-center shrink-0`}
    >
      {initials(user.name)}
    </span>
  )
}
