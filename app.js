'use strict';
const $ = id => document.getElementById(id);
const video = $('feed'), stage = $('stage'), welcome = $('welcome'), menu = $('menu');
let stream = null, facing = 'environment', crop = false, busy = false, wake = null, timer, lastTap = null;
function message(text, inMenu = false) { $(inMenu ? 'menu-status' : 'status').textContent = text; }
async function keepAwake() {
  if (wake || !stream || document.visibilityState !== 'visible') return;
  try { wake = await navigator.wakeLock?.request('screen'); wake?.addEventListener('release', () => { wake = null; }); } catch {}
}
async function immersive() {
  if (document.fullscreenElement) return true;
  try { await stage.requestFullscreen({navigationUI:'hide'}); return true; }
  catch { return false; }
}
function stopTracks() { stream?.getTracks().forEach(track => track.stop()); stream = null; video.srcObject = null; }
async function openCamera(nextFacing = facing) {
  if (busy) return;
  busy = true; $('start').disabled = true; $('switch').disabled = true;
  const previous = facing; stopTracks();
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('secure');
    stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{exact:nextFacing},width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30}}});
    facing = nextFacing;
    await attach();
  } catch (error) {
    // Only the initial rear-camera request may fall back to the available camera.
    if (welcome.hidden === false && ['OverconstrainedError','NotFoundError'].includes(error.name)) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:1920},height:{ideal:1080}}});
        facing = stream.getVideoTracks()[0].getSettings().facingMode || 'user';
        await attach();
      } catch (fallbackError) { fail(fallbackError); }
    } else if (welcome.hidden && previous !== nextFacing) {
      // Restore the old camera if the requested side is unavailable.
      try {
        stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{exact:previous}}});
        facing = previous; await attach(); message('Cette caméra est indisponible. Caméra précédente rétablie.', true);
      } catch (restoreError) { fail(restoreError); }
    } else { fail(error); }
  } finally { busy = false; $('start').disabled = false; $('switch').disabled = false; }
}
async function attach() {
  video.srcObject = stream; await video.play();
  $('camera-label').textContent = facing === 'environment' ? 'Arrière' : 'Frontale';
  welcome.hidden = true; stage.classList.add('live');
  const track = stream.getVideoTracks()[0];
  track.addEventListener('ended', () => { if (stream?.getVideoTracks()[0] === track) fail(new Error('ended')); });
  keepAwake();
}
function fail(error) {
  stopTracks(); closeMenu(); welcome.hidden = false; stage.classList.remove('live');
  const errors = {NotAllowedError:'Autorisez l’accès à la caméra dans les paramètres du navigateur, puis réessayez.',NotReadableError:'La caméra est occupée. Fermez les autres applications caméra, puis réessayez.',NotFoundError:'Aucune caméra disponible sur cet appareil.',OverconstrainedError:'Cette caméra est indisponible.',secure:'Ouvrez cette application en HTTPS pour accéder à la caméra.',ended:'La caméra a été interrompue. Appuyez pour la relancer.'};
  message(errors[error.name] || errors[error.message] || 'Impossible d’ouvrir la caméra. Appuyez pour réessayer.');
}
function resetTimer() { clearTimeout(timer); timer = setTimeout(closeMenu, 8000); }
function closeMenu() { menu.hidden = true; clearTimeout(timer); $('close').blur(); }
function openMenu() { if (!stream) return; menu.hidden = false; message('Le menu se ferme après 8 secondes.',true); resetTimer(); $('close').focus(); }
$('start').addEventListener('click', () => { immersive(); openCamera(); });
$('close').addEventListener('click', closeMenu);
$('switch').addEventListener('click', async () => { resetTimer(); await openCamera(facing === 'environment' ? 'user' : 'environment'); resetTimer(); });
$('fit').addEventListener('click', () => { crop = !crop; video.style.objectFit = crop ? 'cover' : 'contain'; $('fit-label').textContent = crop ? 'Remplir l’écran (image recadrée)' : 'Image entière'; resetTimer(); });
$('fullscreen').addEventListener('click', async () => { const ok = await immersive(); message(ok ? 'Plein écran activé.' : 'Plein écran indisponible. Essayez Chrome sur Android.',true); resetTimer(); });
$('stop').addEventListener('click', () => { stopTracks(); wake?.release(); closeMenu(); welcome.hidden = false; stage.classList.remove('live'); message('Caméra fermée. Vous pouvez la relancer.'); if (document.fullscreenElement) document.exitFullscreen().catch(()=>{}); });
stage.addEventListener('pointerup', event => {
  if (!welcome.hidden || event.target !== stage && event.target !== video) return;
  const now = performance.now();
  if (lastTap && now - lastTap.time < 350 && Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<45) {
    menu.hidden ? openMenu() : closeMenu(); lastTap = null;
  } else lastTap = {time:now,x:event.clientX,y:event.clientY};
});
menu.addEventListener('pointerdown', resetTimer);
menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
  if (e.key.toLowerCase() === 'm') menu.hidden ? openMenu() : closeMenu();
  if (e.key === 'Tab' && !menu.hidden) {
    const buttons = [...menu.querySelectorAll('button:not(:disabled)')];
    if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1).focus(); }
    if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0].focus(); }
  }
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
window.addEventListener('pagehide', () => { stopTracks(); wake?.release(); });
window.addEventListener('pageshow', event => { if (event.persisted) { welcome.hidden=false; stage.classList.remove('live'); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
