
import { candidati, normCodice } from './normalizza.js';
import { deriva, decifra, apriCaselle } from './cripto.js';

const $ = (s, r = document) => r.querySelector(s);
const dati = JSON.parse($('#dati').textContent);
let modulo = null;   // contenuto decifrato della parte

const dire = (el, testo, no = false) => { if (!el) return; el.textContent = testo; el.classList.toggle('is-no', no); };
const apriSezione = el => el && el.closest('section, .hero')?.classList.add('is-aperta');

async function sblocca(codice) {
  try {
    const k = await deriva(codice, dati.accesso.sale, dati.accesso.iter);
    return JSON.parse(await decifra(k, dati.accesso.pacco));
  } catch { return null; }
}

function mostraModulo() {
  const acc = $('#accesso'); if (acc) acc.hidden = true;
  const risp = $('#risposta'); if (risp) risp.hidden = false;
  const ba = $('#b-accesso'); if (ba) ba.hidden = true;
  const br = $('#b-risposta'); if (br) br.hidden = false;
  document.querySelectorAll('[data-chiuso]').forEach(el => el.hidden = true);
  document.querySelectorAll('[data-nota]').forEach(el => el.textContent = '');
}

function apri(d) {
  const id = d.dataset.apri, nota = $(`[data-nota="${id}"]`);
  if (!d.open) return;
  if (!modulo) { d.open = false; dire(nota, `Si apre con ${dati.seManca ? dati.seManca.match(/K\d+/)[0] : 'il codice'}.`, true); $('#codice')?.focus(); return; }
  const i = id === 'sol' ? 0 : +id.slice(1);
  if (i > 1 && $(`#testo-s${i - 1}`).hidden) { d.open = false; dire(nota, `Apri prima il suggerimento ${i - 1}.`, true); return; }
  const box = $(`#testo-${id}`);
  if (box.hidden) { box.innerHTML = id === 'sol' ? modulo.soluzione : modulo.suggerimenti[i - 1]; box.hidden = false; }
  dire(nota, '');
  apriSezione(box);
}

async function verifica(e) {
  e.preventDefault();
  const stato = $('#stato-risposta');
  const campi = [...e.currentTarget.querySelectorAll('input')].map(i => i.value);
  if (campi.every(v => !v.trim())) { dire(stato, 'Scrivi la risposta nel campo.', true); return; }
  dire(stato, 'Verifica in corso…');
  const v = modulo ? modulo.verifica : dati.verifica;
  const premio = await apriCaselle(v, campi.map(candidati));
  if (!premio) { dire(stato, 'La risposta non corrisponde. Ricontrolla e riprova: i tentativi sono illimitati.', true); return; }
  dire(stato, '');
  mostraPremio(JSON.parse(premio));
}

async function mostraPremio(p) {
  if (p.ek) { try { sessionStorage.setItem('nf-ek', p.ek); } catch {} }
  if (dati.epilogo) return apriEpilogo(p.ek);
  const box = $('#esito');
  box.innerHTML = p.html; box.hidden = false;
  apriSezione(box);
  box.querySelector('h2, p')?.setAttribute('tabindex', '-1');
  box.querySelector('h2, p')?.focus();
}

async function apriEpilogo(ek) {
  try {
    const k = await deriva(ek, dati.epilogo.sale, 1);
    const html = await decifra(k, dati.epilogo.pacco);
    const box = $('#epilogo'); box.innerHTML = html; box.hidden = false; const sez = $('#testo'); if (sez) sez.hidden = false;
    const r = $('#risposta'); if (r) r.hidden = true;
    apriSezione(box);
    document.querySelectorAll('[data-chiuso]').forEach(el => el.hidden = true);
    return true;
  } catch { return false; }
}

async function init() {
  document.querySelectorAll('details[data-apri]').forEach(d => d.addEventListener('toggle', () => apri(d)));
  $('#risposta')?.addEventListener('submit', verifica);
  $('#accesso')?.addEventListener('submit', async e => {
    e.preventDefault();
    const stato = $('#stato-accesso');
    const c = normCodice($('#codice').value);
    if (!c) { dire(stato, 'Scrivi il codice di sette caratteri.', true); return; }
    dire(stato, 'Verifica in corso…');
    const m = await sblocca(c);
    if (!m) { dire(stato, `Codice non riconosciuto. ${dati.seManca}`, true); return; }
    modulo = m; dire(stato, ''); mostraModulo(); $('#r1')?.focus();
  });
  if (dati.accesso?.libero) { modulo = await sblocca(dati.accesso.libero); mostraModulo(); }
  if (dati.epilogo) { let ek = null; try { ek = sessionStorage.getItem('nf-ek'); } catch {} if (ek) await apriEpilogo(ek); }
}
init();
