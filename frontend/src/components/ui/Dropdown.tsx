import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  label: string
  /** Classes do botao, para encaixar o menu em cada contexto */
  buttonClassName?: string
  /** Largura minima do painel */
  panelClassName?: string
}

/**
 * Menu suspenso no mesmo padrao do historico de buscas (cartao branco, cantos arredondados, sombra),
 * no lugar da lista nativa do navegador, que cada sistema desenha de um jeito.
 */
export default function Dropdown({
  value,
  onChange,
  options,
  label,
  buttonClassName = '',
  panelClassName = 'min-w-[260px]',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const id = useId()
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  function openMenu() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function choose(index: number) {
    onChange(options[index].value)
    setOpen(false)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(active)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={root} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-lista`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`inline-flex items-center justify-between gap-2 ${buttonClassName}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          className={`absolute right-0 top-full mt-3 z-30 py-1.5 bg-white border border-linha rounded-[14px] shadow-card-hover text-left max-h-[340px] overflow-auto ${panelClassName}`}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer text-[15px] text-brand-600 ${
                  i === active ? 'bg-brand-50' : ''
                } ${isSelected ? 'font-semibold' : ''}`}
              >
                {option.label}
                {isSelected && <Check className="w-4 h-4 text-verde-600 shrink-0" aria-hidden="true" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
