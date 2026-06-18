import type { Booking } from '../types'

// Formate un prix en EUR avec séparateurs français
function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

// Formate une date ISO en date lisible
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

// Génère un numéro de facture lisible à partir de l'ID et de l'année de création
function invoiceNumber(booking: Booking): string {
  const year = new Date(booking.createdAt).getFullYear()
  return `SAIL-${year}-${String(booking.id).padStart(5, '0')}`
}

/**
 * Génère une facture HTML dans un nouvel onglet et déclenche l'impression navigateur.
 * L'utilisateur peut enregistrer en PDF via "Imprimer → Enregistrer en PDF".
 * Aucune dépendance externe nécessaire.
 */
export function generateInvoice(booking: Booking, renterName: string): void {
  const invoiceNo   = invoiceNumber(booking)
  const invoiceDate = fmtDate(booking.createdAt)
  const boat        = booking.boat
  const boatLabel   = boat?.title ?? `Bateau #${booking.boatId}`
  const portLabel   = [boat?.port, boat?.city].filter(Boolean).join(', ') || '-'
  const statusLabel = booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
    ? 'Payée'
    : 'En attente'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture ${invoiceNo} - SailingLoc</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      padding: 48px 56px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* ─── Header ─── */
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 28px;
      border-bottom: 2px solid #0e4d7b;
      margin-bottom: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      width: 38px;
      height: 38px;
      background: #0e4d7b;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
    }
    .brand-name {
      font-size: 22px;
      font-weight: 700;
      color: #0e4d7b;
      letter-spacing: -0.5px;
    }
    .invoice-meta { text-align: right; }
    .invoice-title {
      font-size: 26px;
      font-weight: 800;
      color: #0e4d7b;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .invoice-number {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-date {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* ─── Status badge ─── */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 6px;
      background: #dcfce7;
      color: #166534;
    }

    /* ─── Parties ─── */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 28px;
    }
    .party-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .party-detail {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    /* ─── Booking info ─── */
    .booking-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .info-block { }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a2e;
    }

    /* ─── Table ─── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead tr {
      background: #0e4d7b;
      color: #fff;
    }
    thead th {
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    thead th:last-child { text-align: right; }
    tbody tr {
      border-bottom: 1px solid #f1f5f9;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody td {
      padding: 11px 14px;
      font-size: 13px;
      color: #334155;
    }
    tbody td:last-child {
      text-align: right;
      font-weight: 500;
      color: #1a1a2e;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }

    /* ─── Totals ─── */
    .totals {
      margin-left: auto;
      width: 260px;
      margin-bottom: 32px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #64748b;
      border-bottom: 1px solid #f1f5f9;
    }
    .total-row.grand {
      border-top: 2px solid #0e4d7b;
      border-bottom: none;
      padding-top: 10px;
      margin-top: 4px;
      font-size: 15px;
      font-weight: 700;
      color: #0e4d7b;
    }
    .total-row.deposit {
      color: #94a3b8;
      font-style: italic;
      font-size: 12px;
    }

    /* ─── Footer ─── */
    footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 18px;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
      text-align: center;
    }

    /* ─── Print ─── */
    @media print {
      body { padding: 24px 32px; }
      @page { margin: 0; size: A4; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <header>
    <div class="brand">
      <div class="brand-icon">⚓</div>
      <span class="brand-name">SailingLoc</span>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">FACTURE</div>
      <div class="invoice-number">${invoiceNo}</div>
      <div class="invoice-date">Émise le ${invoiceDate}</div>
      <div><span class="status-badge">${statusLabel}</span></div>
    </div>
  </header>

  <!-- Parties -->
  <div class="parties">
    <div>
      <div class="party-label">Émetteur</div>
      <div class="party-name">SailingLoc</div>
      <div class="party-detail">Projet étudiant DSP4 O24</div>
      <div class="party-detail">contact@sailingloc.fr</div>
    </div>
    <div>
      <div class="party-label">Client</div>
      <div class="party-name">${renterName}</div>
      <div class="party-detail">Réservation n° ${invoiceNo}</div>
    </div>
  </div>

  <!-- Booking info -->
  <div class="booking-info">
    <div class="info-block">
      <div class="info-label">Bateau</div>
      <div class="info-value">${boatLabel}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Port de départ</div>
      <div class="info-value">${portLabel}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Durée</div>
      <div class="info-value">${booking.totalDays} jour${booking.totalDays > 1 ? 's' : ''}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Arrivée</div>
      <div class="info-value">${fmtDate(booking.startDate)}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Départ</div>
      <div class="info-value">${fmtDate(booking.endDate)}</div>
    </div>
    <div class="info-block">
      <div class="info-label">Skipper inclus</div>
      <div class="info-value">${booking.withSkipper ? 'Oui' : 'Non'}</div>
    </div>
  </div>

  <!-- Line items -->
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qté</th>
        <th>P.U.</th>
        <th>Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Location du bateau - ${boatLabel}</td>
        <td>${booking.totalDays} j.</td>
        <td>${fmt(booking.dailyRate)} / j.</td>
        <td>${fmt(booking.subtotal ?? 0)}</td>
      </tr>
      ${booking.withSkipper ? `
      <tr>
        <td>Services du skipper</td>
        <td>-</td>
        <td>-</td>
        <td>inclus</td>
      </tr>` : ''}
      <tr>
        <td>Frais de service SailingLoc</td>
        <td>-</td>
        <td>-</td>
        <td>${fmt(booking.platformFee ?? 0)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row">
      <span>Sous-total</span>
      <span>${fmt(booking.subtotal ?? 0)}</span>
    </div>
    <div class="total-row">
      <span>Frais de service</span>
      <span>${fmt(booking.platformFee ?? 0)}</span>
    </div>
    <div class="total-row deposit">
      <span>Caution (remboursée à la fin)</span>
      <span>${fmt(booking.depositAmount ?? 0)}</span>
    </div>
    <div class="total-row grand">
      <span>Total TTC</span>
      <span>${fmt(booking.totalAmount ?? 0)}</span>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <p>SailingLoc - Projet étudiant DSP4 O24 - Aucune transaction réelle</p>
    <p style="margin-top:4px">
      Cette facture est générée automatiquement et ne constitue pas un document comptable officiel.
    </p>
  </footer>

  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

  // Ouvre la facture dans un nouvel onglet et déclenche l'impression
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert("Veuillez autoriser les pop-ups pour télécharger la facture.")
    return
  }
  win.document.write(html)
  win.document.close()
}
