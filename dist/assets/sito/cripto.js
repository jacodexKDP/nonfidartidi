
const C = globalThis.crypto, enc = new TextEncoder(), dec = new TextDecoder();
export const ITER = 120000;

export const b64 = u8 => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s); };
export const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function deriva(testo, sale, iter = ITER) {
  const base = await C.subtle.importKey('raw', enc.encode(testo), 'PBKDF2', false, ['deriveKey']);
  return C.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(sale), iterations: iter },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function chiaveGrezza(bytes) {
  return C.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
export async function cifra(chiave, dati) {
  const iv = C.getRandomValues(new Uint8Array(12));
  const buf = typeof dati === 'string' ? enc.encode(dati) : dati;
  const ct = new Uint8Array(await C.subtle.encrypt({ name: 'AES-GCM', iv }, chiave, buf));
  return b64(iv) + '.' + b64(ct);
}
export async function decifraBytes(chiave, pacco) {
  const [iv, ct] = pacco.split('.');
  return new Uint8Array(await C.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, chiave, unb64(ct)));
}
export async function decifra(chiave, pacco) { return dec.decode(await decifraBytes(chiave, pacco)); }
export async function provaDecifra(chiave, pacco) { try { return await decifraBytes(chiave, pacco); } catch { return null; } }
export const casuali = n => C.getRandomValues(new Uint8Array(n));
export async function sha256(bytes) { return new Uint8Array(await C.subtle.digest('SHA-256', bytes)); }

export async function apriCaselle(verifica, candidatiPerCampo) {
  const cache = new Map();
  const segreti = [];
  for (const casella of verifica.caselle) {
    const cand = candidatiPerCampo[casella.campo || 0] || [];
    let trovato = null;
    for (const c of cand) {
      if (!cache.has(c)) cache.set(c, deriva(c, verifica.sale, verifica.iter));
      const k = await cache.get(c);
      for (const p of casella.p) { trovato = await provaDecifra(k, p); if (trovato) break; }
      if (trovato) break;
    }
    if (!trovato) return null;
    segreti.push(trovato);
  }
  const tutto = new Uint8Array(segreti.length * 32);
  segreti.forEach((s, i) => tutto.set(s, i * 32));
  const k = await chiaveGrezza(await sha256(tutto));
  try { return await decifra(k, verifica.premio); } catch { return null; }
}
