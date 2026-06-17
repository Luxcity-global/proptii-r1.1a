/** Navigate the parent app (or self when standalone). */
export function openInParentApp(path: string) {
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = path;
    } else {
      window.location.href = path;
    }
  } catch {
    window.location.href = path;
  }
}

/** Delegate logout / profile edit to the parent app auth context. */
export function requestAuthAction(action: 'logout' | 'editProfile') {
  if (window.parent !== window.self) {
    window.parent.postMessage({ type: 'AUTH_ACTION', payload: { action } }, '*');
    return;
  }
  openInParentApp('/');
}
