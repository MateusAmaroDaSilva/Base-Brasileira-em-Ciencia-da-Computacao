export interface TreemapItem<T> {
  value: number
  data: T
}

export interface TreemapTile<T> extends TreemapItem<T> {
  x: number
  y: number
  w: number
  h: number
}

// Pior proporcao (largura/altura) entre os blocos de uma fileira de areas dada
function worst(areas: number[], side: number): number {
  const sum = areas.reduce((a, b) => a + b, 0)
  const max = Math.max(...areas)
  const min = Math.min(...areas)
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min))
}

/**
 * Treemap "squarified" (Bruls, Huizing e van Wijk): blocos o mais proximos possivel de quadrados,
 * com area proporcional ao valor. Valores devem ser positivos.
 */
export function squarify<T>(items: TreemapItem<T>[], width: number, height: number): TreemapTile<T>[] {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((sum, i) => sum + i.value, 0)
  if (sorted.length === 0 || total <= 0 || width <= 0 || height <= 0) return []

  const scale = (width * height) / total
  const tiles: TreemapTile<T>[] = []
  let x = 0
  let y = 0
  let w = width
  let h = height
  let rest = sorted

  while (rest.length > 0) {
    const side = Math.min(w, h)
    const row = [rest[0]]
    while (
      row.length < rest.length &&
      worst([...row, rest[row.length]].map((i) => i.value * scale), side) <=
        worst(row.map((i) => i.value * scale), side)
    ) {
      row.push(rest[row.length])
    }

    const rowArea = row.reduce((sum, i) => sum + i.value * scale, 0)
    if (w >= h) {
      // Fileira vertical, encostada na esquerda
      const colW = rowArea / h
      let cy = y
      for (const item of row) {
        const ih = (item.value * scale) / colW
        tiles.push({ ...item, x, y: cy, w: colW, h: ih })
        cy += ih
      }
      x += colW
      w -= colW
    } else {
      // Fileira horizontal, encostada no topo
      const rowH = rowArea / w
      let cx = x
      for (const item of row) {
        const iw = (item.value * scale) / rowH
        tiles.push({ ...item, x: cx, y, w: iw, h: rowH })
        cx += iw
      }
      y += rowH
      h -= rowH
    }
    rest = rest.slice(row.length)
  }
  return tiles
}
