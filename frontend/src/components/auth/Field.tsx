import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  icon: ReactNode
  /** Mostra o botao de ver/ocultar senha */
  reveal?: boolean
}

export const inputShell =
  'flex items-center gap-3 h-12 2xl:h-14 px-4 bg-white border border-linha rounded-[10px] text-[15px] 2xl:text-[17px] ' +
  'focus-within:border-brand-300'

export default function Field({ label, icon, reveal, type = 'text', id, ...rest }: FieldProps) {
  const [shown, setShown] = useState(false)
  const inputId = id ?? `campo-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs 2xl:text-sm font-semibold text-brand-600">
        {label}
      </label>
      <div className={inputShell}>
        <span className="text-tinta shrink-0" aria-hidden="true">
          {icon}
        </span>
        <input
          id={inputId}
          type={reveal && shown ? 'text' : type}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-[#6b6b6b] !ring-0"
          {...rest}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Ocultar senha' : 'Mostrar senha'}
            className="text-tinta hover:text-brand-600 shrink-0"
          >
            {shown ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
        )}
      </div>
    </div>
  )
}
