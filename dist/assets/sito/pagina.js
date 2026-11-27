
import { candidati } from './normalizza.js';
import { deriva, decifra, apriCaselle } from './cripto.js';

const $ = (s, r = document) => r.querySelector(s);
const dati = JSON.parse($('#dati').textContent);
let contenuto = null;   // aiuti, soluzione, risposta attesa (parti aperte), decifrati all'avvio

const dire = (el, testo, no = false) => { if (!el) return; el.textContent = testo; el.classList.toggle('is-no', no); };
const apriSezione = el => el && el.closest('section, .hero')?.classList.add('is-aperta');

const tieniChiave = (ek, via) => { if (ek) { try { sessionStorage.setItem('nf-ek', ek); if (via === 'risposta' || !sessionStorage.getItem('nf-via')) sessionStorage.setItem('nf-via', via); } catch {} } };

async function apriContenuto() {
  if (!dati.pagina) return null;
  try { return JSON.parse(await decifra(await deriva(dati.pagina.chiave, dati.pagina.sale, dati.pagina.iter), dati.pagina.pacco)); }
  catch { return null; }
}

function apriAiuto(d) {
  const id = d.dataset.apri, nota = $(`[data-nota="${id}"]`);
  if (!d.open) return;
  const i = +id.slice(1);
  if (!contenuto) { d.open = false; dire(nota, 'La pagina non si è caricata del tutto: ricaricala.', true); return; }
  if (i > 1 && $(`#testo-s${i - 1}`).hidden) { d.open = false; dire(nota, `Apri prima l’aiuto ${i - 1}.`, true); return; }
  const box = $(`#testo-${id}`);
  if (box.hidden) { box.innerHTML = contenuto.aiuti[i - 1]; box.hidden = false; }
  dire(nota, '');
  apriSezione(box);
}

function apriSoluzione() {
  if (!contenuto) return;
  const box = $('#testo-sol'), b = $('#b-soluzione');
  box.innerHTML = contenuto.soluzione; box.hidden = false;
  tieniChiave(contenuto.ek, 'soluzione');
  b.setAttribute('aria-expanded', 'true'); b.hidden = true;
  apriSezione(box);
  box.setAttribute('tabindex', '-1'); box.focus();
}

function mostra(html) {
  const box = $('#esito');
  box.innerHTML = html; box.hidden = false;
  apriSezione(box);
  const primo = box.querySelector('h2, p'); primo?.setAttribute('tabindex', '-1'); primo?.focus();
}

async function confronta(e) {
  e.preventDefault();
  const stato = $('#stato-risposta');
  const campi = [...e.currentTarget.querySelectorAll('input, textarea')].map(i => i.value);
  const doppio = campi.length === 2;
  if (campi.every(v => !v.trim())) { dire(stato, doppio ? 'Scrivi il nome e l’ora R.' : 'Scrivi la tua risposta nel campo.', true); return; }
  if (doppio && campi.some(v => !v.trim())) { dire(stato, 'Servono tutti e due: il nome e l’ora R.', true); return; }
  if (dati.finale) return apriFinaleDaRisposta(campi, stato);
  if (dati.tipo === 'aperta') {
    if (!contenuto) { dire(stato, 'La pagina non si è caricata del tutto: ricaricala.', true); return; }
    dire(stato, ''); mostra(contenuto.confronto); return;
  }
  dire(stato, 'Controllo in corso…');
  const premio = await apriCaselle(dati.verifica, campi.map(candidati));
  if (!premio) {
    dire(stato, doppio ? 'Nome e ora R non sono giusti tutti e due. Ricontrolla le carte e riprova: i tentativi sono illimitati.'
      : 'La risposta non corrisponde. Ricontrolla e riprova: i tentativi sono illimitati.', true);
    return;
  }
  dire(stato, '');
  const p = JSON.parse(premio);
  tieniChiave(p.ek, 'risposta');
  mostra(p.html);
}

async function apriFinale(ek, via = 'risposta') {
  try {
    const html = await decifra(await deriva(ek, dati.finale.sale, 1), dati.finale.pacco);
    const box = $('#epilogo'); box.innerHTML = html; box.hidden = false; const sez = $('#testo'); if (sez) sez.hidden = false;
    const r = $('#risposta'); if (r) r.hidden = true;
    const b = $('#b-risposta'); if (b) b.hidden = true;
    document.querySelectorAll('[data-chiuso]').forEach(el => el.hidden = true);
    document.querySelectorAll('[data-aperto]').forEach(el => el.hidden = !['sempre', via].includes(el.dataset.aperto));
    const st = $('[data-stato]'); if (st) st.textContent = 'Aperto';
    apriSezione(box);
    return true;
  } catch { return false; }
}
async function apriFinaleDaRisposta(campi, stato) {
  dire(stato, 'Controllo in corso…');
  const premio = await apriCaselle(dati.verifica, campi.map(candidati));
  if (!premio) { dire(stato, 'Nome e ora R non sono giusti tutti e due. Ricontrolla le carte e riprova: i tentativi sono illimitati.', true); return; }
  const { ek } = JSON.parse(premio); tieniChiave(ek, 'risposta'); dire(stato, '');
  await apriFinale(ek, 'risposta');
  $('#epilogo')?.setAttribute('tabindex', '-1'); $('#epilogo')?.focus();
}

async function init() {
  $('#risposta')?.addEventListener('submit', confronta);
  if (dati.finale) { let ek = null, via = null; try { ek = sessionStorage.getItem('nf-ek'); via = sessionStorage.getItem('nf-via'); } catch {} if (ek) await apriFinale(ek, via || 'soluzione'); return; }
  contenuto = await apriContenuto();
  document.querySelectorAll('details[data-apri]').forEach(d => d.addEventListener('toggle', () => apriAiuto(d)));
  $('#b-soluzione')?.addEventListener('click', apriSoluzione);
  document.documentElement.dataset.pronta = '1';
}
init();
