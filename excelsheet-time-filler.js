/* ============================================================
   Excelsheet Time Filler - v0.6.8
   Nouveautés v0.6.8 :
   - Ajout d'une fonction d'initialisation pour fermer proprement
     toute édition en cours avant de démarrer (évite les conflits de focus).
   - Remplacement de la validation par 'Tab' par une validation 'Enter' + blur()
     qui remet la grille à l'état "Idle" après chaque cellule écrite.
   - Suppression définitive de tout risque de décalage de jours.
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'pwaTimeFiller_templates_v2';
  const GRID_ID = 'ctl00_ctl00_ctl40_g_59b0a653_1164_47a9_b8c6_ad27fa750537_MyTasksJSGridControl';
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  const CLICK_DELAY = 250;
  const TYPE_DELAY = 200;
  const ROW_DELAY = 500;

  const COLORS = {
    bg: '#FFFFFF',
    primary: '#0C419A',
    secondary: '#006386',
    text: '#222324',
    surface: '#F9F9F9',
    surfaceAlt: '#E7ECF5',
    border: '#E2E8F0'
  };

  const style = document.createElement('style');
  style.textContent = `
    #pwaTimeFillerPanel {
      position: fixed !important; 
      top: 20px; 
      right: 20px; 
      width: 660px; 
      height: 480px; 
      min-width: 500px !important; 
      max-width: 95vw !important;
      min-height: 300px !important;
      max-height: 90vh !important;
      display: flex !important; 
      flex-direction: column !important;
      background: ${COLORS.bg} !important; 
      border: 1px solid rgba(12, 65, 154, 0.2) !important; 
      border-radius: 12px !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; 
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; 
      font-size: 13px !important; 
      color: ${COLORS.text} !important;
      overflow: hidden !important; 
      box-sizing: border-box !important;
    }
    #pwaTimeFillerPanel * { box-sizing: border-box !important; }
    
    #pwaTimeFillerHeader {
      position: relative !important;
      background: ${COLORS.primary} !important; 
      color: #fff !important; 
      padding: 12px 16px !important; 
      border-radius: 11px 11px 0 0 !important;
      display: flex !important; 
      align-items: center !important; 
      cursor: move !important;
      flex-shrink: 0 !important;
      user-select: none !important;
    }
    #pwaTimeFillerHeader b { 
      font-size: 14px !important; 
      font-weight: 600 !important; 
      padding-right: 80px !important;
    }
    
    #pwaTimeFillerHeader button#pwaTimeFillerClose { 
      position: absolute !important;
      top: 50% !important;
      right: 16px !important;
      transform: translateY(-50%) !important;
      width: 24px !important;
      height: 24px !important;
      min-width: 24px !important;
      max-width: 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: transparent !important; 
      border: none !important; 
      color: #fff !important; 
      font-size: 16px !important; 
      font-weight: bold !important;
      cursor: pointer !important; 
      padding: 0 !important;
      margin: 0 !important;
      opacity: 0.8 !important; 
      line-height: 1 !important;
      transition: opacity 0.2s !important; 
    }
    #pwaTimeFillerHeader button#pwaTimeFillerClose:hover { opacity: 1 !important; }

    #pwaTimeFillerHeader button#pwaTimeFillerMinimize { 
      position: absolute !important;
      top: 50% !important;
      right: 46px !important;
      transform: translateY(-50%) !important;
      width: 24px !important;
      height: 24px !important;
      min-width: 24px !important;
      max-width: 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: transparent !important; 
      border: none !important; 
      color: #fff !important; 
      font-size: 14px !important; 
      font-weight: bold !important;
      cursor: pointer !important; 
      padding: 0 !important;
      margin: 0 !important;
      opacity: 0.8 !important; 
      line-height: 1 !important;
      transition: opacity 0.2s !important; 
    }
    #pwaTimeFillerHeader button#pwaTimeFillerMinimize:hover { opacity: 1 !important; }
    
    #pwaTimeFillerBody { 
      padding: 16px !important; 
      position: relative !important; 
      flex-grow: 1 !important; 
      display: flex !important; 
      flex-direction: column !important; 
      overflow-y: auto !important; 
    }

    .pwaTF-templateBar {
      display: flex !important; gap: 8px !important; align-items: center !important; margin-bottom: 12px !important;
      background: ${COLORS.surfaceAlt} !important; padding: 10px !important; border-radius: 8px !important;
      flex-shrink: 0 !important;
    }
    .pwaTF-templateBar select {
      flex: 1 !important; height: 36px !important; padding: 0 10px !important; border: 1px solid #ced4da !important; 
      border-radius: 6px !important; background: ${COLORS.bg} !important; color: ${COLORS.text} !important;
      font-size: 13px !important; cursor: pointer !important; outline: none !important;
    }
    
    .pwaTF-templateBar button {
      height: 36px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important;
      gap: 6px !important; padding: 0 12px !important; border-radius: 6px !important; font-size: 13px !important; font-weight: 600 !important; 
      cursor: pointer !important; transition: all 0.2s ease !important; border: none !important;
    }
    
    .pwaTF-btnNew { background: ${COLORS.secondary} !important; color: #fff !important; }
    .pwaTF-btnNew:hover { background: #004a66 !important; transform: translateY(-1px) !important; }
    
    .pwaTF-btnDelete { 
      background: #FFFFFF !important; color: #B00020 !important; 
      border: 1px solid #e0b6bc !important; 
    }
    .pwaTF-btnDelete:hover { background: #fbeaea !important; border-color: #B00020 !important; }
    
    .pwaTF-btnRefresh { 
      background: #FFFFFF !important; color: ${COLORS.text} !important; 
      border: 1px solid #ced4da !important; 
    }
    .pwaTF-btnRefresh:hover { background: ${COLORS.surface} !important; border-color: ${COLORS.primary} !important; }

    .pwaTimeFillerTableContainer {
      flex-grow: 1 !important;
      overflow-x: hidden !important;
      overflow-y: visible !important; 
      margin: 12px 0 !important;
    }
    #pwaTimeFillerTable { 
      width: 100% !important; 
      border-collapse: collapse !important; 
      table-layout: fixed !important; 
    }
    #pwaTimeFillerTable th { 
      background: #F9F9F9 !important; font-weight: 600 !important; font-size: 12px !important; color: ${COLORS.text} !important; 
      padding: 8px !important; text-align: left !important; border-bottom: 2px solid ${COLORS.surfaceAlt} !important;
    }
    #pwaTimeFillerTable td { padding: 6px 4px !important; border-bottom: 1px solid ${COLORS.surfaceAlt} !important; vertical-align: middle !important; }
    
    #pwaTimeFillerTable input[type=text] {
      height: 30px !important; border: 1px solid #e0e0e0 !important; padding: 0 8px !important; font-size: 12px !important; 
      color: ${COLORS.text} !important; border-radius: 4px !important; transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    #pwaTimeFillerTable input[type=text]:focus { 
      outline: none !important; border-color: ${COLORS.primary} !important; background-color: #fff !important;
      box-shadow: 0 0 0 2px rgba(12, 65, 154, 0.15) !important; 
    }
    #pwaTimeFillerTable input.taskInput { width: 100% !important; }
    #pwaTimeFillerTable input.dayInput { width: 100% !important; text-align: center !important; font-weight: 600 !important; background-color: #fafafa !important; }
    
    .col-delete { width: 36px !important; text-align: center !important; }
    #pwaTimeFillerTable td.rmCell { 
      text-align: center !important; 
      width: 36px !important; 
      padding: 0 !important;
    }
    
    #pwaTimeFillerTable td.rmCell button { 
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 24px !important;
      height: 24px !important;
      min-width: 24px !important;
      max-width: 24px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      color: #B00020 !important; 
      border: none !important; 
      background: transparent !important; 
      cursor: pointer !important; 
      font-size: 18px !important; 
      font-weight: bold !important; 
      line-height: 1 !important;
      opacity: 0.6 !important;
      transition: opacity 0.2s, transform 0.1s !important;
    }
    #pwaTimeFillerTable td.rmCell button:hover { 
      opacity: 1 !important; 
      transform: scale(1.15) !important;
    }

    .pwaTimeFillerBtnRow { display: flex !important; gap: 10px !important; margin-top: auto !important; justify-content: space-between !important; flex-shrink: 0 !important; }
    .pwaTimeFillerBtnRow button {
      height: 38px !important; padding: 0 16px !important; border: none !important; border-radius: 6px !important; cursor: pointer !important; 
      font-size: 13px !important; font-weight: 600 !important; transition: all 0.2s ease !important;
      display: inline-flex !important; align-items: center !important; gap: 8px !important;
    }
    
    .btnAdd { background: #F9F9F9 !important; color: ${COLORS.text} !important; border: 1px solid #ced4da !important; }
    .btnAdd:hover { background: ${COLORS.surfaceAlt} !important; border-color: ${COLORS.primary} !important; }
    
    .btnApply { 
      background: ${COLORS.secondary} !important; color: #fff !important; 
      box-shadow: 0 2px 6px rgba(0, 99, 134, 0.2) !important; margin-left: auto !important;
    }
    .btnApply:hover { 
      background: #004a66 !important; 
      box-shadow: 0 4px 12px rgba(0, 99, 134, 0.3) !important; 
      transform: translateY(-1px) !important; 
    }

    #pwaTimeFillerStatusBar {
      background: #F1F5F9 !important; border-top: 1px solid ${COLORS.border} !important;
      padding: 8px 16px !important; border-radius: 0 0 11px 11px !important;
      font-size: 11px !important; color: #64748B !important; font-weight: 500 !important;
      display: flex !important; align-items: center !important; justify-content: space-between !important;
      flex-shrink: 0 !important;
      position: relative !important;
    }

    .pwaTF-resize-handle {
      position: absolute !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 14px !important;
      height: 14px !important;
      cursor: se-resize !important;
      background: linear-gradient(135deg, transparent 40%, #64748B 40%, #64748B 60%, transparent 60%, transparent 80%, #64748B 80%) !important;
      background-size: 4px 4px !important;
      border-bottom-right-radius: 11px !important;
      z-index: 1000000 !important;
    }

    .pwaTF-toast {
      position: absolute !important; bottom: 70px !important; left: 50% !important; transform: translateX(-50%) !important;
      background: rgba(15, 23, 42, 0.9) !important; color: #FFF !important; padding: 8px 16px !important;
      border-radius: 20px !important; font-size: 12px !important; font-weight: 500 !important; pointer-events: none !important;
      opacity: 0 !important; transition: opacity 0.3s, transform 0.3s !important; z-index: 10000 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    .pwaTF-toast.show { opacity: 1 !important; transform: translate(-50%, -5px) !important; }
  `;
  document.head.appendChild(style);

  // ---------- Construction du panneau ----------
  const panel = document.createElement('div');
  panel.id = 'pwaTimeFillerPanel';
  panel.innerHTML = `
    <div id="pwaTimeFillerHeader">
      <b>PWA Time Filler — Templates de semaine</b>
      <button id="pwaTimeFillerMinimize" title="Réduire">—</button>
      <button id="pwaTimeFillerClose" title="Fermer">✕</button>
    </div>
    <div id="pwaTimeFillerBody">
      <div id="pwaTF-toastContainer" class="pwaTF-toast"></div>

      <div class="pwaTF-templateBar">
        <select id="pwaTF-select"></select>
        <button class="pwaTF-btnNew" id="pwaTF-btnNew">➕ Nouveau</button>
        <button class="pwaTF-btnDelete" id="pwaTF-btnDelete" title="Supprimer ce template">🗑 Supprimer</button>
        <button class="pwaTF-btnRefresh" id="pwaTF-btnRefresh" title="Relire les noms de tâches visibles">🔄 Tâches</button>
      </div>
      <datalist id="pwaTF-taskList"></datalist>

      <div class="pwaTimeFillerTableContainer">
        <table id="pwaTimeFillerTable">
          <thead>
            <tr>
              <th style="width: auto;">Nom de tâche (texte recherché)</th>
              ${DAY_LABELS.map(d => `<th style="text-align: center; width: 62px;">${d}</th>`).join('')}
              <th class="col-delete"></th>
            </tr>
          </thead>
          <tbody id="pwaTimeFillerRows"></tbody>
        </table>
      </div>

      <div class="pwaTimeFillerBtnRow">
        <button class="btnAdd" id="btnAddRow">➕ Ajouter une ligne</button>
        <button class="btnApply" id="btnApplyWeek">▶ Appliquer sur la semaine</button>
      </div>
    </div>
    <div id="pwaTimeFillerStatusBar">
      <span id="pwaStatusText">🟢 Prêt</span>
      <span id="pwaStatusSub">Dernière sauvegarde : auto</span>
      <div class="pwaTF-resize-handle" id="pwaTFResizeHandle"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const rowsBody = panel.querySelector('#pwaTimeFillerRows');
  const selectEl = panel.querySelector('#pwaTF-select');
  const statusText = panel.querySelector('#pwaStatusText');
  const statusSub = panel.querySelector('#pwaStatusSub');
  const toastEl = panel.querySelector('#pwaTF-toastContainer');

  function setStatus(text, subText = 'Sauvegarde automatique active') {
    statusText.textContent = text;
    if (subText) statusSub.textContent = subText;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // ---------- Gestion des lignes de la table ----------
  function addRow(data) {
    data = data || { task: '', days: DAY_LABELS.map(() => '') };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="taskInput" list="pwaTF-taskList" placeholder="ex: Développement..." value="${escapeHtml(data.task)}"></td>
      ${data.days.map(v => `<td><input type="text" class="dayInput" value="${escapeHtml(v)}" placeholder="1j"></td>`).join('')}
      <td class="rmCell"><button title="Supprimer la ligne">&times;</button></td>
    `;
    
    tr.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', triggerAutoSave);
    });
    
    tr.querySelector('.rmCell button').addEventListener('click', () => {
      tr.remove();
      triggerAutoSave();
    });
    
    rowsBody.appendChild(tr);
  }

  function getRowsFromUI() {
    const rows = [];
    rowsBody.querySelectorAll('tr').forEach(tr => {
      const task = tr.querySelector('.taskInput').value.trim();
      const days = Array.from(tr.querySelectorAll('.dayInput')).map(i => i.value.trim());
      if (task || days.some(d => d !== '')) {
        rows.push({ task, days });
      }
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

  let autoSaveTimeout;
  function triggerAutoSave() {
    clearTimeout(autoSaveTimeout);
    setStatus('✍️ Saisie en cours...');
    autoSaveTimeout = setTimeout(() => {
      const name = currentTemplateName();
      if (!name) return;
      const store = loadStore();
      store.templates[name] = getRowsFromUI();
      saveStore(store);
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setStatus('🟢 Prêt', `Modifié à ${now}`);
    }, 500);
  }

  function createNewTemplate() {
    const name = prompt('Nom du nouveau template :');
    if (name === null) return;
    const trimmedName = name.trim();
    if (!trimmedName) { alert('Le nom du template ne peut pas être vide.'); return; }
    
    const store = loadStore();
    if (store.templates[trimmedName]) {
      showToast('⚠️ Ce template existe déjà.');
      selectEl.value = trimmedName;
      loadRowsIntoUI(store.templates[trimmedName]);
      return;
    }
    
    store.templates[trimmedName] = [{ task: '', days: DAY_LABELS.map(() => '') }];
    store.lastUsed = trimmedName;
    saveStore(store);
    refreshSelect(store, trimmedName);
    loadRowsIntoUI(store.templates[trimmedName]);
    showToast(`📂 "${trimmedName}" créé !`);
  }

  function deleteCurrentTemplate() {
    const name = currentTemplateName();
    if (!name) return;
    if (!confirm(`Supprimer le template "${name}" ?`)) return;
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
    showToast(`🗑️ "${name}" supprimé`);
  }

  selectEl.addEventListener('change', () => {
    const store = loadStore();
    const name = currentTemplateName();
    if (name && store.templates[name]) {
      loadRowsIntoUI(store.templates[name]);
      store.lastUsed = name;
      saveStore(store);
      showToast(`📂 "${name}" chargé`);
    }
  });

  panel.querySelector('#pwaTF-btnNew').addEventListener('click', createNewTemplate);
  panel.querySelector('#pwaTF-btnDelete').addEventListener('click', deleteCurrentTemplate);
  panel.querySelector('#btnAddRow').addEventListener('click', () => {
    addRow();
    triggerAutoSave();
  });

  // ---------- Autocomplétion des noms de tâches ----------
  const taskListEl = panel.querySelector('#pwaTF-taskList');

  function scanTaskNames() {
    const leftTable = document.getElementById(GRID_ID + '_leftpane_mainTable');
    if (!leftTable) {
      setStatus('⚠️ Erreur', 'Grille introuvable');
      return;
    }
    const leftRows = Array.from(leftTable.querySelector('tbody').children);
    const names = new Set();

    leftRows.forEach(row => {
      if (row.getAttribute('aria-level') !== '3') return;
      
      const links = Array.from(row.querySelectorAll('a'));
      const taskLink = links.find(l => l.textContent.trim().length > 0);
      
      if (taskLink) {
        let text = taskLink.textContent.trim();
        text = text.replace(/Nouveau\s*!?$/i, '').trim();
        if (text) names.add(text);
      }
    });

    taskListEl.innerHTML = Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map(n => `<option value="${escapeHtml(n)}"></option>`)
      .join('');

    showToast(`🔄 ${names.size} tâches synchronisées`);
  }

  panel.querySelector('#pwaTF-btnRefresh').addEventListener('click', scanTaskNames);

  // ---------- Automatisation grille PWA ----------
  
  function findRowIndex(taskText) {
    const leftTable = document.getElementById(GRID_ID + '_leftpane_mainTable');
    if (!leftTable) return -1;
    const leftRows = Array.from(leftTable.querySelector('tbody').children);
    
    for (let i = 0; i < leftRows.length; i++) {
      if (leftRows[i].getAttribute('aria-level') !== '3') continue;
      
      const links = Array.from(leftRows[i].querySelectorAll('a'));
      const hasMatch = links.some(link => {
        let text = link.textContent.trim();
        text = text.replace(/Nouveau\s*!?$/i, '').trim();
        return text.includes(taskText);
      });
      
      if (hasMatch) return i;
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

  // CORRECTION v0.6.8 : Libérer le focus de la grille JSGrid si un champ est déjà en cours d'édition
  function ensureGridIdle() {
    return new Promise(resolve => {
      const editbox = document.getElementById('jsgrid_editbox' + GRID_ID);
      if (editbox) {
        // Simule "Entrée" pour valider l'édition en cours
        editbox.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
        }));
        editbox.blur();
        setTimeout(resolve, 300); // Laisse le temps au script de PWA d'enregistrer proprement
      } else {
        resolve();
      }
    });
  }

  function fillCell(rowIndex, dayCol, value) {
    return new Promise((resolve, reject) => {
      const cell = getCell(rowIndex, dayCol);
      if (!cell) { reject('Cellule introuvable'); return; }
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

          // CORRECTION v0.6.8 : On valide avec 'Enter' et blur() à la place de 'Tab'
          // Cela réinitialise le focus de la grille à l'état "idle" pour la suite
          setTimeout(() => {
            editbox.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
            }));
            editbox.blur();
            resolve();
          }, TYPE_DELAY);

        }, CLICK_DELAY);
      }, CLICK_DELAY);
    });
  }

  async function applyWeek() {
    const rows = getRowsFromUI();
    if (!rows.length) { showToast('⚠️ Aucune ligne à saisir'); return; }

    const applyBtn = panel.querySelector('#btnApplyWeek');
    applyBtn.disabled = true;
    applyBtn.style.opacity = '0.5';

    setStatus('⚡ Initialisation...', 'Libération du focus de la grille...');
    await ensureGridIdle(); // S'assure que l'utilisateur n'avait pas déjà un curseur actif

    setStatus('⚡ Remplissage en cours...', 'Veuillez ne pas toucher à la page');
    let ok = 0, fail = 0;

    for (const row of rows) {
      const rowIndex = findRowIndex(row.task);
      if (rowIndex === -1) {
        fail++;
        continue;
      }
      for (let dayCol = 1; dayCol <= DAY_LABELS.length; dayCol++) {
        const val = row.days[dayCol - 1];
        if (!val) continue;
        try {
          setStatus(`⚡ Écriture : ${row.task.substring(0, 20)}... (${DAY_LABELS[dayCol - 1]})`);
          await fillCell(rowIndex, dayCol, val);
          ok++;
        } catch (e) {
          fail++;
        }
        await new Promise(r => setTimeout(r, ROW_DELAY));
      }
    }
    
    applyBtn.disabled = false;
    applyBtn.style.opacity = '1';
    
    setStatus('🟢 Prêt', `Dernier run : ${ok} ok, ${fail} échec(s)`);
    showToast('🏁 Saisie automatique terminée !');
  }

  panel.querySelector('#btnApplyWeek').addEventListener('click', applyWeek);
  panel.querySelector('#pwaTimeFillerClose').addEventListener('click', () => panel.remove());

  // ---------- Fonctionnalité Réduire / Agrandir ----------
  let isMinimized = false;
  let preMinimizeHeight = '480px';

  function toggleMinimize() {
    const body = panel.querySelector('#pwaTimeFillerBody');
    const statusBar = panel.querySelector('#pwaTimeFillerStatusBar');
    const minimizeBtn = panel.querySelector('#pwaTimeFillerMinimize');
    
    isMinimized = !isMinimized;
    
    if (isMinimized) {
      const rect = panel.getBoundingClientRect();
      preMinimizeHeight = rect.height + 'px';
      
      body.style.setProperty('display', 'none', 'important');
      statusBar.style.setProperty('display', 'none', 'important');
      panel.style.setProperty('height', 'auto', 'important');
      panel.style.setProperty('min-height', 'auto', 'important');
      
      minimizeBtn.innerHTML = '＋';
      minimizeBtn.title = 'Agrandir';
    } else {
      body.style.setProperty('display', 'flex', 'important');
      statusBar.style.setProperty('display', 'flex', 'important');
      panel.style.setProperty('height', preMinimizeHeight, 'important');
      panel.style.setProperty('min-height', '300px', 'important');
      
      minimizeBtn.innerHTML = '—';
      minimizeBtn.title = 'Réduire';
    }
  }

  panel.querySelector('#pwaTimeFillerMinimize').addEventListener('click', toggleMinimize);

  // ---------- Drag & Drop du panneau (Sécurisé et Fluide) ----------
  (function makeDraggable() {
    const header = panel.querySelector('#pwaTimeFillerHeader');
    let dragging = false;
    let startX = 0, startY = 0;
    let currentLeft = 0, currentTop = 0;

    header.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = panel.getBoundingClientRect();
      currentLeft = rect.left;
      currentTop = rect.top;
      
      const offsetParent = panel.offsetParent;
      if (offsetParent) {
        const parentRect = offsetParent.getBoundingClientRect();
        currentLeft -= parentRect.left;
        currentTop -= parentRect.top;
      }
      
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      panel.style.setProperty('left', (currentLeft + deltaX) + 'px', 'important');
      panel.style.setProperty('top', (currentTop + deltaY) + 'px', 'important');
      panel.style.setProperty('right', 'auto', 'important');
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  })();

  // ---------- Redimensionnement dynamique (JS Resize) ----------
  (function makeResizable() {
    const handle = panel.querySelector('#pwaTFResizeHandle');
    let resizing = false;
    let startWidth = 0, startHeight = 0;
    let startX = 0, startY = 0;

    handle.addEventListener('mousedown', e => {
      resizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = panel.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', e => {
      if (!resizing) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newWidth = Math.max(500, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);
      
      panel.style.setProperty('width', newWidth + 'px', 'important');
      panel.style.setProperty('height', newHeight + 'px', 'important');
    });

    document.addEventListener('mouseup', () => {
      resizing = false;
    });
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

  const initialRect = panel.getBoundingClientRect();
  panel.style.setProperty('left', initialRect.left + 'px', 'important');
  panel.style.setProperty('top', initialRect.top + 'px', 'important');
  panel.style.setProperty('right', 'auto', 'important');

})();
