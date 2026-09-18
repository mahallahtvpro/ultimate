/* ============================================================
   FULLSCREEN AUTO — fullscreen.js
   Otomatis masuk fullscreen begitu user klik/sentuh/tekan tombol
   pertama kali (browser mewajibkan ada gesture user).
   Juga otomatis kembali fullscreen jika user keluar (opsional).
   ============================================================ */

(function () {
  'use strict';

  var target = document.documentElement; // fullscreen-kan seluruh halaman

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement || document.msFullscreenElement);
  }

  function requestFS(el) {
    try {
      if (el.requestFullscreen) return el.requestFullscreen();
      if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen(); // Safari/old Chrome/Android WebView
      if (el.mozRequestFullScreen) return el.mozRequestFullScreen();       // old Firefox
      if (el.msRequestFullscreen) return el.msRequestFullscreen();        // old IE/Edge
    } catch (e) { /* diamkan, browser tetap jalan normal tanpa fullscreen */ }
  }

  function exitFS() {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (e) {}
  }

  function tryAutoFullscreenOnLoad() {
    // Sebagian WebView (mis. aplikasi Android TV yang sudah dibungkus native)
    // mengizinkan ini langsung tanpa gesture. Kalau ditolak browser, tidak apa-apa,
    // nanti dipicu ulang oleh gesture pertama di bawah.
    requestFS(target);
  }

  function onFirstUserGesture() {
    if (!isFullscreen()) requestFS(target);
    // Setelah gesture pertama dipakai, listener dilepas supaya tidak
    // memicu request fullscreen berulang-ulang di tiap klik.
    document.removeEventListener('click', onFirstUserGesture, true);
    document.removeEventListener('touchstart', onFirstUserGesture, true);
    document.removeEventListener('keydown', onFirstUserGesture, true);
  }

  document.addEventListener('click', onFirstUserGesture, true);
  document.addEventListener('touchstart', onFirstUserGesture, true);
  document.addEventListener('keydown', onFirstUserGesture, true);

  // Opsional: kalau user (atau remote) keluar dari fullscreen, biarkan saja
  // — jangan dipaksa balik otomatis supaya tidak mengganggu, kecuali kamu mau.
  // Kalau MAU otomatis balik fullscreen setiap keluar, uncomment blok ini:
  /*
  function onFSChange() {
    if (!isFullscreen()) {
      setTimeout(function () { requestFS(target); }, 300);
    }
  }
  document.addEventListener('fullscreenchange', onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);
  document.addEventListener('mozfullscreenchange', onFSChange);
  document.addEventListener('MSFullscreenChange', onFSChange);
  */

  window.addEventListener('load', tryAutoFullscreenOnLoad);

  // Expose manual toggle, berguna kalau mau dipanggil dari remote-codes.js
  window.AppFullscreen = {
    enter: function () { requestFS(target); },
    exit: exitFS,
    toggle: function () { isFullscreen() ? exitFS() : requestFS(target); },
    isFullscreen: isFullscreen
  };
})();