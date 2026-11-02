/* Paketlager – reine Logik (ohne DOM), im Browser als window.PS und in Node per require() nutzbar. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CARRIER_IDS = ['DPD', 'GLS', 'JT'];
  const CARRIER_META = {
    DPD: { label: 'DPD', color: '#dc0032' },
    GLS: { label: 'GLS', color: '#1d3f94' },
    JT: { label: 'J&T Express', color: '#e8590c' },
  };
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const pad = (n, l = 2) => String(n).padStart(l, '0');

  /* ---------- Sendungsnummern ---------- */
  function normalizeTracking(s) {
    return String(s == null ? '' : s).replace(/\s+/g, '').toUpperCase();
  }

  // Nur ein Vorschlag – der Benutzer kann den Anbieter immer ändern.
  function detectCarrier(raw) {
    const t = normalizeTracking(raw);
    if (/^(JT|JMX)[A-Z0-9]{8,}$/.test(t)) return 'JT';
    if (/^\d{14}$/.test(t)) return 'DPD';
    if (/^\d{11,12}$/.test(t)) return 'GLS';
    return null;
  }

  /* ---------- Datum ---------- */
  function toDate(x) { return x instanceof Date ? x : new Date(x); }
  function monthKey(x) { const d = toDate(x); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function inMonth(iso, key) { return !!iso && monthKey(iso) === key; }
  function monthLabel(key) { const [y, m] = key.split('-').map(Number); return MONTHS[m - 1] + ' ' + y; }
  function shiftMonth(key, delta) {
    const [y, m] = key.split('-').map(Number);
    return monthKey(new Date(y, m - 1 + delta, 1));
  }
  function monthPeriod(key) {
    const [y, m] = key.split('-').map(Number);
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0) };
  }
  function fmtDate(x) { if (!x) return ''; const d = toDate(x); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function fmtDateTime(x) { if (!x) return ''; const d = toDate(x); return fmtDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dayStart(x) { const d = toDate(x); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysSince(iso, now) { return Math.round((dayStart(now) - dayStart(iso)) / 86400000); }
  function addDays(x, n) { const d = new Date(toDate(x)); d.setDate(d.getDate() + n); return d; }

  /* ---------- Geld (alles in Cent) ---------- */
  function fmtEUR(cents) {
    const neg = cents < 0; const a = Math.abs(Math.round(cents));
    const eur = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + eur + ',' + pad(a % 100) + ' €';
  }
  function parseNum(s) {
    const n = parseFloat(String(s == null ? '' : s).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  /* ---------- Pakete ---------- */
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function createParcel(f, nowIso) {
    return {
      id: newId(),
      carrier: f.carrier,
      type: f.type === 'retoure' ? 'retoure' : 'paket',
      tracking: normalizeTracking(f.tracking),
      name: String(f.name || '').trim(),
      phone: String(f.phone || '').trim(),
      shelf: String(f.shelf || '').trim().toUpperCase(),
      note: String(f.note || '').trim(),
      status: 'im_lager', // im_lager | ausgegeben | uebergeben
      receivedAt: nowIso,
      pickedUpAt: null,
      pickedUpBy: '',
      idChecked: false,
      handedOverAt: null,
    };
  }

  function markPickedUp(p, by, idChecked, nowIso) {
    p.status = 'ausgegeben'; p.pickedUpAt = nowIso; p.pickedUpBy = String(by || '').trim(); p.idChecked = !!idChecked; p.handedOverAt = null;
  }
  function markHandedOver(p, nowIso) {
    p.status = 'uebergeben'; p.handedOverAt = nowIso; p.pickedUpAt = null; p.pickedUpBy = ''; p.idChecked = false;
  }
  function restore(p) {
    p.status = 'im_lager'; p.pickedUpAt = null; p.pickedUpBy = ''; p.idChecked = false; p.handedOverAt = null;
  }

  function statusLabel(p) {
    if (p.status === 'ausgegeben') return 'Ausgegeben';
    if (p.status === 'uebergeben') return p.type === 'retoure' ? 'An Fahrer übergeben' : 'Zurück an Anbieter';
    return 'Im Lager';
  }
  function typeLabel(p) { return p.type === 'retoure' ? 'Retoure' : 'Paket'; }

  function isOverdue(p, now, storageDays) {
    return p.status === 'im_lager' && p.type !== 'retoure' && daysSince(p.receivedAt, now) > storageDays;
  }

  /* ---------- Suche & Filter ---------- */
  function filterParcels(parcels, f, now, storageDays) {
    const tokens = String(f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    const out = parcels.filter(p => {
      if (f.carrier && p.carrier !== f.carrier) return false;
      if (f.type && p.type !== f.type) return false;
      if (f.status === 'ueberfaellig') { if (!isOverdue(p, now, storageDays)) return false; }
      else if (f.status && p.status !== f.status) return false;
      if (!tokens.length) return true;
      const trk = p.tracking.toLowerCase();
      const hay = [trk, p.name, p.shelf, p.phone, p.note, CARRIER_META[p.carrier] ? CARRIER_META[p.carrier].label : ''].join(' ').toLowerCase();
      return tokens.every(t => hay.includes(t) || (t.length >= 10 && trk.length >= 8 && t.includes(trk))); // Barcode mit Präfix
    });
    const dir = f.status === 'ueberfaellig' ? 1 : -1;
    out.sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : 0) * dir);
    return out;
  }

  /* ---------- Statistik ---------- */
  function monthStats(parcels, key, now, storageDays) {
    const out = {};
    CARRIER_IDS.forEach(id => { out[id] = { paket: 0, retoure: 0, ausgegeben: 0, uebergeben: 0, imLager: 0, ueberfaellig: 0 }; });
    for (const p of parcels) {
      const s = out[p.carrier]; if (!s) continue;
      if (inMonth(p.receivedAt, key)) { if (p.type === 'retoure') s.retoure++; else s.paket++; }
      if (inMonth(p.pickedUpAt, key)) s.ausgegeben++;
      if (inMonth(p.handedOverAt, key)) s.uebergeben++;
      if (p.status === 'im_lager') { s.imLager++; if (isOverdue(p, now, storageDays)) s.ueberfaellig++; }
    }
    return out;
  }

  /* ---------- Rechnung ---------- */
  function calcInvoice(parcels, key, carrierId, settings) {
    const c = settings.carriers[carrierId];
    const mine = parcels.filter(p => p.carrier === carrierId && inMonth(p.receivedAt, key));
    const pk = mine.filter(p => p.type !== 'retoure');
    const rt = mine.filter(p => p.type === 'retoure');
    const lines = [];
    const mk = (label, qty, unit) => ({ label, qty, unit, netCents: Math.round(qty * unit * 100 + 1e-7) });
    if (pk.length) lines.push(mk('Paketannahme und -ausgabe', pk.length, c.ratePaket));
    if (rt.length) lines.push(mk('Retourenannahme', rt.length, c.rateRetoure));
    const netCents = lines.reduce((s, l) => s + l.netCents, 0);
    const vatRate = settings.vat.kleinunternehmer ? 0 : settings.vat.rate;
    const vatCents = Math.round(netCents * vatRate / 100);
    return {
      carrier: carrierId, month: key, lines, netCents, vatRate, vatCents, grossCents: netCents + vatCents,
      count: mine.length, paketCount: pk.length, retoureCount: rt.length,
      parcels: mine.slice().sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1))
        .map(p => ({ tracking: p.tracking, date: p.receivedAt, type: p.type })),
    };
  }

  function nextInvoiceNumber(invoices, year) {
    const re = new RegExp('^RE-' + year + '-(\\d+)$');
    let max = 0;
    for (const i of invoices) { const m = re.exec(i.number); if (m) max = Math.max(max, parseInt(m[1], 10)); }
    return 'RE-' + year + '-' + pad(max + 1, 4);
  }
  function findInvoice(invoices, carrierId, key) {
    return invoices.find(i => i.carrier === carrierId && i.month === key) || null;
  }

  /* ---------- CSV (Excel-DE: Semikolon, BOM) ---------- */
  function toCSV(rows) {
    const q = v => { const s = String(v == null ? '' : v); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + rows.map(r => r.map(q).join(';')).join('\r\n') + '\r\n';
  }

  /* ---------- Zustand / Einstellungen ---------- */
  function defaultSettings() {
    const carrier = name => ({ company: name, address: '', customerNo: '', ratePaket: 0, rateRetoure: 0 });
    return {
      shop: { name: 'D-Group Storage & Shipping', owner: '', street: '', zip: '', city: '', phone: '', email: '', taxNo: '', vatId: '', bank: '', iban: '', bic: '' },
      vat: { rate: 19, kleinunternehmer: false },
      paymentDays: 14,
      storageDays: 7,
      carriers: { DPD: carrier('DPD Deutschland GmbH'), GLS: carrier('GLS Germany GmbH & Co. OHG'), JT: carrier('J&T Express Germany GmbH') },
    };
  }
  function emptyState() {
    return { version: 1, settings: defaultSettings(), parcels: [], invoices: [], meta: { lastBackupAt: null } };
  }
  function deepMerge(base, over) {
    if (over === undefined || over === null) return base;
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    if (!isObj(base)) return typeof over === typeof base ? over : base;
    if (!isObj(over)) return base;
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
    return out;
  }
  // Prüft/ergänzt geladene oder importierte Daten. Wirft einen Error mit deutscher Meldung bei Unsinn.
  function normalizeState(obj) {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.parcels)) throw new Error('Das ist keine gültige Paketlager-Datei.');
    const base = emptyState();
    const ok = v => typeof v === 'string';
    const parcels = obj.parcels.filter(p => p && ok(p.id) && CARRIER_IDS.includes(p.carrier) && ok(p.tracking) && ok(p.receivedAt) && !isNaN(new Date(p.receivedAt)))
      .map(p => ({
        id: p.id, carrier: p.carrier, type: p.type === 'retoure' ? 'retoure' : 'paket', tracking: normalizeTracking(p.tracking),
        name: ok(p.name) ? p.name : '', phone: ok(p.phone) ? p.phone : '', shelf: ok(p.shelf) ? p.shelf : '', note: ok(p.note) ? p.note : '',
        status: ['im_lager', 'ausgegeben', 'uebergeben'].includes(p.status) ? p.status : 'im_lager',
        receivedAt: p.receivedAt, pickedUpAt: p.pickedUpAt || null, pickedUpBy: ok(p.pickedUpBy) ? p.pickedUpBy : '',
        idChecked: !!p.idChecked, handedOverAt: p.handedOverAt || null,
      }));
    const invoices = Array.isArray(obj.invoices) ? obj.invoices.filter(i => i && ok(i.number) && CARRIER_IDS.includes(i.carrier) && ok(i.month)) : [];
    return {
      version: 1,
      settings: deepMerge(base.settings, obj.settings),
      parcels, invoices,
      meta: deepMerge(base.meta, obj.meta),
    };
  }

  /* ---------- Beispieldaten ---------- */
  function makeDemoData(now) {
    let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = a => a[Math.floor(rnd() * a.length)];
    const first = ['Anna', 'Mehmet', 'Lukas', 'Fatima', 'Jonas', 'Sara', 'Omar', 'Lea', 'Yusuf', 'Mia', 'Karim', 'Nora'];
    const last = ['Schmidt', 'Yılmaz', 'Müller', 'Haddad', 'Weber', 'Kaya', 'Fischer', 'Nasser', 'Wagner', 'Demir', 'Becker', 'Ali'];
    const digits = n => Array.from({ length: n }, () => Math.floor(rnd() * 10)).join('');
    const mkTrk = c => c === 'DPD' ? digits(14) : c === 'GLS' ? digits(11) : 'JT' + digits(12);
    const parcels = [];
    for (let i = 0; i < 70; i++) {
      const carrier = pick(['DPD', 'DPD', 'GLS', 'GLS', 'JT']);
      const type = rnd() < 0.18 ? 'retoure' : 'paket';
      const age = Math.floor(rnd() * 45); // Tage zurück
      let d = new Date(now); d.setDate(d.getDate() - age); d.setHours(8 + Math.floor(rnd() * 10), Math.floor(rnd() * 60), 0, 0);
      if (d > now) d = new Date(now);
      const p = createParcel({ carrier, type, tracking: mkTrk(carrier), name: pick(first) + ' ' + pick(last), shelf: pick(['A', 'B', 'C']) + (1 + Math.floor(rnd() * 6)) }, d.toISOString());
      const done = new Date(d); done.setDate(done.getDate() + 1 + Math.floor(rnd() * 5));
      if (done < now) {
        if (type === 'retoure') markHandedOver(p, done.toISOString());
        else if (rnd() < 0.85) markPickedUp(p, p.name, true, done.toISOString());
        else if (age > 20) markHandedOver(p, done.toISOString());
      }
      parcels.push(p);
    }
    return parcels;
  }

  return {
    CARRIER_IDS, CARRIER_META, MONTHS,
    normalizeTracking, detectCarrier,
    monthKey, inMonth, monthLabel, shiftMonth, monthPeriod, fmtDate, fmtDateTime, daysSince, addDays, dayStart,
    fmtEUR, parseNum,
    newId, createParcel, markPickedUp, markHandedOver, restore, statusLabel, typeLabel, isOverdue,
    filterParcels, monthStats, calcInvoice, nextInvoiceNumber, findInvoice, toCSV,
    defaultSettings, emptyState, normalizeState, makeDemoData,
  };
});
