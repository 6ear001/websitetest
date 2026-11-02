// Ausführen mit:  node tests/logic.test.js
const assert = require('assert');
const PS = require('../js/logic.js');

let n = 0;
function test(name, fn) { fn(); n++; console.log('ok -', name); }
const D = (y, m, d, h = 12) => new Date(y, m - 1, d, h).toISOString();
const mk = (o) => ({ ...PS.createParcel({ carrier: 'DPD', tracking: '12345678901234', name: 'Anna Schmidt', shelf: 'a1' }, D(2026, 11, 2)), ...o });

test('Anbieter-Erkennung', () => {
  assert.strictEqual(PS.detectCarrier('12345678901234'), 'DPD');
  assert.strictEqual(PS.detectCarrier(' 1234 5678 901 '), 'GLS');
  assert.strictEqual(PS.detectCarrier('jt0123456789012'), 'JT');
  assert.strictEqual(PS.detectCarrier('ABC'), null);
});

test('Monatsschlüssel & Label', () => {
  assert.strictEqual(PS.monthKey(new Date(2026, 10, 30, 23, 59)), '2026-11');
  assert.strictEqual(PS.shiftMonth('2026-01', -1), '2025-12');
  assert.strictEqual(PS.monthLabel('2026-03'), 'März 2026');
  assert.strictEqual(PS.fmtDate(new Date(2026, 0, 5)), '05.01.2026');
});

test('Geld formatieren & parsen', () => {
  assert.strictEqual(PS.fmtEUR(123456), '1.234,56 €');
  assert.strictEqual(PS.fmtEUR(5), '0,05 €');
  assert.strictEqual(PS.parseNum('0,25'), 0.25);
  assert.strictEqual(PS.parseNum('abc'), 0);
});

test('Paket-Lebenszyklus', () => {
  const p = mk({});
  assert.strictEqual(p.shelf, 'A1');
  PS.markPickedUp(p, 'Anna', true, D(2026, 11, 3));
  assert.strictEqual(p.status, 'ausgegeben');
  assert.strictEqual(PS.statusLabel(p), 'Ausgegeben');
  PS.restore(p);
  assert.strictEqual(p.status, 'im_lager');
  assert.strictEqual(p.pickedUpAt, null);
  PS.markHandedOver(p, D(2026, 11, 4));
  assert.strictEqual(PS.statusLabel(p), 'Zurück an Anbieter');
  const r = mk({ type: 'retoure' }); PS.markHandedOver(r, D(2026, 11, 4));
  assert.strictEqual(PS.statusLabel(r), 'An Fahrer übergeben');
});

test('Überfällig nur für Pakete im Lager', () => {
  const now = new Date(2026, 10, 20, 12);
  assert.ok(PS.isOverdue(mk({ receivedAt: D(2026, 11, 2) }), now, 7));
  assert.ok(!PS.isOverdue(mk({ receivedAt: D(2026, 11, 14) }), now, 7)); // genau 6 Tage
  assert.ok(!PS.isOverdue(mk({ receivedAt: D(2026, 11, 2), type: 'retoure' }), now, 7));
  assert.ok(!PS.isOverdue(mk({ receivedAt: D(2026, 11, 2), status: 'ausgegeben' }), now, 7));
});

test('Suche: Teilnummer, Name, Regal, Barcode mit Präfix', () => {
  const now = new Date(2026, 10, 20);
  const a = mk({ id: 'a', tracking: '12345678901234', name: 'Anna Schmidt', shelf: 'A1' });
  const b = mk({ id: 'b', carrier: 'GLS', tracking: '98765432101', name: 'Omar Haddad', shelf: 'B4' });
  const all = [a, b];
  const f = q => PS.filterParcels(all, { q }, now, 7).map(p => p.id);
  assert.deepStrictEqual(f('1234'), ['a']);
  assert.deepStrictEqual(f('01234'), ['a']);
  assert.deepStrictEqual(f('haddad'), ['b']);
  assert.deepStrictEqual(f('b4'), ['b']);
  assert.deepStrictEqual(f('gls'), ['b']);
  assert.deepStrictEqual(f('anna a1'), ['a']);
  assert.deepStrictEqual(f('0000000' + '12345678901234' + '276'), ['a']); // 24-stelliger Scan enthält gespeicherte Nr.
  assert.deepStrictEqual(f('zzz'), []);
  assert.strictEqual(PS.filterParcels(all, { status: 'ausgegeben' }, now, 7).length, 0);
  assert.strictEqual(PS.filterParcels(all, { carrier: 'DPD' }, now, 7).length, 1);
});

