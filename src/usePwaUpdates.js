import { useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function usePwaUpdates(isEditing, onError) {
  const editing = useRef(isEditing);
  const reportError = useRef(onError);
  const reloadWhenReady = useRef(null);
  editing.current = isEditing;
  reportError.current = onError;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let registration;
    let disposed = false;
    let checking = false;
    let lastCheck = -Infinity;
    let pendingReload = false;
    let reloading = false;
    let controller = navigator.serviceWorker.controller;

    function reloadIfReady() {
      if (disposed || reloading || !pendingReload || editing.current || document.visibilityState !== 'visible' || !navigator.onLine) return;
      reloading = true;
      window.location.reload();
    }

    async function checkForUpdate() {
      reloadIfReady();
      if (disposed || !registration || checking || !navigator.onLine || document.visibilityState !== 'visible' || Date.now() - lastCheck < 5000) return;
      checking = true;
      lastCheck = Date.now();
      try { await registration.update(); }
      catch { /* Keep the cached app when the network or deployment is unavailable. */ }
      finally { checking = false; }
    }

    function updateReady() { pendingReload = true; reloadIfReady(); }
    function controllerChanged() {
      const next = navigator.serviceWorker.controller;
      // First installation only prepares offline support; later controllers
      // represent an update, including one installed by another open window.
      if (controller && next && next !== controller) updateReady();
      controller = next;
    }
    reloadWhenReady.current = reloadIfReady;
    registerSW({
      immediate: true,
      onNeedReload: updateReady,
      onRegisteredSW(_url, value) {
        if (disposed) return;
        registration = value;
        void checkForUpdate();
      },
      onRegisterError(error) { if (!disposed && navigator.onLine) reportError.current?.(error); },
    });
    const interval = window.setInterval(checkForUpdate, 60000);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('pageshow', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    navigator.serviceWorker.addEventListener('controllerchange', controllerChanged);
    return () => {
      disposed = true;
      reloadWhenReady.current = null;
      window.clearInterval(interval);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('pageshow', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChanged);
    };
  }, []);

  // Saving or dismissing the editor allows a downloaded update to take effect
  // without interrupting typing or discarding unsaved input.
  useEffect(() => { reloadWhenReady.current?.(); }, [isEditing]);
}
