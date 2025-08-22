/**
 * Utility functions for navigation within the socio dashboard
 */

/**
 * Navigate to a specific tab in the socio dashboard
 * @param tabId - The ID of the tab to navigate to
 */
type WindowWithNavigate = Window & {
  navigateToSocioTab?: (tabId: string) => void;
};

export const navigateToSocioTab = (tabId: string) => {
  // Check if the global navigation function is available
  const win = window as WindowWithNavigate;
  if (typeof window !== 'undefined' && win.navigateToSocioTab) {
    win.navigateToSocioTab(tabId);
  } else {
    // Fallback: update URL manually
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({}, '', newUrl.toString());
    
    // Trigger a custom event that the tab system can listen to
    window.dispatchEvent(new CustomEvent('socio-tab-change', { detail: { tabId } }));
  }
};

/**
 * Navigate to the benefits tab
 */
export const navigateToBeneficios = () => {
  navigateToSocioTab('beneficios');
};

/**
 * Navigate to the associations tab
 */
export const navigateToAsociaciones = () => {
  navigateToSocioTab('asociaciones');
};

/**
 * Navigate to the profile tab
 */
export const navigateToPerfil = () => {
  navigateToSocioTab('perfil');
};

/**
 * Navigate to the QR validation tab
 */
export const navigateToValidar = () => {
  navigateToSocioTab('validar');
};

/**
 * Navigate to the history tab
 */
export const navigateToHistorial = () => {
  navigateToSocioTab('historial');
};
