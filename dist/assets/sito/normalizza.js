

const SEP = '\u001f';

function base(s) {
  return String(s ?? '')
    .normalize('NFKD').replace(/\p{M}/gu, '')        // accenti
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc`´]/g, "'")          // apostrofi tipografici
    .replace(/[\u2010-\u2015\u2212]/g, '-')            // trattini tipografici
    .trim();
}

export function normalizza(input, tipo, schema) {
  const s = base(input);
  let v = '';
  if (tipo === 'testo') v = s.replace(/[^a-z0-9]+/g, ' ').trim();
  else if (tipo === 'codice') v = s.replace(/[^a-z0-9]+/g, '');
  else if (tipo === 'numero') {
    const d = s.replace(/[\s.']/g, '');
    if (!/^\d+$/.test(d)) return { ok: false };
    v = String(parseInt(d, 10));
  } else if (tipo === 'ora') {
    const m = s.match(/^(\d{1,2})\s*(?::|\.|,|h|\s)?\s*(\d{2})$/);
    if (!m) return { ok: false };
    const h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return { ok: false };
    v = String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
  } else throw new Error('tipo di campo sconosciuto: ' + tipo);
  if (!v) return { ok: false };
  if (schema && !new RegExp(schema).test(v)) return { ok: false };
  return { ok: true, valore: v };
}

export function unisci(valori) { return valori.join(SEP); }

const VUOTE = new Set(('il lo la i gli le l un una uno un\' di del dello della dei degli delle dell da dal dallo dalla dai dagli dalle dall ' +
  'a al allo alla ai agli alle all ad in nel nello nella nei negli nelle nell su sul sullo sulla sui sugli sulle sull ' +
  'con col per tra fra e ed o oppure ore ora alle').split(/\s+/));

export function parole(input) {
  let s = base(input).replace(/[«»"“”„]/g, ' ').replace(/'/g, ' ');

  s = s.replace(/(^|[^0-9])(\d{1,2})\s*[:.]\s*(\d{2})(?![0-9])/g, (m, p, h, mi) =>
    (+h <= 23 && +mi <= 59) ? `${p} ${String(+h).padStart(2, '0')}:${mi} ` : m);
  s = s.replace(/(?<!\d):|:(?!\d)/g, ' ');            // i due punti fuori da un orario separano
  const t = s.split(/[^a-z0-9:]+/).filter(x => x && x !== ':');

  return t.filter((x, i) => !VUOTE.has(x) && !(x === 'r' && i > 0 && /^\d\d:\d\d$/.test(t[i - 1])));
}

export function candidati(input) {
  const p = parole(input), out = new Set();
  for (let i = 0; i < p.length; i++)
    for (let n = 1; n <= 3 && i + n <= p.length; n++) out.add(p.slice(i, i + n).join(''));
  return [...out];
}

export function chiaveParola(s) { return parole(s).join(''); }

export function normCodice(s) {
  const a = String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return a.length > 7 ? a.slice(-7) : a;
}