test('Monatsstatistik', () => {
  const now = new Date(2026, 10, 20);
  const ps = [
    mk({ id: '1', receivedAt: D(2026, 11, 2) }),
    mk({ id: '2', receivedAt: D(2026, 11, 3), status: 'ausgegeben', pickedUpAt: D(2026, 11, 4) }),
    mk({ id: '3', receivedAt: D(2026, 10, 30), status: 'ausgegeben', pickedUpAt: D(2026, 11, 1) }),
    mk({ id: '4', receivedAt: D(2026, 11, 5), type: 'retoure', status: 'uebergeben', handedOverAt: D(2026, 11, 6) }),
    mk({ id: '5', carrier: 'GLS', receivedAt: D(2026, 11, 5) }),
  ];
  const s = PS.monthStats(ps, '2026-11', now, 7);
  assert.strictEqual(s.DPD.paket, 2);
  assert.strictEqual(s.DPD.retoure, 1);
  assert.strictEqual(s.DPD.ausgegeben, 2);
  assert.strictEqual(s.DPD.uebergeben, 1);
  assert.strictEqual(s.DPD.imLager, 1);
  assert.strictEqual(s.DPD.ueberfaellig, 1);
  assert.strictEqual(s.GLS.paket, 1);
  assert.strictEqual(s.JT.paket, 0);
});

test('Rechnung berechnen (Cent-genau, MwSt, Kleinunternehmer)', () => {
  const st = PS.emptyState(); st.settings.carriers.DPD.ratePaket = 0.37; st.settings.carriers.DPD.rateRetoure = 0.2;
  const ps = [];
  for (let i = 0; i < 3; i++) ps.push(mk({ id: 'p' + i, receivedAt: D(2026, 11, 2 + i), tracking: 'T' + i }));
  ps.push(mk({ id: 'r', type: 'retoure', receivedAt: D(2026, 11, 9), tracking: 'R' }));
  ps.push(mk({ id: 'old', receivedAt: D(2026, 10, 9) }));
  ps.push(mk({ id: 'other', carrier: 'GLS', receivedAt: D(2026, 11, 9) }));
  const inv = PS.calcInvoice(ps, '2026-11', 'DPD', st.settings);
  assert.strictEqual(inv.count, 4);
  assert.strictEqual(inv.lines[0].netCents, 111);   // 3 × 0,37
  assert.strictEqual(inv.lines[1].netCents, 20);
  assert.strictEqual(inv.netCents, 131);
  assert.strictEqual(inv.vatCents, 25);             // 19 % von 1,31 = 0,2489
  assert.strictEqual(inv.grossCents, 156);
  assert.deepStrictEqual(inv.parcels.map(p => p.tracking), ['T0', 'T1', 'T2', 'R']);
  assert.ok(!('name' in inv.parcels[0]), 'keine Kundennamen in der Anbieter-Rechnung');
  st.settings.vat.kleinunternehmer = true;
  const k = PS.calcInvoice(ps, '2026-11', 'DPD', st.settings);
  assert.strictEqual(k.vatCents, 0); assert.strictEqual(k.grossCents, 131);
  assert.strictEqual(PS.calcInvoice(ps, '2026-09', 'DPD', st.settings).lines.length, 0);
});

test('Rechnungsnummern', () => {
  assert.strictEqual(PS.nextInvoiceNumber([], 2026), 'RE-2026-0001');
  const inv = [{ number: 'RE-2026-0001' }, { number: 'RE-2026-0007' }, { number: 'RE-2025-0099' }];
  assert.strictEqual(PS.nextInvoiceNumber(inv, 2026), 'RE-2026-0008');
  assert.strictEqual(PS.nextInvoiceNumber(inv, 2027), 'RE-2027-0001');
  assert.ok(PS.findInvoice([{ carrier: 'DPD', month: '2026-11', number: 'x' }], 'DPD', '2026-11'));
  assert.strictEqual(PS.findInvoice([], 'DPD', '2026-11'), null);
});

test('CSV', () => {
  const csv = PS.toCSV([['a', 'b;c', 'd"e'], [1, null, 'x\ny']]);
  assert.strictEqual(csv, '﻿a;"b;c";"d""e"\r\n1;;"x\ny"\r\n');
});

test('Backup validieren / normalisieren', () => {
  assert.throws(() => PS.normalizeState({}), /gültige/);
  assert.throws(() => PS.normalizeState(null), /gültige/);
  const s = PS.normalizeState({
    parcels: [{ id: 'x', carrier: 'DPD', tracking: ' 12 ', receivedAt: D(2026, 11, 1) }, { id: 'bad', carrier: 'UPS', tracking: '1', receivedAt: D(2026, 11, 1) }, null],
    settings: { shop: { name: 'Mein Shop' }, storageDays: 'kaputt' },
  });
  assert.strictEqual(s.parcels.length, 1);
  assert.strictEqual(s.parcels[0].tracking, '12');
  assert.strictEqual(s.parcels[0].status, 'im_lager');
  assert.strictEqual(s.settings.shop.name, 'Mein Shop');
  assert.strictEqual(s.settings.shop.iban, '');
  assert.strictEqual(s.settings.storageDays, 7);
  assert.strictEqual(s.settings.carriers.GLS.ratePaket, 0);
});

test('Beispieldaten sind gültig', () => {
  const now = new Date(2026, 10, 2, 15);
  const demo = PS.makeDemoData(now);
  assert.strictEqual(demo.length, 70);
  const s = PS.normalizeState({ parcels: demo });
  assert.strictEqual(s.parcels.length, 70);
  assert.ok(demo.every(p => new Date(p.receivedAt) <= now));
});

console.log('\n' + n + ' Tests bestanden');
