const padPosto = id => String(id).padStart(2, '0')

export const POSTOS = Array.from({ length: 21 }, (_, index) => {
  const id = index + 1
  return {
    id,
    nome: `Posto ${padPosto(id)}`,
    local: '',
  }
})

export function getPostoId(valor) {
  if (!valor) return null
  if (typeof valor === 'number') return valor

  const texto = String(valor)
  const encontrado = POSTOS.find(p => p.nome === texto || String(p.id) === texto)
  if (encontrado) return encontrado.id

  const match = texto.match(/\d+/)
  if (!match) return null

  const id = Number(match[0])
  return id >= 1 && id <= POSTOS.length ? id : null
}

export function getRegistroPostoId(registro) {
  return getPostoId(registro?.postoId || registro?.posto)
}

export function formatPosto(valor) {
  const id = getPostoId(valor)
  return id ? `Posto ${padPosto(id)}` : valor || ''
}

export function sortRegistrosPorPosto(registros) {
  return [...registros].sort((a, b) => {
    const postoA = getRegistroPostoId(a) || Number.MAX_SAFE_INTEGER
    const postoB = getRegistroPostoId(b) || Number.MAX_SAFE_INTEGER
    if (postoA !== postoB) return postoA - postoB

    const horaA = new Date(a.timestamp || 0).getTime()
    const horaB = new Date(b.timestamp || 0).getTime()
    if (horaA !== horaB) return horaA - horaB

    return String(a.usuario || '').localeCompare(String(b.usuario || ''), 'pt-BR')
  })
}
