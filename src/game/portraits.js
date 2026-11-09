// Scherenschnitt-Porträts (Silhouetten im Profil) als SVG – passend zur Zeit um 1890
const HATS = {
  deerstalker: '<path d="M29 37 Q31 16 50 15 Q69 16 71 37 L83 41 Q78 44 71 42 L29 42 Q22 44 17 41 Z"/><rect x="40" y="12" width="20" height="5" rx="2"/>',
  tophat: '<rect x="33" y="3" width="34" height="31" rx="2"/><path d="M22 34 Q50 29 78 34 L78 38 Q50 34 22 38 Z"/>',
  bowler: '<path d="M31 35 Q32 11 50 11 Q68 11 69 35 Z"/><path d="M21 34 Q50 30 79 34 L79 38 Q50 35 21 38 Z"/>',
  pickelhaube: '<path d="M30 38 Q30 15 50 14 Q70 15 70 38 Z"/><path d="M46 15 L50 0 L54 15 Z"/><path d="M64 34 L82 39 L68 41 Z"/><rect x="45" y="13" width="10" height="4"/>',
  cap: '<path d="M29 34 Q33 17 52 17 Q70 18 72 30 L86 34 Q80 37 72 36 L29 37 Z"/>',
  bonnet: '<path d="M24 58 Q18 20 48 16 Q68 17 71 32 Q60 26 46 30 Q32 36 32 58 Z"/>',
  coachman: '<rect x="34" y="6" width="32" height="28" rx="2"/><path d="M22 34 Q50 29 78 34 L78 38 Q50 34 22 38 Z"/>',
};

export function portraitSVG(p = {}) {
  const fg = '#1d1510';
  let body = '';
  // Büste / Kleidung
  if (p.cape) body += '<path d="M6 120 Q8 86 34 78 L66 78 Q92 86 94 120 Z"/><path d="M14 100 Q26 82 50 82 Q74 82 86 100 Z"/>';
  else if (p.dress) body += '<path d="M12 120 Q14 88 40 80 L60 80 Q86 88 88 120 Z"/>';
  else body += '<path d="M10 120 Q12 87 40 79 L60 79 Q88 87 90 120 Z"/>';
  // Hals und Kopf (Profil nach rechts)
  body += '<rect x="42" y="62" width="16" height="22"/>';
  body += '<path d="M33 40 Q34 24 52 24 Q66 25 68 38 Q69 44 71 48 L76 56 Q74 58 70 58 Q71 62 69 64 Q70 68 66 71 Q60 74 54 72 Q44 72 38 64 Q31 55 33 40 Z"/>';
  if (p.hair === 'bun') body += '<circle cx="31" cy="44" r="10"/>';
  if (p.hair === 'long') body += '<path d="M33 40 Q26 56 30 76 L40 74 Q36 58 38 44 Z"/>';
  if (p.mustache === 'walrus') body += '<path d="M62 62 Q72 61 74 67 Q66 68 60 66 Z"/>';
  if (p.mustache === 'kaiser') body += '<path d="M62 62 Q70 62 76 56 Q76 62 70 65 Q65 66 61 65 Z"/>';
  if (p.beard === 'full') body += '<path d="M52 64 Q72 64 68 80 Q58 86 48 76 Z"/>';
  if (p.beard === 'chops') body += '<path d="M44 52 Q52 58 54 70 Q46 70 42 62 Z"/>';
  if (p.pipe) body += '<path d="M66 66 L84 72 L84 66 L90 66 L90 78 Q84 80 82 75 L66 69 Z"/>';
  if (p.cigar) body += '<rect x="66" y="64" width="16" height="4" rx="2" transform="rotate(12 66 64)"/>';
  if (p.hat && HATS[p.hat]) body += HATS[p.hat];
  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><clipPath id="cl"><ellipse cx="50" cy="60" rx="45" ry="56"/></clipPath>
<radialGradient id="pg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#f4ead3"/><stop offset="1" stop-color="#d9c7a2"/></radialGradient></defs>
<ellipse cx="50" cy="60" rx="47" ry="58" fill="#7c5f35"/>
<ellipse cx="50" cy="60" rx="45" ry="56" fill="url(#pg)"/>
<g clip-path="url(#cl)" fill="${fg}">${body}</g>
<ellipse cx="50" cy="60" rx="45" ry="56" fill="none" stroke="#b08d57" stroke-width="2"/>
</svg>`;
}
