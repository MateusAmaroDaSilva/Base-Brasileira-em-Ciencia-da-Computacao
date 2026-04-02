interface Magazine {
  id: number
  title: string
  oai_pmh_url: string
}

interface MagazineSelectorProps {
  magazines: Magazine[]
  selectedMagazine: number | null
  onSelectMagazine: (magazineId: number | null) => void
}

export default function MagazineSelector({
  magazines,
  selectedMagazine,
  onSelectMagazine,
}: MagazineSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📰 Selecionar Revista
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectMagazine(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedMagazine === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas as Revistas
        </button>
        {magazines.map((magazine) => (
          <button
            key={magazine.id}
            onClick={() => onSelectMagazine(magazine.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMagazine === magazine.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {magazine.title}
          </button>
        ))}
      </div>
    </div>
  )
}
