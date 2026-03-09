/**
 * Génère un fichier CSV et le télécharge côté client.
 * @param filename  Nom du fichier sans extension
 * @param headers   Entêtes de colonnes
 * @param rows      Lignes de données (valeurs stringifiées automatiquement)
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): void {
  const escape = (v: string | number | boolean | null | undefined): string => {
    if (v == null) return ''
    const s = String(v)
    // Encadre de guillemets si la valeur contient virgule, guillemet ou saut de ligne
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ]

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
