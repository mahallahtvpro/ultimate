/* ============================================================
   REMOTE CONTROL — remote.js  v4.0 (ES5)
   ============================================================ */

   (function() {
    'use strict';
  
    var CFG = {
      codeTimeout: 1200,
      toastMs: 2500,
      idleMs: 10000,
    };
  
    var MODAL_PRIORITY = [
      'settings-sidebar',
      'modal-masjid',
      'modal-event',
      'modal-muadzin',
      'modal-prayer',
      'modal-minutes',
      'rc-mini-modal',
      'modal-sleep-mode', 
    ];
  
    function getOpenModal() {
      // cek rc-mini-modal lewat overlay-nya
      var rcOverlay = document.getElementById('rc-mini-modal-overlay');
      if (rcOverlay) return document.getElementById('rc-mini-modal');

      var frbOverlay = document.getElementById('frb-pairing-overlay');
      if (frbOverlay) return frbOverlay;
    
      for (var i = MODAL_PRIORITY.length - 1; i >= 0; i--) {
        var el = document.getElementById(MODAL_PRIORITY[i]);
        if (!el) continue;
        if (el.style.display === 'flex' || el.style.display === 'block') return el;
      }
      return null;
    }
  
    var FOCUSABLE_SEL = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '.settings-section-title',
      '.tema-card',
      '.color-swatch',
      '.bg-remove',
      '.audio-item',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
  
    function isVisible(el) {
      if (!el) return false;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
      var cur = el;
      while (cur && cur !== document.body) {
        var st = getComputedStyle(cur);
        if (st.display === 'none' || st.visibility === 'hidden') return false;
        cur = cur.parentElement;
      }
      return true;
    }
  
    function getFocusable(container) {
      var els = container.querySelectorAll(FOCUSABLE_SEL);
      var result = [];
      for (var i = 0; i < els.length; i++) {
        if (isVisible(els[i])) result.push(els[i]);
      }
      return result;
    }
  
    function clearModalHL(container) {
      var hlEls = container.querySelectorAll('.' + HL_MODAL);
      for (var i = 0; i < hlEls.length; i++) {
        hlEls[i].classList.remove(HL_MODAL);
      }
    }
  
    function setModalHL(el) {
      var modal = getOpenModal();
      if (modal) clearModalHL(modal);
      if (!el) return;
      el.classList.add(HL_MODAL);
      el.scrollIntoView(false);
    }
  
    function handleModalNav(dir) {
      var modal = getOpenModal();
      if (!modal) return false;
  
      modal.classList.add('rc-nav-active');
      var items = getFocusable(modal);
      if (!items.length) return true;
  
      var idx = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains(HL_MODAL)) {
          idx = i;
          break;
        }
      }
      if (idx < 0) idx = items.indexOf(document.activeElement);
  
      if (dir === 'ok') {
        if (idx < 0) {
          setModalHL(items[0]);
          items[0].focus();
          return true;
        }
  
        var cur = items[idx];
        var tag = cur.tagName;
        var type = (cur.getAttribute('type') || cur.type || '').toLowerCase();
  
        if (tag === 'INPUT' && type === 'range') {
          rcToast('◀ ▶  untuk atur nilai slider');
          return true;
        }
        if (tag === 'SELECT') {
          cur.focus();
          pickerOpenSelect = cur;
      
          // Android modern (Chrome/WebView terbaru)
          try {
              if (typeof cur.showPicker === 'function') {
                  cur.showPicker();
                  return true;
              }
          } catch (e) {}
      
          // Android lama (HG680P Android 6, WebView lawas)
          try {
              var evt = document.createEvent('MouseEvents');
      
              evt.initMouseEvent(
                  'mousedown',
                  true,
                  true,
                  window,
                  1,
                  0, 0, 0, 0,
                  false, false, false, false,
                  0,
                  null
              );
      
              cur.dispatchEvent(evt);
              cur.click();
      
              return true;
      
          } catch (e) {
      
              // Fallback terakhir
              try {
                  cur.click();
              } catch (err) {}
      
              return true;
          }
      }
  
        if (tag === 'INPUT' && type === 'file') {
          var id = cur.id;
          var triggered = false;
          if (id) {
            var lbl = document.querySelector('label[for="' + id + '"]');
            if (lbl) {
              lbl.click();
              triggered = true;
            }
          }
          if (!triggered) {
            var lblParent = (function(el) {
              while (el && el.tagName !== 'LABEL') el = el.parentElement;
              return el;
            })(cur);
            if (lblParent) {
              lblParent.click();
              triggered = true;
            }
          }
          if (!triggered) {
            try { cur.click(); } catch (e) {}
          }
          return true;
        }
        cur.click();
        return true;
      }
  
      if (idx < 0) {
        setModalHL(items[0]);
        items[0].focus();
        return true;
      }
  
      var next;
      if (dir === 'down' || dir === 'right') {
        next = idx < items.length - 1 ? idx + 1 : 0;
      } else {
        next = idx > 0 ? idx - 1 : items.length - 1;
      }
  
      setModalHL(items[next]);
      items[next].focus();
      return true;
    }
  
    var NAV_GRAPH = {
      'top-center': { action: function() { call('openMasjidModal'); }, up: 'card-imsak', down: 'btn-muadzin', left: 'btn-muadzin', right: 'islamic-event-banner' },
      'btn-muadzin':    { action: function() { call('openMuadzinModal'); }, up: 'top-center', down: 'card-imsak', left: 'islamic-event-banner', right: 'btn-sleep-power' },
      'btn-sleep-power':{ action: function() { if(window.SleepMode) SleepMode.openModal(); }, up: 'top-center', down: 'card-imsak', left: 'btn-muadzin', right: 'islamic-event-banner' },
      'islamic-event-banner': { action: function() { call('openEventModal'); }, up: 'btn-muadzin', down: 'btn-settings', left: 'btn-sleep-power', right: 'btn-muadzin' },
      'btn-settings': { action: function() { call('openSettings'); }, up: 'islamic-event-banner', down: 'card-isya', left: 'btn-muadzin', right: null },
  
      'card-imsak': { action: function() { openCard('Imsak'); }, up: 'btn-muadzin', down: 'top-center', left: 'card-isya', right: 'card-shubuh' },
      'card-shubuh': { action: function() { openCard('Shubuh'); }, up: 'btn-muadzin', down: 'top-center', left: 'card-imsak', right: 'card-syuruq' },
      'card-syuruq': { action: function() { openCard('Syuruq'); }, up: 'btn-muadzin', down: 'top-center', left: 'card-shubuh', right: 'card-dhuha' },
      'card-dhuha': { action: function() { openCard('Dhuha'); }, up: 'btn-muadzin', down: 'top-center', left: 'card-syuruq', right: 'card-dzuhur' },
  
      'card-dzuhur': { action: function() { openCard('Dzuhur'); }, up: 'btn-settings', down: 'top-center', left: 'card-dhuha', right: 'card-ashar' },
      'card-ashar': { action: function() { openCard('Ashar'); }, up: 'btn-settings', down: 'top-center', left: 'card-dzuhur', right: 'card-maghrib' },
      'card-maghrib': { action: function() { openCard('Maghrib'); }, up: 'btn-settings', down: 'top-center', left: 'card-ashar', right: 'card-isya' },
      'card-isya': { action: function() { openCard('Isya'); }, up: 'btn-settings', down: 'top-center', left: 'card-maghrib', right: 'card-imsak' },
    };
  
    var currentNode = null;
    var pickerOpenSelect = null;
  
    function moveNav(dir) {
      if (!currentNode) { setNode('top-center'); return; }
      var node = NAV_GRAPH[currentNode];
      if (!node) { setNode('top-center'); return; }
  
      var target = node[dir];
  
      if (target === 'card-dhuha') {
        var dhuhaEl = document.getElementById('card-dhuha');
        if (!dhuhaEl || !isVisible(dhuhaEl)) {
          target = (dir === 'right') ? 'card-dzuhur' : 'card-syuruq';
        }
      }
  
      if (!target) return;
      setNode(target);
    }
  
    function setNode(id) {
      currentNode = id;
      highlightNode(id);
    }
  
    function okNav() {
      if (!currentNode) { setNode('top-center'); return; }
      var node = NAV_GRAPH[currentNode];
      if (node && node.action) node.action();
    }
  
    var HL = 'rc-nav-focus';
    var HL_MODAL = 'rc-modal-focus';
  
    function injectStyle() {
      if (document.getElementById('rc-style')) return;
      var s = document.createElement('style');
      s.id = 'rc-style';
      s.textContent =
        '.rc-nav-focus {' +
        '  outline: 3px solid #FFD700 !important;' +
        '  outline-offset: 3px !important;' +
        '  box-shadow: 0 0 14px 4px rgba(255,215,0,.5) !important;' +
        '  transition: outline .1s, box-shadow .1s;' +
        '}' +
        '.rc-modal-focus {' +
        '  background-color: rgba(255, 150, 50, 0.18) !important;' +
        '  outline: 2px solid rgba(255, 150, 50, 0.85) !important;' +
        '  outline-offset: 2px !important;' +
        '  border-radius: 6px !important;' +
        '  box-shadow: 0 0 8px 2px rgba(255,150,50,.3) !important;' +
        '  transition: background-color .12s, outline .12s;' +
        '}' +
        'button.rc-modal-focus,' +
        'input.rc-modal-focus,' +
        'select.rc-modal-focus,' +
        'textarea.rc-modal-focus {' +
        '  background-color: rgba(255, 150, 50, 0.22) !important;' +
        '}' +
        '.settings-section-title.rc-modal-focus {' +
        '  background-color: rgba(255, 150, 50, 0.2) !important;' +
        '  outline: 2px solid rgba(255, 150, 50, 0.9) !important;' +
        '}' +
        '.tema-card.rc-modal-focus,' +
        '.color-swatch.rc-modal-focus {' +
        '  outline: 3px solid rgba(255,150,50,.95) !important;' +
        '  box-shadow: 0 0 10px 3px rgba(255,150,50,.45) !important;' +
        '}' +
        '.bg-remove.rc-modal-focus {' +
        '  background: rgba(255,80,80,.7) !important;' +
        '  outline: 2px solid #ff5050 !important;' +
        '}' +
        '.audio-item.rc-modal-focus {' +
        '  background-color: rgba(255,150,50,.2) !important;' +
        '  outline: 2px solid rgba(255,150,50,.85) !important;' +
        '  border-radius: 8px !important;' +
        '}' +
        '.rc-modal-focus:focus {' +
        '  outline: none !important;' +
        '}' +
        '.rc-nav-active .bg-remove {' +
        '  display: flex !important;' +
        '}';
      document.head.appendChild(s);
    }
  
    function highlightNode(id) {
      var hlEls = document.querySelectorAll('.' + HL);
      for (var i = 0; i < hlEls.length; i++) {
        hlEls[i].classList.remove(HL);
      }
      if (!id) return;
      var el = document.getElementById(id);
      if (el) {
        el.classList.add(HL);
        el.scrollIntoView(false);
      }
    }
  
    function patchFocusable() {
      var sel = '.settings-section-title, .tema-card, .color-swatch, .bg-remove, .audio-item';
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        if (!els[i].getAttribute('tabindex')) els[i].setAttribute('tabindex', '0');
      }
    }
  
    function watchDynamicLists() {
      var targets = [
        { id: 'bg-preview-list', sel: '.bg-remove' },
        { id: 'muadzin-audio-list', sel: '.audio-item' },
        { id: 'audio-adzan-list', sel: '.audio-item' },
        { id: 'audio-pre-adzan-list', sel: '.audio-item' },
        { id: 'audio-alarm-list', sel: '.audio-item' },
        { id: 'tema-grid', sel: '.tema-card' },
        { id: 'custom-theme-list', sel: '.color-swatch' },
      ];
  
      for (var t = 0; t < targets.length; t++) {
        var target = targets[t];
        var container = document.getElementById(target.id);
        if (!container) continue;
  
        var observer = new MutationObserver(function() {
          var els = container.querySelectorAll(target.sel);
          for (var i = 0; i < els.length; i++) {
            if (!els[i].getAttribute('tabindex')) els[i].setAttribute('tabindex', '0');
          }
        });
        observer.observe(container, { childList: true, subtree: true });
      }
    }
  
    function openCard(key) {
      if (key === 'Dhuha' && window.S && !window.S.dhuhaEnabled) {
        rcToast('⚠ Mode Dhuha tidak aktif');
        return;
      }
      if (typeof openPrayerModal === 'function') openPrayerModal(key);
    }
  
    function call(fnName) {
      if (typeof window[fnName] === 'function') window[fnName]();
      else rcToast('⚠ ' + fnName + '() tidak ditemukan');
    }
  
    var codeBuffer = '';
    var codeTimer = null;
  
    var CODE_MAP = {
      '000':  { label: 'Buka Modal Sleep Mode', action: function () {
        if (window.SleepMode) SleepMode.openModal();
      }},
      '0001': { label: 'Matikan Overlay Black (manual)',  action: function () {
        if (window.SleepMode) SleepMode.manualOff();
      }},
      '0000': { label: 'Aktifkan Overlay Black (manual)', action: function () {
        if (window.SleepMode) SleepMode.manualOn();
      }},
      '111': { label: 'Form Data Masjid', action: function() { call('openMasjidModal'); } },
      '112': { label: 'Form Mode Muadzin', action: function() { call('openMuadzinModal'); } },
      '113': { label: 'Form Hari Besar Islam', action: function() { call('openEventModal'); } },
      '114': { label: 'Form Pengaturan (Sidebar)', action: function() { call('openSettings'); } },
      '1151': { label: 'Form Imsak', action: function() { openCard('Imsak'); } },
      '1152': { label: 'Form Shubuh', action: function() { openCard('Shubuh'); } },
      '1153': { label: 'Form Syuruq', action: function() { openCard('Syuruq'); } },
      '1154': { label: 'Form Dhuha', action: function() { openCard('Dhuha'); } },
      '1155': { label: 'Form Dzuhur / Jumat', action: function() { openCard('Dzuhur'); } },
      '1156': { label: 'Form Ashar', action: function() { openCard('Ashar'); } },
      '1157': { label: 'Form Maghrib', action: function() { openCard('Maghrib'); } },
      '1158': { label: 'Form Isya', action: function() { openCard('Isya'); } },
    };
  
    function executeCode(code) {
      hideIndicator();
      var entry = CODE_MAP[code];
      if (!entry) { rcToast('⚠ Kode tidak dikenal: ' + code); return; }
      rcToast('📺 ' + entry.label);
      try { entry.action(); } catch (e) { rcToast('⚠ Error: ' + e.message); }
    }
  
    function getIndicator() {
      var el = document.getElementById('rc-indicator');
      if (!el) {
        el = document.createElement('div');
        el.id = 'rc-indicator';
        el.style.position = 'fixed';
        el.style.bottom = '56px';
        el.style.right = '16px';
        el.style.background = 'rgba(0,0,0,.78)';
        el.style.color = '#FFD700';
        el.style.fontFamily = 'monospace';
        el.style.fontSize = '1.4rem';
        el.style.letterSpacing = '.15em';
        el.style.padding = '6px 14px';
        el.style.borderRadius = '8px';
        el.style.zIndex = '99999';
        el.style.pointerEvents = 'none';
        el.style.display = 'none';
        el.style.minWidth = '60px';
        el.style.textAlign = 'center';
        el.style.border = '1px solid rgba(255,215,0,.3)';
        document.body.appendChild(el);
      }
      return el;
    }
  
    function showIndicator(t) {
      var el = getIndicator();
      el.textContent = t;
      el.style.display = 'block';
    }
  
    function hideIndicator() {
      getIndicator().style.display = 'none';
    }
  
    function rcToast(msg) {
      if (typeof showToast === 'function') { showToast(msg); return; }
      var el = document.getElementById('rc-toast-fb');
      if (!el) {
        el = document.createElement('div');
        el.id = 'rc-toast-fb';
        el.style.position = 'fixed';
        el.style.bottom = '100px';
        el.style.left = '50%';
        el.style.transform = 'translateX(-50%)';
        el.style.background = 'rgba(0,0,0,.88)';
        el.style.color = '#fff';
        el.style.padding = '10px 20px';
        el.style.borderRadius = '10px';
        el.style.fontSize = '.9rem';
        el.style.zIndex = '99998';
        el.style.pointerEvents = 'none';
        el.style.display = 'none';
        el.style.fontFamily = 'Poppins,sans-serif';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.display = 'block';
      el.style.opacity = '1';
      clearTimeout(el._t);
      el._t = setTimeout(function() {
        el.style.transition = 'opacity .4s';
        el.style.opacity = '0';
        setTimeout(function() {
          el.style.display = 'none';
          el.style.transition = '';
        }, 400);
      }, CFG.toastMs);
    }
  
    var DIR_MAP = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
  
    function onKeyDown(e) {
      var key = e.key;
      var dir = DIR_MAP[key]; // FIX: sebelumnya tidak pernah di-set, menyebabkan ReferenceError

      if (/^\d$/.test(key)) {
        var tag = document.activeElement ? document.activeElement.tagName : '';
        var type = document.activeElement ? (document.activeElement.type || '') : '';
        if (tag === 'INPUT' && ['file', 'checkbox', 'radio', 'range'].indexOf(type) === -1) return;
        if (tag === 'TEXTAREA') return;
        if (tag === 'SELECT') return;
  
        codeBuffer += key;
        showIndicator(codeBuffer);
        clearTimeout(codeTimer);
        codeTimer = setTimeout(function() {
          var code = codeBuffer;
          codeBuffer = '';
          executeCode(code);
        }, CFG.codeTimeout);
        e.preventDefault();
        return;
      }
  
      if (key === 'Escape') {
        if (codeBuffer) {
          codeBuffer = '';
          clearTimeout(codeTimer);
          hideIndicator();
          rcToast('Input kode dibatalkan');
          e.preventDefault();
        }
        return;
      }
  
      if (key === 'Enter' || key === ' ') {
        var tag2 = document.activeElement ? document.activeElement.tagName : '';
        var type2 = document.activeElement ? (document.activeElement.type || '') : '';
        if (tag2 === 'TEXTAREA') return;
        if (tag2 === 'SELECT') return; // ← tambah ini, biarkan native select handle Enter
        if (tag2 === 'INPUT' && ['checkbox', 'radio', 'file', 'button', 'submit', 'reset', 'range'].indexOf(type2) === -1) return;
      
        e.preventDefault();
        if (handleModalNav('ok')) return;
        okNav();
        return;
      }
  
      // FIX: kalau sedang fokus di kolom teks/textarea/contenteditable dan tombolnya
      // bukan tombol arah (dir undefined), biarkan browser menangani secara native
      // (mengetik huruf, backspace, dll) — jangan lanjut ke preventDefault di bawah.
      var guardEl = document.activeElement;
      var guardTag = guardEl ? guardEl.tagName : '';
      var guardType = guardEl ? (guardEl.type || '') : '';
      var isEditableField =
        guardTag === 'TEXTAREA' ||
        (guardTag === 'INPUT' && ['checkbox', 'radio', 'file', 'range'].indexOf(guardType) === -1) ||
        (guardEl && guardEl.isContentEditable);
      if (!dir && isEditableField) {
        return;
      }

      // SESUDAH
      var activeElChk = document.activeElement;
      if (pickerOpenSelect && activeElChk === pickerOpenSelect && (dir === 'up' || dir === 'down')) {
        return; // tidak preventDefault, tidak handleModalNav — biar native list yang jalan
      }

      // SELECT: kiri/kanan ganti opsi (lepas ke native), atas/bawah tetap navigasi remote
      var activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'SELECT') {
        if (dir === 'left' || dir === 'right') {
          var idx = activeEl.selectedIndex;
          if (dir === 'right' && idx < activeEl.options.length - 1) {
            activeEl.selectedIndex = idx + 1;
          } else if (dir === 'left' && idx > 0) {
            activeEl.selectedIndex = idx - 1;
          }
          var evChange = document.createEvent('Event');
          evChange.initEvent('change', true, true);
          activeEl.dispatchEvent(evChange);
          return;
        }
        // atas/bawah: jatuh ke bawah, lanjut navigasi modal seperti biasa
      }

      e.preventDefault();
  
      var active = document.activeElement;
      if (active && active.tagName === 'INPUT' && active.type === 'range') {
        if (dir === 'left' || dir === 'right') {
          var step = parseFloat(active.step) || 1;
          var min = parseFloat(active.min) || 0;
          var max = parseFloat(active.max) || 100;
          var val = parseFloat(active.value) || 0;
          val = dir === 'right' ? Math.min(max, val + step) : Math.max(min, val - step);
          active.value = val;
          active.dispatchEvent(new Event('input', { bubbles: true }));
          active.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
  
      if (handleModalNav(dir)) return;
  
      moveNav(dir);
    }
  
    function watchModalClose() {
      var targets = document.querySelectorAll('.modal-overlay');
      var sidebar = document.getElementById('settings-sidebar');
      var allTargets = [];
      for (var i = 0; i < targets.length; i++) {
        allTargets.push(targets[i]);
      }
      if (sidebar) allTargets.push(sidebar);
  
      var obs = new MutationObserver(function() {
        if (!getOpenModal()) {
          var hlModalEls = document.querySelectorAll('.' + HL_MODAL);
          for (var i = 0; i < hlModalEls.length; i++) {
            hlModalEls[i].classList.remove(HL_MODAL);
          }
          var navActiveEls = document.querySelectorAll('.rc-nav-active');
          for (var j = 0; j < navActiveEls.length; j++) {
            navActiveEls[j].classList.remove('rc-nav-active');
          }
          if (currentNode) {
            var hlEls = document.querySelectorAll('.' + HL);
            for (var k = 0; k < hlEls.length; k++) {
              hlEls[k].classList.remove(HL);
            }
            highlightNode(currentNode);
          }
        }
      });
  
      for (var l = 0; l < allTargets.length; l++) {
        obs.observe(allTargets[l], { attributes: true, attributeFilter: ['style'] });
      }
    }
  
    function init() {
      injectStyle();
      patchFocusable();
      watchDynamicLists();
      window.addEventListener('keydown', onKeyDown);
      watchModalClose();

      document.addEventListener('change', function(e) {
        if (e.target && e.target.tagName === 'SELECT' && e.target === pickerOpenSelect) {
          pickerOpenSelect = null;
        }
      }, true);
      document.addEventListener('blur', function(e) {
        if (e.target && e.target.tagName === 'SELECT' && e.target === pickerOpenSelect) {
          pickerOpenSelect = null;
        }
      }, true);
  
      var idleTimer = null;
      function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function() {
          var hlEls = document.querySelectorAll('.' + HL);
          for (var i = 0; i < hlEls.length; i++) {
            hlEls[i].classList.remove(HL);
          }
          var hlModalEls = document.querySelectorAll('.' + HL_MODAL);
          for (var j = 0; j < hlModalEls.length; j++) {
            hlModalEls[j].classList.remove(HL_MODAL);
          }
          var focusedEls = document.querySelectorAll(':focus');
          for (var k = 0; k < focusedEls.length; k++) {
            focusedEls[k].blur();
          }
          currentNode = null;
        }, CFG.idleMs);
      }
      window.addEventListener('keydown', resetIdleTimer, true); // ganti object → boolean
  
      var origOpen = window.openSettings;
      if (typeof origOpen === 'function') {
        window.openSettings = function() {
          origOpen.apply(this, arguments);
          setTimeout(patchFocusable, 80);
          setTimeout(patchFocusable, 1000);
        };
      }
  
      console.log('[RemoteControl v4] Aktif.');
  
      window.RemoteControl = {
        exec: executeCode,
        register: function(code, label, fn) {
          if (CODE_MAP[code]) console.warn('[RC] Kode', code, 'ditimpa.');
          CODE_MAP[code] = { label: label, action: fn };
          console.log('[RC] Kode', code, '("' + label + '") didaftarkan.');
        },
        listCodes: function() {
          var entries = Object.keys(CODE_MAP).map(function(k) {
            return { Kode: k, Fungsi: CODE_MAP[k].label };
          });
          console.table(entries);
        },
        /* Dipakai oleh firebase-remote-bridge.js untuk mempublikasikan
           katalog kode ke Firebase, supaya control.html bisa menampilkan
           semua fitur yang terdaftar secara otomatis (tanpa hardcode). */
        list: function() {
          return Object.keys(CODE_MAP).map(function(k) {
            return { code: k, label: CODE_MAP[k].label };
          });
        },
        goTo: function(id) { setNode(id); },
        setTimeout: function(ms) { CFG.codeTimeout = ms; },
      };
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();
