/* ============================================================
   Excelsheet Time Filler - v0.3.0
   Bookmarklet: templates de semaine nommés + remplissage auto
   de la grille "Mes tâches" de Project Web App (PWA/Project Server).

   Nouveautés v0.3.0 :
   - Correction du texte invisible au survol des boutons
   - Autocomplétion du nom de tâche à partir des tâches réellement
     affichées dans la grille (datalist)
   - Bouton "🔄 Tâches" pour relire la liste à jour

   Nouveautés v0.2.0 :
   - Templates nommés (créer / sélectionner / supprimer plusieurs
     semaines types), sauvegardés en localStorage
   - Suppression des colonnes Samedi / Dimanche (non travaillés)
   - Nouvelle charte graphique

   Usage :
   - Colle tout ce fichier dans la console DevTools de la page
     Tâches PWA, ou installe-le en bookmarklet (voir install.html).
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'pwaTimeFiller_templates_v2';
  const GRID_ID = 'ctl00_ctl00_ctl40_g_59b0a653_1164_47a9_b8c6_ad27fa750537_MyTasksJSGridControl';
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']; // colonnes 1 à 5 (Sam/Dim exclus)
  const CLICK_DELAY = 250;
  const TYPE_DELAY = 200;
  const ROW_DELAY = 500;

  // ---------- Charte graphique ----------
  const COLORS = {
    bg: '#FFFFFF',
    primary: '#0C419A',
    secondary: '#006386',
    text: '#222324',
    surface: '#F9F9F9',
    surfaceAlt: '#E7ECF5'
  };

  // ---------- Style du panneau ----------
  const style = document.createElement('style');
  style.textContent = `
    #pwaTimeFillerPanel {
      position: fixed; top: 20px; right: 20px; width: 600px; max-height: 85vh;
      overflow-y: auto; background: ${COLORS.bg}; border: 2px solid ${COLORS.primary}; border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25); z-index: 999999;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 13px; color: ${COLORS.text};
    }
    #pwaTimeFillerPanel * { box-sizing: border-box; }
    #pwaTimeFillerHeader {
      background: ${COLORS.primary}; color: #fff; padding: 8px 12px; border-radius: 6px 6px 0 0;
      display: flex; justify-content: space-between; align-items: center; cursor: move;
    }
    #pwaTimeFillerHeader b { font-size: 14px; }
    #pwaTimeFillerHeader button { background: transparent; border: none; color: #fff; font-size: 16px; cursor: pointer; }
    #pwaTimeFillerBody { padding: 12px; }

    .pwaTF-templateBar {
      display: flex; gap: 6px; align-items: center; margin-bottom: 10px;
      background: ${COLORS.surfaceAlt}; padding: 8px; border-radius: 6px;
    }
    .pwaTF-templateBar select {
      flex: 1; padding: 5px; border: 1px solid ${COLORS.primary}; border-radius: 4px; background: ${COLORS.bg}; color: ${COLORS.text};
    }
    .pwaTF-templateBar input[type=text] {
      flex: 1; padding: 5px; border: 1px solid ${COLORS.primary}; border-radius: 4px; color: ${COLORS.text};
    }
    .pwaTF-templateBar button {
      border: none; border-radius: 4px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .pwaTF-btnNew { background: ${COLORS.secondary}; color: #fff !important; }
    .pwaTF-btnNew:hover { background: #004a66; color: #fff !important; }
    .pwaTF-btnDelete { background: #F9F9F9; color: #B00020 !important; border: 1px solid #B00020 !important; }
    .pwaTF-btnDelete:hover { background: #fbeaea; color: #B00020 !important; }
    .pwaTF-btnRefresh { background: ${COLORS.surface}; color: ${COLORS.text} !important; border: 1px solid ${COLORS.primary} !important; }
    .pwaTF-btnRefresh:hover { background: ${COLORS.surfaceAlt}; color: ${COLORS.text} !important; }

    #pwaTimeFillerTable { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    #pwaTimeFillerTable th, #pwaTimeFillerTable td { border: 1px solid ${COLORS.surfaceAlt}; padding: 3px; }
    #pwaTimeFillerTable th { background: ${COLORS.surface}; font-weight: 600; font-size: 12px; color: ${COLORS.text}; }
    #pwaTimeFillerTable td { background: ${COLORS.bg}; }
    #pwaTimeFillerTable input[type=text] {
      width: 100%; border: 1px solid ${COLORS.surfaceAlt}; padding: 3px; font-size: 12px; color: ${COLORS.text}; border-radius: 3px;
    }
    #pwaTimeFillerTable input[type=text]:focus { outline: none; border-color: ${COLORS.primary}; box-shadow: 0 0 0 1px ${COLORS.primary}; }
    #pwaTimeFillerTable input.taskInput { min-width: 200px; }
    #pwaTimeFillerTable input.dayInput { width: 52px; text-align: center; }
    #pwaTimeFillerTable td.rmCell { text-align: center; }
    #pwaTimeFillerTable td.rmCell button { color: #B00020; border: none; background: transparent; cursor: pointer; font-weight: bold; }

    .pwaTimeFillerBtnRow { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .pwaTimeFillerBtnRow button {
      padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;
    }
    .btnAdd { background: ${COLORS.surface}; color: ${COLORS.text} !important; border: 1px solid ${COLORS.surfaceAlt} !important; }
    .btnAdd:hover { background: ${COLORS.surfaceAlt}; color: ${COLORS.text} !important; }
    .btnSave { background: ${COLORS.primary}; color: #fff !important; }
    .btnSave:hover { background: #08316f; color: #fff !important; }
    .btnApply { background: ${COLORS.secondary}; color: #fff !important; }
    .btnApply:hover { background: #004a66; color: #fff !important; }

    #pwaTimeFillerLog {
      margin-top: 10px; background: ${COLORS.surface}; border: 1px solid ${COLORS.surfaceAlt}; border-radius: 4px;
      padding: 6px 8px; max-height: 140px; overflow-y: auto; font-family: Consolas, monospace; font-size: 11px;
      white-space: pre-wrap; color: ${COLORS.text};
    }
  `;
  document.head.appendChild(style);

  // ---------- Construction du panneau ----------
  const panel = document.createElement('div');
  panel.id = 'pwaTimeFillerPanel';
  panel.innerHTML = `
    <div id="pwaTimeFillerHeader">
      <b>PWA Time Filler — Templates de semaine</b>
      <button id="pwaTimeFillerClose" title="Fermer">✕</button>
    </div>
    <div id="pwaTimeFillerBody">

      <div class="pwaTF-templateBar">
        <select id="pwaTF-select"></select>
        <input type="text" id="pwaTF-newName" placeholder="Nom du nouveau template">
        <button class="pwaTF-btnNew" id="pwaTF-btnNew">+ Nouveau</button>
        <button class="pwaTF-btnDelete" id="pwaTF-btnDelete">🗑 Supprimer</button>
        <button class="pwaTF-btnRefresh" id="pwaTF-btnRefresh" title="Relire les noms de tâches visibles dans la grille">🔄 Tâches</button>
      </div>
      <datalist id="pwaTF-taskList"></datalist>

      <table id="pwaTimeFillerTable">
        <thead>
          <tr>
            <th>Nom de tâche (texte recherché)</th>
            ${DAY_LABELS.map(d => `<th>${d}</th>`).join('')}
            <th></th>
          </tr>
        </thead>
        <tbody id="pwaTimeFillerRows"></tbody>
      </table>

      <div class="pwaTimeFillerBtnRow">
        <button class="btnAdd" id="btnAddRow">+ Ajouter une ligne</button>
        <button class="btnSave" id="btnSaveTemplate">💾 Enregistrer ce template</button>
        <button class="btnApply" id="btnApplyWeek">▶ Appliquer sur la semaine</button>
      </div>

      <div id="pwaTimeFillerLog"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const rowsBody = panel.querySelector('#pwaTimeFillerRows');
  const logBox = panel.querySelector('#pwaTimeFillerLog');
  const selectEl = panel.querySelector('#pwaTF-select');
  const newNameEl = panel.querySelector('#pwaTF-newName');

  function log(msg) {
    const line = document.createElement('div');
    line.textContent = msg;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // ---------- Gestion des lignes de la table ----------
  function addRow(data) {
    data = data || { task: '', days: DAY_LABELS.map(() => '') };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="taskInput" list="pwaTF-taskList" placeholder="ex: Développement Frontend" value="${escapeHtml(data.task)}"></td>
      ${data.days.map(v => `<td><input type="text" class="dayInput" value="${escapeHtml(v)}" placeholder="1j"></td>`).join('')}
      <td class="rmCell"><button title="Supprimer la ligne">✕</button></td>
    `;
    tr.querySelector('.rmCell button').addEventListener('click', () => tr.remove());
    rowsBody.appendChild(tr);
  }

  function getRowsFromUI() {
    const rows = [];
    rowsBody.querySelectorAll('tr').forEach(tr => {
      const task = tr.querySelector('.taskInput').value.trim();
      const days = Array.from(tr.querySelectorAll('.dayInput')).map(i => i.value.trim());
      if (task) rows.push({ task, days });
    });
    return rows;
  }

  function loadRowsIntoUI(rows) {
    rowsBody.innerHTML = '';
    if (!rows || !rows.length) { addRow(); return; }
    rows.forEach(addRow);
  }

  // ---------- Persistance multi-templates ----------
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { templates: {}, lastUsed: null };
    } catch (e) {
      return { templates: {}, lastUsed: null };
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function refreshSelect(store, selected) {
    const names = Object.keys(store.templates);
    selectEl.innerHTML = names.length
      ? names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')
      : `<option value="">(aucun template)</option>`;
    if (selected && names.includes(selected)) selectEl.value = selected;
  }

  function currentTemplateName() {
    return selectEl.value || null;
  }

  function saveCurrentTemplate() {
    const name = currentTemplateName();
    if (!name) { log('⚠ Aucun template sélectionné. Crée-en un d’abord avec "+ Nouveau".'); return; }
    const store = loadStore();
    store.templates[name] = getRowsFromUI();
    store.lastUsed = name;
    saveStore(store);
    log('✅ Template "' + name + '" enregistré (' + store.templates[name].length + ' ligne(s)).');
  }

  function createNewTemplate() {
    const name = newNameEl.value.trim();
    if (!name) { log('⚠ Donne un nom au nouveau template.'); return; }
    const store = loadStore();
    if (store.templates[name]) {
      if (!confirm('Un template "' + name + '" existe déjà. L’écraser ?')) return;
    }
    const currentRows = getRowsFromUI();
    store.templates[name] = currentRows.length ? currentRows : [{ task: '', days: DAY_LABELS.map(() => '') }];
    store.lastUsed = name;
    saveStore(store);
    refreshSelect(store, name);
    newNameEl.value = '';
    log('✅ Template "' + name + '" créé.');
  }

  function deleteCurrentTemplate() {
    const name = currentTemplateName();
    if (!name) { log('⚠ Aucun template à supprimer.'); return; }
    if (!confirm('Supprimer le template "' + name + '" ?')) return;
    const store = loadStore();
    delete store.templates[name];
    store.lastUsed = Object.keys(store.templates)[0] || null;
    saveStore(store);
    refreshSelect(store, store.lastUsed);
    if (store.lastUsed) {
      loadRowsIntoUI(store.templates[store.lastUsed]);
    } else {
      loadRowsIntoUI(null);
    }
    log('🗑 Template "' + name + '" supprimé.');
  }

  selectEl.addEventListener('change', () => {
    const store = loadStore();
    const name = currentTemplateName();
    if (name && store.templates[name]) {
      loadRowsIntoUI(store.templates[name]);
      store.lastUsed = name;
      saveStore(store);
      log('📂 Template "' + name + '" chargé.');
    }
  });

  panel.querySelector('#pwaTF-btnNew').addEventListener('click', createNewTemplate);
  panel.querySelector('#pwaTF-btnDelete').addEventListener('click', deleteCurrentTemplate);
  panel.querySelector('#btnSaveTemplate').addEventListener('click', saveCurrentTemplate);
  panel.querySelector('#btnAddRow').addEventListener('click', () => addRow());

  // ---------- Autocomplétion des noms de tâches ----------
  const taskListEl = panel.querySelector('#pwaTF-taskList');

  function scanTaskNames() {
    const leftTable = document.getElementById(GRID_ID + '_leftpane_mainTable');
    if (!leftTable) { log('⚠ Grille introuvable, impossible de lire les tâches.'); return; }
    const leftRows = Array.from(leftTable.querySelector('tbody').children);
    const names = new Set();

    leftRows.forEach(row => {
      // Les vraies lignes de tâche sont au niveau hiérarchique 3 (aria-level="3")
      // les niveaux 1 et 2 sont des en-têtes de projet / de regroupement.
      if (row.getAttribute('aria-level') !== '3') return;
      const link = row.querySelector('a');
      if (link) {
        const text = link.textContent.trim();
        if (text) names.add(text);
      }
    });

    taskListEl.innerHTML = Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map(n => `<option value="${escapeHtml(n)}"></option>`)
      .join('');

    log('🔄 ' + names.size + ' tâche(s) lue(s) dans la grille pour l’autocomplétion.');
  }

  panel.querySelector('#pwaTF-btnRefresh').addEventListener('click', scanTaskNames);

  // ---------- Automatisation grille PWA ----------
  function findRowIndex(taskText) {
    const leftTable = document.getElementById(GRID_ID + '_leftpane_mainTable');
    if (!leftTable) return -1;
    const leftRows = Array.from(leftTable.querySelector('tbody').children);
    for (let i = 0; i < leftRows.length; i++) {
      const link = leftRows[i].querySelector('a');
      if (link && link.textContent.trim().includes(taskText)) return i;
    }
    return -1;
  }

  function getCell(rowIndex, dayCol) {
    const rightTable = document.getElementById(GRID_ID + '_rightpane_mainTable');
    if (!rightTable) return null;
    const rightRows = Array.from(rightTable.querySelector('tbody').children);
    const row = rightRows[rowIndex];
    return row ? row.children[dayCol] : null;
  }

  function clickCell(cell) {
    const rect = cell.getBoundingClientRect();
    const opts = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    cell.dispatchEvent(new MouseEvent('mousedown', opts));
    cell.dispatchEvent(new MouseEvent('mouseup', opts));
    cell.dispatchEvent(new MouseEvent('click', opts));
  }

  function fillCell(rowIndex, dayCol, value) {
    return new Promise((resolve, reject) => {
      const cell = getCell(rowIndex, dayCol);
      if (!cell) { reject('Cellule introuvable (ligne ' + rowIndex + ', col ' + dayCol + ')'); return; }
      cell.scrollIntoView({ block: 'center' });

      clickCell(cell);

      setTimeout(() => {
        clickCell(cell);

        setTimeout(() => {
          const editbox = document.getElementById('jsgrid_editbox' + GRID_ID);
          if (!editbox) { reject('Editbox introuvable'); return; }
          editbox.focus();

          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(editbox, '');
          editbox.dispatchEvent(new Event('input', { bubbles: true }));

          let current = '';
          value.split('').forEach(ch => {
            current += ch;
            nativeSetter.call(editbox, current);
            editbox.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
            editbox.dispatchEvent(new KeyboardEvent('keypress', { key: ch, bubbles: true }));
            editbox.dispatchEvent(new Event('input', { bubbles: true }));
            editbox.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
          });

          setTimeout(() => {
            editbox.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Tab', code: 'Tab', keyCode: 9, which: 9, bubbles: true, cancelable: true
            }));
            resolve();
          }, TYPE_DELAY);

        }, CLICK_DELAY);
      }, CLICK_DELAY);
    });
  }

  async function applyWeek() {
    const rows = getRowsFromUI();
    if (!rows.length) { log('⚠ Aucune ligne à appliquer.'); return; }

    saveCurrentTemplate();
    log('▶ Démarrage de l’application du template (' + rows.length + ' ligne(s))...');
    let ok = 0, fail = 0;

    for (const row of rows) {
      const rowIndex = findRowIndex(row.task);
      if (rowIndex === -1) {
        log('✗ Tâche introuvable : "' + row.task + '" (vérifie qu’elle est bien visible dans la grille)');
        fail++;
        continue;
      }
      for (let dayCol = 1; dayCol <= DAY_LABELS.length; dayCol++) {
        const val = row.days[dayCol - 1];
        if (!val) continue;
        try {
          await fillCell(rowIndex, dayCol, val);
          log('✓ ' + row.task + ' — ' + DAY_LABELS[dayCol - 1] + ' = ' + val);
          ok++;
        } catch (e) {
          log('✗ Erreur sur ' + row.task + ' / ' + DAY_LABELS[dayCol - 1] + ' : ' + e);
          fail++;
        }
        await new Promise(r => setTimeout(r, ROW_DELAY));
      }
    }
    log('🏁 Terminé : ' + ok + ' cellule(s) remplie(s), ' + fail + ' erreur(s).');
  }

  panel.querySelector('#btnApplyWeek').addEventListener('click', applyWeek);
  panel.querySelector('#pwaTimeFillerClose').addEventListener('click', () => panel.remove());

  // ---------- Drag du panneau ----------
  (function makeDraggable() {
    const header = panel.querySelector('#pwaTimeFillerHeader');
    let dragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => dragging = false);
  })();

  // ---------- Initialisation ----------
  const initialStore = loadStore();
  if (!Object.keys(initialStore.templates).length) {
    initialStore.templates['Semaine type'] = [{ task: '', days: DAY_LABELS.map(() => '') }];
    initialStore.lastUsed = 'Semaine type';
    saveStore(initialStore);
  }
  refreshSelect(initialStore, initialStore.lastUsed);
  loadRowsIntoUI(initialStore.templates[initialStore.lastUsed] || initialStore.templates[Object.keys(initialStore.templates)[0]]);
  scanTaskNames();
  log('Panneau chargé. Sélectionne ou crée un template, puis "Appliquer sur la semaine".');

})();
