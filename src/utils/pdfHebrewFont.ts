import type { jsPDF } from 'jspdf'

let cachedFontBase64: string | null = null

/**
 * Register the app's Hebrew font (Reisinger Yonatan) with a jsPDF instance.
 * Fetches the TTF from public/fonts/ on first call, caches for subsequent calls.
 * Must be called BEFORE any text rendering or autoTable.
 *
 * jsPDF font registration (addFont/setFont) persists across all pages in the
 * same doc instance, so week PDF pages 2-6 automatically inherit the font.
 */
export async function registerHebrewFont(doc: jsPDF): Promise<void> {
  if (!cachedFontBase64) {
    const response = await fetch('/fonts/Reisinger-Yonatan-web/Reisinger-Yonatan-Regular.ttf')
    if (!response.ok) {
      throw new Error(`Failed to fetch Hebrew font: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()

    // Convert ArrayBuffer to base64 string for jsPDF
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    cachedFontBase64 = btoa(binary)
  }

  // Register font with jsPDF virtual file system
  doc.addFileToVFS('ReisingerYonatan.ttf', cachedFontBase64)
  doc.addFont('ReisingerYonatan.ttf', 'ReisingerYonatan', 'normal')
  doc.setFont('ReisingerYonatan')
}
