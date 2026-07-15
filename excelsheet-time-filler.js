/* ============================================================
   PWA Time Filler - v0.1
   Bookmarklet: éditeur de template de semaine + remplissage auto
   de la grille "Mes tâches" de Project Web App (PWA/Project Server).

   Usage :
   - Colle tout ce fichier dans la console DevTools de la page
     Tâches PWA, ou installe-le en bookmarklet.
   - Un panneau flottant apparaît en haut à droite.
   - Renseigne tes lignes (nom de tâche recherché + valeur par jour,
     ex: "1j", "0,5j"). Laisse vide pour ne rien saisir ce jour-là.
   - "Enregistrer le template" sauvegarde en localStorage (persiste
     entre les sessions, tant que tu ne vides pas le cache du navigateur).
   - "Appliquer sur la semaine" rejoue automatiquement chaque case
     renseignée dans la grille PWA réelle.
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'pwaTimeFiller_template_v1';
  const GRID_ID = 'ctl00_ctl00_ctl40_g_59b0a653_1164_47a9_b8c6_ad27fa750537_MyTasksJSGridControl';
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; // colonnes 1 à 7
  const CLICK_DELAY = 250;   // délai entre les 2 clics (ouverture édition)
  const TYPE_DELAY = 200;    // délai avant d'envoyer Tab après la saisie
  const ROW_DELAY = 500;     // délai entre chaque cellule traitée (séquentiel)

  // ---------- Style du panneau ----------
  const style = document.createElement('style');
  style.textContent = `
    #pwaTimeFillerPanel {
      position: fixed; top: 20px; right: 20px; width: 620px; max-height: 85vh;
      overflow-y: auto; background: #fff; border: 2px solid #2a8dd4; border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 999999; font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      font-size: 13px; color: #222;
    }
    #pwaTimeFillerPanel * { box-sizing: border-box; }
    #pwaTimeFillerHeader {
      background: #2a8dd4; color: #fff; padding: 8px 12px; border-radius: 6px 6px 0 0;
      display: flex; justify-content: space-between; align-items: center; cursor: move;
    }
    #pwaTimeFillerHeader b { font-size: 14px; }
    #pwaTimeFillerHeader button { background: transparent; border: none; color: #fff; font-size: 16px; cursor: pointer; }
    #pwaTimeFillerBody { padding: 10px 12px; }
    #pwaTimeFillerTable { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    #pwaTimeFillerTable th, #pwaTimeFillerTable td { border: 1px solid #ccc; padding: 3px; }
    #pwaTimeFillerTable th { background: #f1f1f1; font-weight: 600; font-size: 12px; }
    #pwaTimeFillerTable input[type=text] { width: 100%; border: 1px solid #ddd; padding: 3px; font-size: 12px; }
    #pwaTimeFillerTable input.taskInput { min-width: 180px; }
    #pwaTimeFillerTable input.dayInput { width: 48px; text-align: center; }
    #pwaTimeFillerTable td.rmCell { text-align: center; }
    #pwaTimeFillerTable td.rmCell button { color: #c0392b; border: none; background: transparent; cursor: pointer; font-weight: bold; }
    .pwaTimeFillerBtnRow { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .pwaTimeFillerBtnRow button {
      padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;
    }
    .btnAdd { background: #eee; color: #333; }
    .btnSave { background: #2a8dd4; color: #fff; }
    .btnApply { background: #27ae60; color: #fff; }
    .btnClear { background: #f5f5f5; color: #c0392b; border: 1px solid #c0392b !important; }
    #pwaTimeFillerLog {
      margin-top: 10px; background: #f7f7f7; border: 1px solid #ddd; border-radius: 4px;
      padding: 6px 8px; max-height: 140px; overflow-y: auto; font-family: Consolas, monospace; font-size: 11px; white-space: pre-wrap;
    }
  `;
  document.head.appendChild(style);

  // ---------- Construction du panneau ----------
  const panel = document.createElement('div');
  panel.id = 'pwaTimeFillerPanel';
  panel.innerHTML = `
    <div id="pwaTimeFillerHeader">
      <b>PWA Time Filler — Template semaine</b>
      <button id="pwaTimeFillerClose" title="Fermer">✕</button>
    </div>
    <div id="pwaTimeFillerBody">
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
        <button class="btnSave" id="btnSaveTemplate">💾 Enregistrer le template</button>
        <button class="btnApply" id="btnApplyWeek">▶ Appliquer sur la semaine</button>
        <button class="btnClear" id="btnClearTemplate">🗑 Vider le template</button>
      </div>
      <div id="pwaTimeFillerLog"></div>
    </div>
  `;
  document.body.appendChild(panel);

  const rowsBody = panel.querySelector('#pwaTimeFillerRows');
  const logBox = panel.querySelector('#pwaTimeFillerLog');

  function log(msg) {
    const line = document.createElement('div');
    line.textContent = msg;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // ---------- Gestion des lignes ----------
  function addRow(data) {
    data = data || { task: '', days: ['', '', '', '', '', '', ''] };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="taskInput" placeholder="ex: MES-DMP - Architecte du SI" value="${escapeHtml(data.task)}"></td>
      ${data.days.map(v => `<td><input type="text" class="dayInput" value="${escapeHtml(v)}" placeholder="1j"></td>`).join('')}
      <td class="rmCell"><button title="Supprimer la ligne">✕</button></td>
    `;
    tr.querySelector('.rmCell button').addEventListener('click', () => tr.remove());
    rowsBody.appendChild(tr);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function getTemplateFromUI() {
    const rows = [];
    rowsBody.querySelectorAll('tr').forEach(tr => {
      const task = tr.querySelector('.taskInput').value.trim();
      const days = Array.from(tr.querySelectorAll('.dayInput')).map(i => i.value.trim());
      if (task) rows.push({ task, days });
    });
    return rows;
  }

  function loadTemplateIntoUI(template) {
    rowsBody.innerHTML = '';
    if (!template || !template.length) {
      addRow(); // une ligne vide par défaut
      return;
    }
    template.forEach(addRow);
  }

  // ---------- Persistance localStorage ----------
  function saveTemplate() {
    const data = getTemplateFromUI();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    log('✅ Template enregistré (' + data.length + ' ligne(s)).');
  }

  function loadTemplate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

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

      clickCell(cell); // 1er clic : sélection

      setTimeout(() => {
        clickCell(cell); // 2e clic : édition

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
    const template = getTemplateFromUI();
    if (!template.length) { log('⚠ Aucune ligne à appliquer.'); return; }

    log('▶ Démarrage de l’application du template (' + template.length + ' ligne(s))...');
    let ok = 0, fail = 0;

    for (const row of template) {
      const rowIndex = findRowIndex(row.task);
      if (rowIndex === -1) {
        log('✗ Tâche introuvable : "' + row.task + '" (vérifie qu’elle est bien visible dans la grille)');
        fail++;
        continue;
      }
      for (let dayCol = 1; dayCol <= 7; dayCol++) {
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

  // ---------- Événements UI ----------
  panel.querySelector('#btnAddRow').addEventListener('click', () => addRow());
  panel.querySelector('#btnSaveTemplate').addEventListener('click', saveTemplate);
  panel.querySelector('#btnClearTemplate').addEventListener('click', () => {
    if (confirm('Vider le template enregistré ?')) {
      localStorage.removeItem(STORAGE_KEY);
      loadTemplateIntoUI(null);
      log('🗑 Template vidé.');
    }
  });
  panel.querySelector('#btnApplyWeek').addEventListener('click', () => {
    saveTemplate();
    applyWeek();
  });
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
  loadTemplateIntoUI(loadTemplate());
  log('Panneau chargé. Renseigne ton template puis clique sur "Appliquer sur la semaine".');

})();
