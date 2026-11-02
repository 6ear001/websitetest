(function () {
  'use strict';
  const { CARRIER_IDS, CARRIER_META } = PS;
  const KEY = 'paketlager.v1';

  /* ================= Helfer ================= */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nl2br = s => esc(s).replace(/\n/g, '<br>');
  const nowIso = () => new Date().toISOString();
  const cname = id => CARRIER_META[id].label;
  const badge = id => `<span class="badge" style="--cc:var(--c-${id})">${esc(cname(id))}</span>`;

  let toastTimer;
  function toast(msg, isErr) {
    const t = $('#toast'); t.textContent = msg; t.className = 'show' + (isErr ? ' err' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = ''; }, isErr ? 5000 : 2600);
  }

  /* ================= Speicher ================= */
  let storageOk = true;
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storageOk = false; }
    if (raw) {
      try { return PS.normalizeState(JSON.parse(raw)); }
      catch (e) {
        console.error('Gespeicherte Daten unlesbar', e);
        try { localStorage.setItem(KEY + '.defekt-' + Date.now(), raw); } catch (_) { /* egal */ }
        setTimeout(() => toast('Gespeicherte Daten waren beschädigt – eine Kopie wurde zur Sicherheit abgelegt.', true), 300);
      }
    }
    return PS.emptyState();
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }
    catch (e) { storageOk = false; toast('Speichern nicht möglich (Browser-Speicher gesperrt/voll)! Bitte sofort ein Backup erstellen.', true); }
  }
  const getParcel = id => state.parcels.find(p => p.id === id);

  /* ================= UI-Zustand ================= */
  const thisMonth = () => PS.monthKey(new Date());
  const ui = {
    view: 'annahme',
    intake: { type: 'paket', shelf: '', carrier: '', manual: false },
    lager: { q: '', status: 'im_lager', carrier: '', type: '', limit: 100 },
    sel: new Set(),
    month: thisMonth(),
    abrMonth: PS.shiftMonth(thisMonth(), 0),
  };

  const VIEWS = {
    annahme: { label: 'Annahme', fn: viewAnnahme },
    lager: { label: 'Lager', fn: viewLager },
    uebersicht: { label: 'Übersicht', fn: viewUebersicht },
    abrechnung: { label: 'Abrechnung', fn: viewAbrechnung },
    einstellungen: { label: 'Einstellungen', fn: viewEinstellungen },
  };

  function route() {
    const h = location.hash.replace('#', '');
    ui.view = VIEWS[h] ? h : 'annahme';
    ui.sel.clear();
    render();
  }
  function render() {
    $('#nav').innerHTML = Object.keys(VIEWS).map(k => {
      const cnt = k === 'lager' ? state.parcels.filter(p => p.status === 'im_lager').length : 0;
      return `<a href="#${k}" class="${ui.view === k ? 'active' : ''}">${VIEWS[k].label}${cnt ? `<span class="nav-badge">${cnt}</span>` : ''}</a>`;
    }).join('');
    $('#brandName').textContent = state.settings.shop.name || 'Paketlager';
    document.title = (state.settings.shop.name || 'Paketlager') + ' – ' + VIEWS[ui.view].label;
    VIEWS[ui.view].fn();
  }
  function changed() { save(); render(); }

  /* ================= Dialoge ================= */
  const dlg = $('#dlg');
  let dlgCleanup = null;
  function openDialog(html, opts = {}) {
    dlg.className = opts.wide ? 'wide' : '';
    dlg.innerHTML = `<div class="dlg-in">${html}</div>`;
    dlgCleanup = opts.onClose || null;
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  function closeDialog() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', () => { const f = dlgCleanup; dlgCleanup = null; if (f) f(); });
  dlg.addEventListener('mousedown', e => { if (e.target === dlg) closeDialog(); });
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDialog(); });

  /* ================= Druck ================= */
  function printSheet(html) {
    const pa = $('#printArea'); pa.innerHTML = html;
    const done = () => { pa.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  }
  function showSheet(title, html, buttonsHtml, onMount) {
    openDialog(`<h3>${esc(title)}</h3><div class="sheet" id="sheetPrev">${html}</div>
      <div class="dlg-foot">${buttonsHtml || ''}<button class="btn primary" id="btnPrint">Drucken / als PDF speichern</button><button class="btn" data-close>Schließen</button></div>`, { wide: true });
    $('#btnPrint').onclick = () => printSheet(`<div class="sheet">${html}</div>`);
    if (onMount) onMount();
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ================= Kamera-Scan (optional) ================= */
  const canScan = 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const scanBtn = id => canScan ? `<button type="button" class="btn" data-scan="${id}" title="Mit der Kamera scannen">Kamera</button>` : '';
  async function openScanner(onResult) {
    let stream = null, timer = null;
    const stop = () => { clearInterval(timer); if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    openDialog(`<h3>Barcode scannen</h3><video class="scan" playsinline muted></video><p class="hint">Halte den Barcode des Paketlabels ins Bild.</p><div class="dlg-foot"><button class="btn" data-close>Abbrechen</button></div>`, { onClose: stop });
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = $('video.scan', dlg); v.srcObject = stream; await v.play();
      const det = new BarcodeDetector({ formats: ['code_128', 'code_39', 'itf', 'ean_13', 'data_matrix', 'qr_code'] });
      timer = setInterval(async () => {
        try { const r = await det.detect(v); if (r.length) { const val = r[0].rawValue; closeDialog(); onResult(val); } } catch (_) { /* weiter */ }
      }, 250);
    } catch (e) { closeDialog(); toast('Kamera nicht verfügbar: ' + (e.message || e.name), true); }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-scan]'); if (!b) return;
    const target = document.getElementById(b.dataset.scan);
    openScanner(val => { target.value = val; target.dispatchEvent(new Event('input', { bubbles: true })); target.focus(); });
  });

  /* ================= Ansicht: Annahme ================= */
  function viewAnnahme() {
    const it = ui.intake;
    const today = state.parcels.filter(p => PS.daysSince(p.receivedAt, new Date()) === 0).sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
    const countToday = id => today.filter(p => p.carrier === id).length;
    const shelves = [...new Set(state.parcels.filter(p => p.status === 'im_lager' && p.shelf).map(p => p.shelf))].sort();
    $('#view').innerHTML = `
      <section class="card">
        <div class="btn-row" style="justify-content:space-between;margin-bottom:12px">
          <h2 style="margin:0">${it.type === 'retoure' ? 'Retoure vom Kunden annehmen' : 'Paket für Kunden annehmen'}</h2>
          <div class="seg" id="typeSeg">
            <button type="button" data-type="paket" class="${it.type === 'paket' ? 'on' : ''}">Paket</button>
            <button type="button" data-type="retoure" class="${it.type === 'retoure' ? 'on retoure' : ''}">Retoure</button>
          </div>
        </div>
        <form id="intakeForm" autocomplete="off">
          <div class="grid g2">
            <div>
              <label class="fld">Sendungsnummer (scannen oder tippen)</label>
              <div class="searchbar" style="margin-top:4px"><input id="f-tracking" class="big" type="text" inputmode="text" autocapitalize="characters" spellcheck="false" placeholder="Barcode scannen …" required>${scanBtn('f-tracking')}</div>
              <p class="hint" id="trkHint">&nbsp;</p>
            </div>
            <div>
              <label class="fld">Anbieter</label>
              <div class="carrier-pick" id="carrierPick">
                ${CARRIER_IDS.map(id => `<label style="--cc:var(--c-${id})"><input type="radio" name="carrier" value="${id}" ${it.carrier === id ? 'checked' : ''}><span><i class="dot"></i>${esc(cname(id))}</span></label>`).join('')}
              </div>
            </div>
            <label class="fld">${it.type === 'retoure' ? 'Name des Kunden (optional)' : 'Name des Empfängers'}<input id="f-name" type="text" class="big" autocomplete="off" placeholder="Vor- und Nachname"></label>
            <label class="fld">Regalplatz<input id="f-shelf" type="text" class="big" list="shelfList" autocapitalize="characters" value="${esc(it.shelf)}" placeholder="z. B. A3"></label>
          </div>
          <datalist id="shelfList">${shelves.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
          <details style="margin-top:12px"><summary style="cursor:pointer;color:var(--muted);font-weight:600">Telefon / Notiz (optional)</summary>
            <div class="grid g2" style="margin-top:8px">
              <label class="fld">Telefon<input id="f-phone" type="tel"></label>
              <label class="fld">Notiz<input id="f-note" type="text" placeholder="z. B. sperrig, Nachnahme"></label>
            </div>
          </details>
          <div class="btn-row" style="margin-top:14px"><button class="btn primary big" type="submit">Speichern (Enter)</button><span class="hint" id="formMsg"></span></div>
        </form>
      </section>

      <section class="card">
        <div class="btn-row" style="justify-content:space-between"><h2 style="margin:0">Heute angenommen: ${today.length}</h2>
          <div class="chips">${CARRIER_IDS.map(id => `<span class="chip" style="cursor:default"><i class="dot" style="background:var(--c-${id})"></i>${esc(cname(id))} ${countToday(id)}</span>`).join('')}</div></div>
        ${today.length ? `<div class="list" style="margin-top:12px;box-shadow:none">${today.slice(0, 15).map(rowHtml).join('')}</div>` : '<p class="empty">Noch nichts erfasst.</p>'}
      </section>`;

    const trk = $('#f-tracking'), name = $('#f-name'), shelf = $('#f-shelf'), form = $('#intakeForm');
    trk.focus();

    $('#typeSeg').onclick = e => { const b = e.target.closest('[data-type]'); if (!b) return; ui.intake.type = b.dataset.type; render(); };
    $('#carrierPick').onchange = e => { ui.intake.carrier = e.target.value; ui.intake.manual = true; };
    trk.addEventListener('input', () => {
      const v = PS.normalizeTracking(trk.value);
      const c = PS.detectCarrier(v);
      if (c && !ui.intake.manual) { ui.intake.carrier = c; const r = $(`input[name=carrier][value=${c}]`); if (r) r.checked = true; }
      const dup = v.length >= 6 && state.parcels.find(p => p.tracking === v && p.status === 'im_lager');
      $('#trkHint').innerHTML = dup ? `<span style="color:var(--bad);font-weight:700">Achtung: ist bereits im Lager (Regal ${esc(dup.shelf || '–')}, ${esc(dup.name || 'ohne Name')}).</span>` : (c && !ui.intake.manual ? `Anbieter erkannt: ${esc(cname(c))}` : '&nbsp;');
    });
    trk.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (trk.value.trim()) name.focus(); } });
    name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); shelf.focus(); } });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const tracking = PS.normalizeTracking(trk.value);
      if (!tracking) { trk.focus(); return; }
      if (!ui.intake.carrier) { toast('Bitte den Anbieter wählen.', true); return; }
      const dup = state.parcels.find(p => p.tracking === tracking && p.status === 'im_lager');
      if (dup && !confirm(`Die Sendungsnummer ${tracking} ist bereits im Lager (Regal ${dup.shelf || '–'}). Trotzdem nochmal erfassen?`)) return;
      const p = PS.createParcel({ carrier: ui.intake.carrier, type: ui.intake.type, tracking, name: name.value, shelf: shelf.value, phone: $('#f-phone').value, note: $('#f-note').value }, nowIso());
      state.parcels.push(p);
      ui.intake.shelf = p.shelf; ui.intake.carrier = ''; ui.intake.manual = false;
      save(); render();
      toast(`${cname(p.carrier)} ${p.type === 'retoure' ? 'Retoure ' : ''}gespeichert${p.shelf ? ' → Regal ' + p.shelf : ''}`);
    });
    $('#view').onclick = rowClicks;
  }

  /* ================= Zeilen / Liste ================= */
  function rowHtml(p, opts = {}) {
    const days = PS.daysSince(p.receivedAt, new Date());
    const late = PS.isOverdue(p, new Date(), state.settings.storageDays);
    const selectable = opts.selectable;
    let primary = '';
    if (p.status === 'im_lager') primary = p.type === 'retoure'
      ? `<button class="btn sm" data-act="out-driver" data-id="${p.id}">Übergeben</button>`
      : `<button class="btn primary sm" data-act="pickup" data-id="${p.id}">Ausgeben</button>`;
    else primary = `<button class="btn sm" data-act="open" data-id="${p.id}">Details</button>`;
    const dateInfo = p.status === 'ausgegeben' ? `Abgeholt <b>${PS.fmtDate(p.pickedUpAt)}</b>`
      : p.status === 'uebergeben' ? `Übergeben <b>${PS.fmtDate(p.handedOverAt)}</b>`
        : `<b>${PS.fmtDate(p.receivedAt)}</b> · ${days === 0 ? 'heute' : days === 1 ? '1 Tag' : days + ' Tage'}`;
    return `<div class="row ${late ? 'overdue' : ''} ${selectable && ui.sel.has(p.id) ? 'sel' : ''}" data-id="${p.id}">
      <span class="chk">${selectable ? `<input type="checkbox" data-sel="${p.id}" ${ui.sel.has(p.id) ? 'checked' : ''} aria-label="Auswählen">` : ''}</span>
      <div class="shelf ${p.shelf ? '' : 'none'}">${esc(p.shelf || '–')}</div>
      ${badge(p.carrier)}
      <div class="main"><div class="trk">${esc(p.tracking)}</div><div class="sub">${esc(p.name || 'ohne Namen')}${p.note ? ' · ' + esc(p.note) : ''}</div></div>
      <div class="meta">${dateInfo}</div>
      <div class="st"><span class="pill st-${p.status}">${esc(PS.statusLabel(p))}</span> ${p.type === 'retoure' ? '<span class="pill retoure">Retoure</span>' : ''} ${late ? '<span class="pill late">überfällig</span>' : ''}</div>
      <div class="acts">${primary}</div>
    </div>`;
  }

  function rowClicks(e) {
    const act = e.target.closest('[data-act]');
    if (act) {
      const id = act.dataset.id;
      if (act.dataset.act === 'pickup') openPickup([id]);
      else if (act.dataset.act === 'out-driver') handOver([id]);
      else if (act.dataset.act === 'open') openParcel(id);
      return;
    }
    if (e.target.closest('[data-sel]')) return;
    const row = e.target.closest('.row'); if (row) openParcel(row.dataset.id);
  }

  /* ================= Ansicht: Lager / Suche ================= */
  function viewLager() {
    const f = ui.lager;
    $('#view').innerHTML = `
      <section class="card">
        <div class="searchbar"><input id="q" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Suchen: Name, Sendungsnummer (auch nur die letzten Ziffern), Regal …" value="${esc(f.q)}">${scanBtn('q')}</div>
        <div class="filters">
          <div class="chips" id="fCarrier">
            <button class="chip ${f.carrier === '' ? 'on' : ''}" data-c="">Alle</button>
            ${CARRIER_IDS.map(id => `<button class="chip ${f.carrier === id ? 'on' : ''}" data-c="${id}"><i class="dot" style="background:var(--c-${id})"></i>${esc(cname(id))}</button>`).join('')}
          </div>
          <select id="fStatus" aria-label="Status">
            <option value="im_lager">Im Lager</option><option value="ueberfaellig">Überfällig (> ${state.settings.storageDays} Tage)</option>
            <option value="ausgegeben">Ausgegeben</option><option value="uebergeben">Übergeben / zurück</option><option value="">Alle Status</option>
          </select>
          <select id="fType" aria-label="Typ"><option value="">Pakete + Retouren</option><option value="paket">Nur Pakete</option><option value="retoure">Nur Retouren</option></select>
          <button class="btn spacer" id="btnDriver">Fahrerabholung …</button>
        </div>
      </section>
      <div id="results"></div>
      <div id="selbar" class="selbar" hidden></div>`;
    $('#fStatus').value = f.status; $('#fType').value = f.type;
    const q = $('#q');
    q.addEventListener('input', () => { f.q = q.value; f.limit = 100; ui.sel.clear(); renderResults(); });
    q.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const res = PS.filterParcels(state.parcels, f, new Date(), state.settings.storageDays);
      if (res.length === 1) { const p = res[0]; if (p.status === 'im_lager' && p.type !== 'retoure') openPickup([p.id]); else openParcel(p.id); }
      else if (res.length > 1 && res.length <= 12 && res.every(p => p.status === 'im_lager' && p.type !== 'retoure') && f.q.trim()) { ui.sel = new Set(res.map(p => p.id)); renderResults(); toast(`${res.length} Treffer ausgewählt – „Ausgeben“ für alle zusammen.`); }
    });
    $('#fCarrier').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; f.carrier = b.dataset.c; f.limit = 100; ui.sel.clear(); viewLager(); };
    $('#fStatus').onchange = e => { f.status = e.target.value; f.limit = 100; ui.sel.clear(); renderResults(); };
    $('#fType').onchange = e => { f.type = e.target.value; f.limit = 100; ui.sel.clear(); renderResults(); };
    $('#btnDriver').onclick = openDriverPickup;
    $('#view').onclick = e => {
      const more = e.target.closest('#btnMore'); if (more) { f.limit += 200; renderResults(); return; }
      const s = e.target.closest('[data-sel]');
      if (s) { s.checked ? ui.sel.add(s.dataset.sel) : ui.sel.delete(s.dataset.sel); renderResults(); return; }
      if (e.target.closest('#selbar')) return selbarClicks(e);
      rowClicks(e);
    };
    renderResults();
    if (!f.q) q.focus(); else { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }

  function renderResults() {
    const f = ui.lager;
    const res = PS.filterParcels(state.parcels, f, new Date(), state.settings.storageDays);
    const shown = res.slice(0, f.limit);
    $('#results').innerHTML = `
      <p class="result-info">${res.length} ${res.length === 1 ? 'Treffer' : 'Treffer'}${f.q ? ` für „${esc(f.q)}“` : ''}
        ${shown.length > 1 ? ` · <a href="#" id="selAll">alle ${shown.length} auswählen</a>` : ''}</p>
      ${shown.length ? `<div class="list">${shown.map(p => rowHtml(p, { selectable: true })).join('')}</div>` : `<div class="list"><p class="empty">Nichts gefunden.${f.status === 'im_lager' ? ' <br>Tipp: Status auf „Alle Status“ stellen, um auch ausgegebene Pakete zu finden.' : ''}</p></div>`}
      ${res.length > shown.length ? `<div class="btn-row" style="justify-content:center;margin-top:12px"><button class="btn" id="btnMore">Weitere anzeigen (${res.length - shown.length})</button></div>` : ''}`;
    const sa = $('#selAll'); if (sa) sa.onclick = e => { e.preventDefault(); shown.forEach(p => ui.sel.add(p.id)); renderResults(); };
    // Auswahl-Leiste
    const selected = [...ui.sel].map(getParcel).filter(Boolean);
    const bar = $('#selbar');
    if (!selected.length) { bar.hidden = true; return; }
    const allPak = selected.every(p => p.status === 'im_lager' && p.type !== 'retoure');
    const allStock = selected.every(p => p.status === 'im_lager');
    bar.hidden = false;
    bar.innerHTML = `<b>${selected.length} ausgewählt</b>
      ${allPak ? '<button class="btn primary" data-bar="pickup">Ausgeben (Kunde holt ab)</button>' : ''}
      ${allStock ? '<button class="btn" data-bar="driver">An Fahrer / Anbieter übergeben</button>' : ''}
      <button class="btn" data-bar="clear">Abwählen</button>`;
  }
  function selbarClicks(e) {
    const b = e.target.closest('[data-bar]'); if (!b) return;
    const ids = [...ui.sel];
    if (b.dataset.bar === 'clear') { ui.sel.clear(); renderResults(); }
    else if (b.dataset.bar === 'pickup') openPickup(ids);
    else if (b.dataset.bar === 'driver') handOver(ids);
  }

  /* ================= Aktionen ================= */
  function openPickup(ids) {
    const ps = ids.map(getParcel).filter(p => p && p.status === 'im_lager');
    if (!ps.length) return;
    openDialog(`<h3>${ps.length > 1 ? ps.length + ' Pakete ausgeben' : 'Paket ausgeben'}</h3>
      ${ps.map(p => `<div class="parcel-mini"><div class="shelf ${p.shelf ? '' : 'none'}">${esc(p.shelf || '–')}</div><div>${badge(p.carrier)}<div style="font-weight:700">${esc(p.tracking)}</div><div class="hint" style="margin:0">${esc(p.name || 'ohne Namen')}</div></div></div>`).join('')}
      <label class="fld">Abholer (Name)<input id="pu-by" type="text" class="big" value="${esc(ps[0].name)}" autocomplete="off"></label>
      <label class="chk-line"><input type="checkbox" id="pu-id"> Ausweis / Abholcode geprüft</label>
      <div class="dlg-foot"><button class="btn" data-close>Abbrechen</button><button class="btn primary big" id="pu-ok">Ausgeben (Enter)</button></div>`);
    const by = $('#pu-by'); by.focus(); by.select();
    const ok = () => {
      const t = nowIso();
      ps.forEach(p => PS.markPickedUp(p, by.value, $('#pu-id').checked, t));
      ui.sel.clear(); closeDialog(); changed(); toast(ps.length > 1 ? `${ps.length} Pakete ausgegeben` : 'Paket ausgegeben');
    };
    $('#pu-ok').onclick = ok;
    by.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
  }

  function handOver(ids) {
    const ps = ids.map(getParcel).filter(p => p && p.status === 'im_lager');
    if (!ps.length) return;
    const retN = ps.filter(p => p.type === 'retoure').length;
    const txt = ps.length === 1 ? (ps[0].type === 'retoure' ? 'Retoure als an den Fahrer übergeben markieren?' : 'Paket als „zurück an Anbieter“ markieren (Kunde hat nicht abgeholt)?')
      : `${ps.length} Sendungen (${retN} Retouren, ${ps.length - retN} Pakete) als an Fahrer/Anbieter übergeben markieren?`;
    if (!confirm(txt)) return;
    const t = nowIso(); ps.forEach(p => PS.markHandedOver(p, t));
    ui.sel.clear(); changed(); toast(`${ps.length} übergeben`);
  }

  function openParcel(id) {
    const p = getParcel(id); if (!p) return;
    const tl = [`Eingang: <b>${PS.fmtDateTime(p.receivedAt)}</b>`];
    if (p.pickedUpAt) tl.push(`Abgeholt: <b>${PS.fmtDateTime(p.pickedUpAt)}</b>${p.pickedUpBy ? ' von ' + esc(p.pickedUpBy) : ''}${p.idChecked ? ' (Ausweis geprüft)' : ''}`);
    if (p.handedOverAt) tl.push(`${p.type === 'retoure' ? 'An Fahrer übergeben' : 'Zurück an Anbieter'}: <b>${PS.fmtDateTime(p.handedOverAt)}</b>`);
    openDialog(`<h3>${p.type === 'retoure' ? 'Retoure' : 'Paket'} · ${esc(cname(p.carrier))}</h3>
      <div class="timeline">${tl.join('<br>')}</div>
      <div class="grid g2 keep">
        <label class="fld" style="grid-column:1/-1">Sendungsnummer<input id="e-trk" type="text" value="${esc(p.tracking)}"></label>
        <label class="fld">Anbieter<select id="e-car">${CARRIER_IDS.map(c => `<option value="${c}" ${p.carrier === c ? 'selected' : ''}>${esc(cname(c))}</option>`).join('')}</select></label>
        <label class="fld">Typ<select id="e-type"><option value="paket" ${p.type === 'paket' ? 'selected' : ''}>Paket</option><option value="retoure" ${p.type === 'retoure' ? 'selected' : ''}>Retoure</option></select></label>
        <label class="fld">Name<input id="e-name" type="text" value="${esc(p.name)}"></label>
        <label class="fld">Regalplatz<input id="e-shelf" type="text" value="${esc(p.shelf)}"></label>
        <label class="fld">Telefon<input id="e-phone" type="tel" value="${esc(p.phone)}"></label>
        <label class="fld">Notiz<input id="e-note" type="text" value="${esc(p.note)}"></label>
      </div>
      <div class="dlg-foot">
        <button class="btn danger left" id="e-del">Löschen</button>
        ${p.status === 'im_lager' ? (p.type === 'retoure' ? '' : '<button class="btn primary" id="e-out">Ausgeben</button>') + `<button class="btn" id="e-drv">${p.type === 'retoure' ? 'An Fahrer übergeben' : 'Zurück an Anbieter'}</button>` : '<button class="btn" id="e-back">Zurück ins Lager</button>'}
        <button class="btn primary" id="e-save">Speichern</button>
      </div>`);
    const apply = () => {
      const trk = PS.normalizeTracking($('#e-trk').value); if (!trk) { toast('Sendungsnummer fehlt.', true); return false; }
      Object.assign(p, { tracking: trk, carrier: $('#e-car').value, type: $('#e-type').value, name: $('#e-name').value.trim(), shelf: $('#e-shelf').value.trim().toUpperCase(), phone: $('#e-phone').value.trim(), note: $('#e-note').value.trim() });
      return true;
    };
    $('#e-save').onclick = () => { if (apply()) { closeDialog(); changed(); toast('Gespeichert'); } };
    $('#e-del').onclick = () => { if (confirm('Diese Sendung endgültig löschen? (Sie zählt dann auch nicht mehr in der Abrechnung.)')) { state.parcels = state.parcels.filter(x => x.id !== p.id); closeDialog(); changed(); toast('Gelöscht'); } };
    if ($('#e-out')) $('#e-out').onclick = () => { if (apply()) { save(); openPickup([p.id]); } };
    if ($('#e-drv')) $('#e-drv').onclick = () => { if (apply()) { save(); closeDialog(); handOver([p.id]); } };
    if ($('#e-back')) $('#e-back').onclick = () => { PS.restore(p); closeDialog(); changed(); toast('Wieder im Lager'); };
  }

  /* ---------- Fahrerabholung (Retouren + nicht abgeholte Pakete) ---------- */
  function openDriverPickup(carrierId) {
    const c = typeof carrierId === 'string' ? carrierId : (ui.lager.carrier || 'DPD');
    const cand = state.parcels.filter(p => p.carrier === c && p.status === 'im_lager' && (p.type === 'retoure' || PS.isOverdue(p, new Date(), state.settings.storageDays)))
      .sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1));
    openDialog(`<h3>Fahrerabholung</h3>
      <div class="chips" id="dp-c">${CARRIER_IDS.map(id => `<button class="chip ${id === c ? 'on' : ''}" data-c="${id}"><i class="dot" style="background:var(--c-${id})"></i>${esc(cname(id))}</button>`).join('')}</div>
      <p class="hint" style="margin:0">Retouren und nicht abgeholte Pakete (älter als ${state.settings.storageDays} Tage), die der Fahrer jetzt mitnimmt.</p>
      ${cand.length ? `<div class="list" style="max-height:44vh;overflow:auto;box-shadow:none">${cand.map(p => `<label class="parcel-mini" style="border:0;border-top:1px solid var(--border);border-radius:0"><input type="checkbox" class="dp-chk" value="${p.id}" checked><div style="flex:1"><div style="font-weight:700">${esc(p.tracking)}</div><div class="hint" style="margin:0">${p.type === 'retoure' ? 'Retoure' : 'Zurück an Anbieter'} · ${esc(p.name || 'ohne Namen')} · ${PS.fmtDate(p.receivedAt)}</div></div><div class="shelf ${p.shelf ? '' : 'none'}">${esc(p.shelf || '–')}</div></label>`).join('')}</div>` : '<p class="empty">Aktuell nichts zu übergeben.</p>'}
      <div class="dlg-foot"><button class="btn" data-close>Schließen</button>${cand.length ? '<button class="btn" id="dp-print">Übergabeliste drucken</button><button class="btn primary" id="dp-ok">Als übergeben markieren</button>' : ''}</div>`);
    $('#dp-c').onclick = e => { const b = e.target.closest('[data-c]'); if (b) openDriverPickup(b.dataset.c); };
    const chosen = () => $$('.dp-chk', dlg).filter(x => x.checked).map(x => getParcel(x.value));
    if (cand.length) {
      $('#dp-print').onclick = () => { const ps = chosen(); if (ps.length) printSheet(`<div class="sheet">${handoverHtml(c, ps)}</div>`); };
      $('#dp-ok').onclick = () => { const ps = chosen(); if (!ps.length) return; const t = nowIso(); ps.forEach(p => PS.markHandedOver(p, t)); closeDialog(); changed(); toast(`${ps.length} Sendungen an ${cname(c)} übergeben`); };
    }
  }

  /* ================= Ansicht: Übersicht ================= */
  function monthSelect(id, selected) {
    const keys = new Set([thisMonth(), selected]);
    state.parcels.forEach(p => keys.add(PS.monthKey(p.receivedAt)));
    for (let i = 0; i < 12; i++) keys.add(PS.shiftMonth(thisMonth(), -i));
    return `<select id="${id}" aria-label="Monat">${[...keys].sort().reverse().map(k => `<option value="${k}" ${k === selected ? 'selected' : ''}>${PS.monthLabel(k)}</option>`).join('')}</select>`;
  }
  function monthbar(titleHtml, key, extra) {
    return `<div class="monthbar"><h2>${titleHtml}</h2>
      <button class="btn sm" id="mPrev" aria-label="Vorheriger Monat">‹</button>${monthSelect('mSel', key)}<button class="btn sm" id="mNext" aria-label="Nächster Monat">›</button>${extra || ''}</div>`;
  }
  function bindMonthbar(get, set) {
    $('#mSel').onchange = e => { set(e.target.value); render(); };
    $('#mPrev').onclick = () => { set(PS.shiftMonth(get(), -1)); render(); };
    $('#mNext').onclick = () => { set(PS.shiftMonth(get(), 1)); render(); };
  }

  function viewUebersicht() {
    const key = ui.month, now = new Date(), sd = state.settings.storageDays;
    const st = PS.monthStats(state.parcels, key, now, sd);
    const sum = f => CARRIER_IDS.reduce((s, id) => s + st[id][f], 0);
    const last = state.meta.lastBackupAt;
    const backupDays = last ? PS.daysSince(last, now) : null;
    const needBackup = state.parcels.length > 0 && (backupDays === null || backupDays >= 7);
    const hist = [];
    for (let i = 0; i < 6; i++) { const k = PS.shiftMonth(key, -i); hist.push({ k, s: PS.monthStats(state.parcels, k, now, sd) }); }

    $('#view').innerHTML = `
      ${needBackup ? `<div class="banner"><span>${backupDays === null ? 'Es wurde noch kein Backup erstellt.' : `Letztes Backup vor ${backupDays} Tagen.`} Die Daten liegen nur in diesem Browser – bitte regelmäßig sichern.</span><button class="btn sm" id="btnBackup">Backup herunterladen</button></div>` : ''}
      ${!storageOk ? '<div class="banner bad">Der Browser-Speicher ist nicht verfügbar – Änderungen gehen beim Schließen verloren!</div>' : ''}
      ${monthbar('Übersicht', key)}
      <div class="grid g3">${CARRIER_IDS.map(id => {
        const s = st[id], c = state.settings.carriers[id];
        const verg = Math.round((s.paket * c.ratePaket + s.retoure * c.rateRetoure) * 100);
        return `<section class="card stat-card" style="--cc:var(--c-${id})">
          <div class="lbl">${esc(cname(id))} · Pakete eingenommen</div><div class="num">${s.paket}</div>
          <div class="kv"><span>Retouren angenommen</span><b>${s.retoure}</b></div>
          <div class="kv"><span>Von Kunden abgeholt</span><b>${s.ausgegeben}</b></div>
          <div class="kv"><span>Übergeben / zurück an Anbieter</span><b>${s.uebergeben}</b></div>
          <div class="kv"><span>Aktuell im Lager</span><b><a href="#lager" data-goto="${id}">${s.imLager}</a></b></div>
          <div class="kv"><span>davon überfällig</span><b class="${s.ueberfaellig ? 'bad' : ''}">${s.ueberfaellig}</b></div>
          <div class="kv"><span>Vergütung (netto)</span><b>${c.ratePaket || c.rateRetoure ? PS.fmtEUR(verg) : '–'}</b></div>
        </section>`;
      }).join('')}</div>
      <section class="card"><h2>Gesamt ${PS.monthLabel(key)}</h2>
        <div class="grid g4 keep">
          <div><div class="hint">Pakete eingenommen</div><div style="font-size:1.8rem;font-weight:800">${sum('paket')}</div></div>
          <div><div class="hint">Retouren</div><div style="font-size:1.8rem;font-weight:800">${sum('retoure')}</div></div>
          <div><div class="hint">Abgeholt</div><div style="font-size:1.8rem;font-weight:800">${sum('ausgegeben')}</div></div>
          <div><div class="hint">Jetzt im Lager</div><div style="font-size:1.8rem;font-weight:800">${sum('imLager')}</div></div>
        </div></section>
      <section class="card"><h2>Verlauf der letzten 6 Monate</h2><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Monat</th>${CARRIER_IDS.map(id => `<th class="r">${esc(cname(id))}</th>`).join('')}<th class="r">Gesamt</th></tr></thead>
        <tbody>${hist.map(h => {
          const cell = id => `${h.s[id].paket}${h.s[id].retoure ? ` <span class="hint">+${h.s[id].retoure} Ret.</span>` : ''}`;
          const tp = CARRIER_IDS.reduce((s, id) => s + h.s[id].paket, 0), tr = CARRIER_IDS.reduce((s, id) => s + h.s[id].retoure, 0);
          return `<tr><td>${PS.monthLabel(h.k)}</td>${CARRIER_IDS.map(id => `<td class="r">${cell(id)}</td>`).join('')}<td class="r"><b>${tp}</b>${tr ? ` <span class="hint">+${tr} Ret.</span>` : ''}</td></tr>`;
        }).join('')}</tbody></table></div></section>`;
    bindMonthbar(() => ui.month, v => { ui.month = v; });
    const bb = $('#btnBackup'); if (bb) bb.onclick = () => { exportBackup(); render(); };
    $$('[data-goto]').forEach(a => a.addEventListener('click', () => { ui.lager.carrier = a.dataset.goto; ui.lager.status = 'im_lager'; ui.lager.q = ''; }));
  }

  /* ================= Ansicht: Abrechnung ================= */
  function viewAbrechnung() {
    const key = ui.abrMonth, S = state.settings;
    const rows = CARRIER_IDS.map(id => ({ id, inv: PS.calcInvoice(state.parcels, key, id, S), issued: PS.findInvoice(state.invoices, id, key) }));
    const tot = rows.reduce((a, r) => ({ n: a.n + r.inv.count, net: a.net + r.inv.netCents, vat: a.vat + r.inv.vatCents, gross: a.gross + r.inv.grossCents, pk: a.pk + r.inv.paketCount, rt: a.rt + r.inv.retoureCount }), { n: 0, net: 0, vat: 0, gross: 0, pk: 0, rt: 0 });
    const unpaid = state.invoices.filter(i => !i.paid);
    const todayD = new Date();
    $('#view').innerHTML = `
      ${monthbar('Abrechnung', key)}
      <section class="card"><h2>Rechnungen an die Anbieter · ${PS.monthLabel(key)}</h2>
        <p class="hint" style="margin-top:-4px">Grundlage: alle im Monat <b>angenommenen</b> Pakete und Retouren × Vergütungssatz je Anbieter (Einstellungen).</p>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Anbieter</th><th class="r">Pakete</th><th class="r">Retouren</th><th class="r">Netto</th><th class="r">MwSt</th><th class="r">Brutto</th><th>Rechnung</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${badge(r.id)}</td><td class="r">${r.inv.paketCount}</td><td class="r">${r.inv.retoureCount}</td>
          <td class="r">${PS.fmtEUR(r.inv.netCents)}</td><td class="r">${PS.fmtEUR(r.inv.vatCents)}</td><td class="r"><b>${PS.fmtEUR(r.inv.grossCents)}</b></td>
          <td>${r.issued ? `<button class="btn sm" data-inv="${r.issued.id}">${esc(r.issued.number)} ansehen</button>${r.issued.paid ? ' <span class="pill st-ausgegeben">bezahlt</span>' : ''}` :
            `<button class="btn primary sm" data-create="${r.id}" ${r.inv.count ? '' : 'disabled'}>Rechnung erstellen</button>`}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td>Summe</td><td class="r">${tot.pk}</td><td class="r">${tot.rt}</td><td class="r">${PS.fmtEUR(tot.net)}</td><td class="r">${PS.fmtEUR(tot.vat)}</td><td class="r">${PS.fmtEUR(tot.gross)}</td><td></td></tr></tfoot></table></div>
        ${rows.some(r => r.inv.count && !S.carriers[r.id].ratePaket && !S.carriers[r.id].rateRetoure) ? '<p class="hint" style="color:var(--warn);font-weight:600">Für mindestens einen Anbieter ist noch kein Vergütungssatz eingetragen (Einstellungen → Anbieter).</p>' : ''}
        <div class="btn-row" style="margin-top:12px"><button class="btn" id="btnReport">Monatsbericht ansehen / drucken</button><button class="btn" id="btnCsv">Liste als CSV (Excel)</button></div>
      </section>
      <section class="card"><h2>Alle erstellten Rechnungen</h2>
        ${state.invoices.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nr.</th><th>Anbieter</th><th>Monat</th><th>Datum</th><th>Fällig</th><th class="r">Brutto</th><th>Status</th><th></th></tr></thead><tbody>
          ${state.invoices.slice().sort((a, b) => (a.number < b.number ? 1 : -1)).map(i => { const late = !i.paid && new Date(i.dueAt) < PS.dayStart(todayD); return `<tr><td><b>${esc(i.number)}</b></td><td>${badge(i.carrier)}</td><td>${PS.monthLabel(i.month)}</td><td>${PS.fmtDate(i.issuedAt)}</td><td>${PS.fmtDate(i.dueAt)}</td><td class="r">${PS.fmtEUR(i.grossCents)}</td>
          <td>${i.paid ? `<span class="pill st-ausgegeben">bezahlt ${PS.fmtDate(i.paidAt)}</span>` : late ? '<span class="pill late">überfällig</span>' : '<span class="pill st-im_lager">offen</span>'}</td><td class="r"><button class="btn sm" data-inv="${i.id}">Öffnen</button></td></tr>`; }).join('')}
          </tbody></table></div>
          ${unpaid.length ? `<p class="hint">Offen: ${unpaid.length} Rechnung(en) über ${PS.fmtEUR(unpaid.reduce((s, i) => s + i.grossCents, 0))}.</p>` : ''}` : '<p class="empty">Noch keine Rechnung erstellt.</p>'}
      </section>`;
    bindMonthbar(() => ui.abrMonth, v => { ui.abrMonth = v; });
    $('#view').onclick = e => {
      const c = e.target.closest('[data-create]'); if (c) return createInvoice(c.dataset.create, key);
      const o = e.target.closest('[data-inv]'); if (o) return openInvoice(o.dataset.inv);
    };
    $('#btnReport').onclick = () => showSheet('Monatsbericht ' + PS.monthLabel(key), reportHtml(key));
    $('#btnCsv').onclick = () => {
      const rowsCsv = [['Eingang', 'Anbieter', 'Sendungsnummer', 'Typ', 'Regal', 'Status', 'Ausgegeben/Übergeben am']];
      state.parcels.filter(p => PS.inMonth(p.receivedAt, key)).sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1))
        .forEach(p => rowsCsv.push([PS.fmtDateTime(p.receivedAt), cname(p.carrier), p.tracking, PS.typeLabel(p), p.shelf, PS.statusLabel(p), PS.fmtDateTime(p.pickedUpAt || p.handedOverAt)]));
      download(`pakete-${key}.csv`, PS.toCSV(rowsCsv), 'text/csv;charset=utf-8');
    };
  }

  function createInvoice(carrierId, key) {
    const S = state.settings, c = S.carriers[carrierId];
    const calc = PS.calcInvoice(state.parcels, key, carrierId, S);
    if (!calc.count) return;
    if ((!S.shop.street || !S.shop.city) && !confirm('Deine Absenderadresse fehlt noch (Einstellungen → Mein Shop). Trotzdem Rechnung erstellen?')) return;
    if (!c.ratePaket && !c.rateRetoure && !confirm('Für diesen Anbieter ist kein Vergütungssatz eingetragen – die Rechnung würde 0,00 € ergeben. Trotzdem erstellen?')) return;
    const issued = new Date();
    const inv = {
      id: PS.newId(), number: PS.nextInvoiceNumber(state.invoices, issued.getFullYear()), ...calc,
      issuedAt: issued.toISOString(), dueAt: PS.addDays(issued, S.paymentDays).toISOString(), paid: false, paidAt: null,
      kleinunternehmer: !!S.vat.kleinunternehmer,
      shop: { ...S.shop }, recipient: { company: c.company, address: c.address, customerNo: c.customerNo }, paymentDays: S.paymentDays,
    };
    state.invoices.push(inv); changed(); openInvoice(inv.id);
  }

  function openInvoice(id) {
    const inv = state.invoices.find(i => i.id === id); if (!inv) return;
    showSheet('Rechnung ' + inv.number, invoiceHtml(inv),
      `<button class="btn left" id="inv-recalc" title="Beträge und Anlage neu aus den aktuellen Paketdaten und Sätzen berechnen (Nummer bleibt)">Neu berechnen</button>
       <button class="btn" id="inv-paid">${inv.paid ? 'Zahlung zurücknehmen' : 'Als bezahlt markieren'}</button>`,
      () => {
        $('#inv-paid').onclick = () => { inv.paid = !inv.paid; inv.paidAt = inv.paid ? nowIso() : null; save(); render(); openInvoice(inv.id); };
        $('#inv-recalc').onclick = () => {
          if (!confirm('Rechnung ' + inv.number + ' mit den aktuellen Daten und Sätzen neu berechnen? Wenn sie schon versendet wurde, besser nicht.')) return;
          const S = state.settings, c = S.carriers[inv.carrier];
          Object.assign(inv, PS.calcInvoice(state.parcels, inv.month, inv.carrier, S), {
            kleinunternehmer: !!S.vat.kleinunternehmer, shop: { ...S.shop }, recipient: { company: c.company, address: c.address, customerNo: c.customerNo },
          });
          save(); render(); openInvoice(inv.id);
        };
      });
  }

  /* ---------- Druckvorlagen ---------- */
  function shopBlock(shop) {
    const lines = [shop.name, shop.owner, shop.street, [shop.zip, shop.city].filter(Boolean).join(' ')].filter(Boolean);
    return lines.map(esc).join('<br>');
  }
  const fmtUnit = u => u.toFixed(4).replace(/0{1,2}$/, '').replace('.', ',') + ' €';
  function invoiceHtml(inv) {
    const s = inv.shop, r = inv.recipient, per = PS.monthPeriod(inv.month);
    const senderLine = [s.name, s.street, [s.zip, s.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
    return `
      <div class="head">
        <div><div class="sender-line">${esc(senderLine || 'Absender')}</div>
          <div>${esc(r.company)}${r.address ? '<br>' + nl2br(r.address) : ''}</div></div>
        <div class="right"><b>${esc(s.name)}</b><br>${shopBlock({ ...s, name: '' })}${s.phone ? '<br>Tel. ' + esc(s.phone) : ''}${s.email ? '<br>' + esc(s.email) : ''}</div>
      </div>
      <h1>Rechnung</h1>
      <dl class="meta-box">
        <dt>Rechnungsnummer</dt><dd>${esc(inv.number)}</dd>
        <dt>Rechnungsdatum</dt><dd>${PS.fmtDate(inv.issuedAt)}</dd>
        <dt>Leistungszeitraum</dt><dd>${PS.fmtDate(per.start)} – ${PS.fmtDate(per.end)}</dd>
        ${r.customerNo ? `<dt>Partner-/Kundennr.</dt><dd>${esc(r.customerNo)}</dd>` : ''}
      </dl>
      <p style="margin-top:8mm">Für die Annahme, Lagerung und Ausgabe von Sendungen als Paketshop im Zeitraum ${PS.monthLabel(inv.month)} berechne ich Ihnen:</p>
      <table><thead><tr><th>Leistung</th><th class="r">Menge</th><th class="r">Einzelpreis</th><th class="r">Netto</th></tr></thead>
        <tbody>${inv.lines.map(l => `<tr><td>${esc(l.label)}</td><td class="r">${l.qty}</td><td class="r">${fmtUnit(l.unit)}</td><td class="r">${PS.fmtEUR(l.netCents)}</td></tr>`).join('')}</tbody></table>
      <table class="sum"><tbody>
        <tr><td>Nettobetrag</td><td class="r">${PS.fmtEUR(inv.netCents)}</td></tr>
        <tr><td>${inv.kleinunternehmer ? 'Umsatzsteuer' : 'MwSt ' + String(inv.vatRate).replace('.', ',') + ' %'}</td><td class="r">${PS.fmtEUR(inv.vatCents)}</td></tr>
        <tr class="total"><td>Gesamt</td><td class="r">${PS.fmtEUR(inv.grossCents)}</td></tr></tbody></table>
      ${inv.kleinunternehmer ? '<p class="note">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</p>' : ''}
      <p class="note">Bitte überweisen Sie den Betrag innerhalb von ${inv.paymentDays} Tagen bis zum <b>${PS.fmtDate(inv.dueAt)}</b> unter Angabe der Rechnungsnummer${s.iban ? ` auf das Konto <b>${esc(s.iban)}</b>${s.bic ? ' (BIC ' + esc(s.bic) + ')' : ''}${s.bank ? ', ' + esc(s.bank) : ''}` : ''}.<br>Eine Auflistung der abgerechneten Sendungen finden Sie in der Anlage.</p>
      <div class="foot"><div>${shopBlock(s)}</div><div>${s.taxNo ? 'Steuernr.: ' + esc(s.taxNo) + '<br>' : ''}${s.vatId ? 'USt-IdNr.: ' + esc(s.vatId) : ''}</div><div>${s.iban ? 'IBAN: ' + esc(s.iban) + '<br>' : ''}${s.bic ? 'BIC: ' + esc(s.bic) + '<br>' : ''}${esc(s.bank || '')}</div></div>
      <div class="pagebreak"></div>
      <h2>Anlage zur Rechnung ${esc(inv.number)} – ${esc(cname(inv.carrier))}, ${PS.monthLabel(inv.month)}</h2>
      <p>${inv.paketCount} Pakete, ${inv.retoureCount} Retouren (insgesamt ${inv.count} Sendungen)</p>
      <table class="small"><thead><tr><th style="width:12mm">Nr.</th><th>Sendungsnummer</th><th>Art</th><th>Angenommen am</th></tr></thead>
        <tbody>${inv.parcels.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.tracking)}</td><td>${p.type === 'retoure' ? 'Retoure' : 'Paket'}</td><td>${PS.fmtDate(p.date)}</td></tr>`).join('')}</tbody></table>`;
  }

  function reportHtml(key) {
    const S = state.settings, now = new Date(), st = PS.monthStats(state.parcels, key, now, S.storageDays);
    const invs = CARRIER_IDS.map(id => PS.calcInvoice(state.parcels, key, id, S));
    const sum = invs.reduce((a, i) => ({ net: a.net + i.netCents, vat: a.vat + i.vatCents, gross: a.gross + i.grossCents }), { net: 0, vat: 0, gross: 0 });
    const list = id => state.parcels.filter(p => p.carrier === id && PS.inMonth(p.receivedAt, key)).sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1));
    return `
      <div class="head"><div><b style="font-size:13pt">${esc(S.shop.name)}</b><br>${shopBlock({ ...S.shop, name: '' })}</div><div class="right">Erstellt am ${PS.fmtDate(now)}</div></div>
      <h1>Monatsbericht ${PS.monthLabel(key)}</h1>
      <table><thead><tr><th>Anbieter</th><th class="r">Pakete eingenommen</th><th class="r">Retouren</th><th class="r">Abgeholt</th><th class="r">Übergeben/zurück</th><th class="r">Netto</th><th class="r">Brutto</th></tr></thead><tbody>
        ${CARRIER_IDS.map((id, i) => `<tr><td>${esc(cname(id))}</td><td class="r">${st[id].paket}</td><td class="r">${st[id].retoure}</td><td class="r">${st[id].ausgegeben}</td><td class="r">${st[id].uebergeben}</td><td class="r">${PS.fmtEUR(invs[i].netCents)}</td><td class="r">${PS.fmtEUR(invs[i].grossCents)}</td></tr>`).join('')}
        <tr style="font-weight:800"><td>Summe</td><td class="r">${CARRIER_IDS.reduce((s, id) => s + st[id].paket, 0)}</td><td class="r">${CARRIER_IDS.reduce((s, id) => s + st[id].retoure, 0)}</td><td class="r">${CARRIER_IDS.reduce((s, id) => s + st[id].ausgegeben, 0)}</td><td class="r">${CARRIER_IDS.reduce((s, id) => s + st[id].uebergeben, 0)}</td><td class="r">${PS.fmtEUR(sum.net)}</td><td class="r">${PS.fmtEUR(sum.gross)}</td></tr></tbody></table>
      <p class="note">Eingenommen = im Monat angenommene Sendungen (Grundlage der Anbieter-Rechnungen). Abgeholt/Übergeben = im Monat tatsächlich ausgegebene bzw. übergebene Sendungen.</p>
      ${CARRIER_IDS.map(id => { const l = list(id); return l.length ? `<h2>${esc(cname(id))} – ${l.length} Sendungen</h2><table class="small"><thead><tr><th>Eingang</th><th>Sendungsnummer</th><th>Art</th><th>Regal</th><th>Status</th></tr></thead><tbody>${l.map(p => `<tr><td>${PS.fmtDate(p.receivedAt)}</td><td>${esc(p.tracking)}</td><td>${PS.typeLabel(p)}</td><td>${esc(p.shelf)}</td><td>${esc(PS.statusLabel(p))}${p.pickedUpAt ? ' ' + PS.fmtDate(p.pickedUpAt) : ''}${p.handedOverAt ? ' ' + PS.fmtDate(p.handedOverAt) : ''}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
  }

  function handoverHtml(carrierId, ps) {
    return `<div class="head"><div><b style="font-size:13pt">${esc(state.settings.shop.name)}</b><br>${shopBlock({ ...state.settings.shop, name: '' })}</div><div class="right">${PS.fmtDateTime(new Date())}</div></div>
      <h1>Übergabeliste ${esc(cname(carrierId))}</h1>
      <p>${ps.length} Sendungen zur Abholung durch den Fahrer:</p>
      <table class="small"><thead><tr><th style="width:12mm">Nr.</th><th>Sendungsnummer</th><th>Art</th><th>Eingang</th></tr></thead>
        <tbody>${ps.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.tracking)}</td><td>${p.type === 'retoure' ? 'Retoure' : 'Rücksendung (nicht abgeholt)'}</td><td>${PS.fmtDate(p.receivedAt)}</td></tr>`).join('')}</tbody></table>
      <div class="sign"><div>Datum, Unterschrift Fahrer</div><div>Datum, Unterschrift Paketshop</div></div>`;
  }

  /* ================= Backup ================= */
  function exportBackup() {
    state.meta.lastBackupAt = nowIso(); save();
    download(`paketlager-backup-${PS.monthKey(new Date())}-${String(new Date().getDate()).padStart(2, '0')}.json`, JSON.stringify(state, null, 1), 'application/json');
    toast('Backup heruntergeladen');
  }

  /* ================= Ansicht: Einstellungen ================= */
  function viewEinstellungen() {
    const S = state.settings, sh = S.shop;
    const inp = (id, label, val, extra = '') => `<label class="fld">${label}<input id="${id}" type="text" value="${esc(val)}" ${extra}></label>`;
    $('#view').innerHTML = `
      <form id="setForm">
      <section class="card"><h2>Mein Shop (Absender auf Rechnungen)</h2>
        <div class="grid g2">
          ${inp('s-name', 'Name des Shops', sh.name)}${inp('s-owner', 'Inhaber/in', sh.owner)}
          ${inp('s-street', 'Straße und Hausnummer', sh.street)}
          <div class="grid g2 keep">${inp('s-zip', 'PLZ', sh.zip)}${inp('s-city', 'Ort', sh.city)}</div>
          ${inp('s-phone', 'Telefon', sh.phone)}${inp('s-email', 'E-Mail', sh.email)}
          ${inp('s-taxNo', 'Steuernummer', sh.taxNo)}${inp('s-vatId', 'USt-IdNr. (optional)', sh.vatId)}
          ${inp('s-bank', 'Bank', sh.bank)}${inp('s-iban', 'IBAN', sh.iban)}${inp('s-bic', 'BIC', sh.bic)}
        </div></section>
      <section class="card"><h2>Steuer, Fristen</h2>
        <div class="grid g3">
          <label class="fld">MwSt-Satz in %<input id="s-vat" type="text" inputmode="decimal" value="${S.vat.rate}"></label>
          <label class="fld">Zahlungsziel (Tage)<input id="s-pay" type="text" inputmode="numeric" value="${S.paymentDays}"></label>
          <label class="fld">Lagerfrist für Pakete (Tage)<input id="s-store" type="text" inputmode="numeric" value="${S.storageDays}"></label>
        </div>
        <label class="chk-line" style="margin-top:12px"><input type="checkbox" id="s-kleinu" ${S.vat.kleinunternehmer ? 'checked' : ''}> Kleinunternehmer (§ 19 UStG, keine Umsatzsteuer auf Rechnungen)</label>
        <p class="hint">Pakete, die länger als die Lagerfrist im Regal liegen, werden als „überfällig“ markiert (Rücksendung an den Anbieter).</p></section>
      <section class="card"><h2>Anbieter und Vergütung</h2>
        <p class="hint" style="margin-top:-4px">Trage hier ein, was dir der Anbieter pro Paket zahlt (laut Vertrag/Partnervereinbarung) – daraus entstehen die Rechnungen. Nettobeträge in €, z. B. 0,25.</p>
        <div class="grid g3">${CARRIER_IDS.map(id => { const c = S.carriers[id]; return `<div class="card" style="margin:0;border-top:4px solid var(--c-${id})"><h3>${esc(cname(id))}</h3>
          <div class="grid">
            ${inp('c-' + id + '-company', 'Firma (Rechnungsempfänger)', c.company)}
            <label class="fld">Anschrift<textarea id="c-${id}-address" rows="3" placeholder="Straße&#10;PLZ Ort">${esc(c.address)}</textarea></label>
            ${inp('c-' + id + '-no', 'Partner-/Kundennummer', c.customerNo)}
            <label class="fld">Vergütung je Paket (netto €)<input id="c-${id}-rp" type="text" inputmode="decimal" value="${c.ratePaket ? String(c.ratePaket).replace('.', ',') : ''}" placeholder="0,00"></label>
            <label class="fld">Vergütung je Retoure (netto €)<input id="c-${id}-rr" type="text" inputmode="decimal" value="${c.rateRetoure ? String(c.rateRetoure).replace('.', ',') : ''}" placeholder="0,00"></label>
          </div></div>`; }).join('')}</div></section>
      <div class="btn-row" style="margin-bottom:16px"><button class="btn primary big" type="submit">Einstellungen speichern</button></div>
      </form>

      <section class="card"><h2>Daten &amp; Backup</h2>
        <p>Alle Daten (${state.parcels.length} Sendungen, ${state.invoices.length} Rechnungen) liegen <b>nur in diesem Browser auf diesem Gerät</b>. Mach regelmäßig ein Backup und bewahre die Datei sicher auf.
        ${state.meta.lastBackupAt ? `Letztes Backup: ${PS.fmtDateTime(state.meta.lastBackupAt)}.` : 'Noch kein Backup erstellt.'}</p>
        <div class="btn-row">
          <button class="btn primary" id="btnExport">Backup herunterladen</button>
          <label class="btn" style="cursor:pointer">Backup einspielen …<input id="fileImport" type="file" accept="application/json,.json" hidden></label>
          <button class="btn" id="btnDemo">Beispieldaten laden</button>
          <button class="btn danger" id="btnWipe">Alles löschen</button>
        </div></section>`;

    $('#setForm').addEventListener('submit', e => {
      e.preventDefault();
      const v = id => $('#' + id).value.trim();
      Object.assign(S.shop, { name: v('s-name'), owner: v('s-owner'), street: v('s-street'), zip: v('s-zip'), city: v('s-city'), phone: v('s-phone'), email: v('s-email'), taxNo: v('s-taxNo'), vatId: v('s-vatId'), bank: v('s-bank'), iban: v('s-iban'), bic: v('s-bic') });
      S.vat.rate = Math.min(100, Math.max(0, PS.parseNum(v('s-vat')))); S.vat.kleinunternehmer = $('#s-kleinu').checked;
      S.paymentDays = Math.max(0, Math.round(PS.parseNum(v('s-pay')))); S.storageDays = Math.max(1, Math.round(PS.parseNum(v('s-store'))) || 7);
      CARRIER_IDS.forEach(id => Object.assign(S.carriers[id], { company: v(`c-${id}-company`), address: $(`#c-${id}-address`).value.trim(), customerNo: v(`c-${id}-no`), ratePaket: Math.max(0, PS.parseNum(v(`c-${id}-rp`))), rateRetoure: Math.max(0, PS.parseNum(v(`c-${id}-rr`))) }));
      changed(); toast('Einstellungen gespeichert');
    });
    $('#btnExport').onclick = () => { exportBackup(); render(); };
    $('#fileImport').onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const next = PS.normalizeState(JSON.parse(rd.result));
          if (!confirm(`Backup einspielen? Die aktuellen Daten (${state.parcels.length} Sendungen) werden ersetzt durch ${next.parcels.length} Sendungen und ${next.invoices.length} Rechnungen aus der Datei.`)) return;
          state = next; changed(); toast('Backup eingespielt');
        } catch (err) { toast('Import fehlgeschlagen: ' + err.message, true); }
      };
      rd.readAsText(file); e.target.value = '';
    };
    $('#btnDemo').onclick = () => {
      if (!confirm('Beispieldaten (ca. 70 Sendungen) zu den vorhandenen hinzufügen? Zum Ausprobieren gedacht.')) return;
      state.parcels.push(...PS.makeDemoData(new Date())); changed(); toast('Beispieldaten geladen');
    };
    $('#btnWipe').onclick = () => {
      if (!confirm('ALLE Sendungen, Rechnungen und Einstellungen unwiderruflich löschen?')) return;
      if (prompt('Zur Bestätigung bitte LÖSCHEN eintippen:') !== 'LÖSCHEN') return;
      state = PS.emptyState(); changed(); toast('Alles gelöscht');
    };
  }

  /* ================= Start ================= */
  window.addEventListener('hashchange', route);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) { /* optional */ }
  route();
})();
