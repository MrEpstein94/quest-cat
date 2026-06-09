import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const BUILD_STORAGE_KEY = 'quest-cat-build-id';
const VERSION_URL = '/version.json';

async function clearBrowserRuntimeState() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  }
}

function reloadToBuild(buildId: string) {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('appv', buildId);
  window.location.replace(nextUrl.toString());
}

async function syncLatestBuild() {
  const currentBuildId = __APP_BUILD_ID__;
  const previousBuildId = window.localStorage.getItem(BUILD_STORAGE_KEY);

  if (previousBuildId && previousBuildId !== currentBuildId) {
    await clearBrowserRuntimeState();
    window.localStorage.setItem(BUILD_STORAGE_KEY, currentBuildId);
    reloadToBuild(currentBuildId);
    return false;
  }

  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (response.ok) {
      const data = (await response.json()) as { buildId?: string };

      if (data.buildId && data.buildId !== currentBuildId) {
        await clearBrowserRuntimeState();
        window.localStorage.setItem(BUILD_STORAGE_KEY, data.buildId);
        reloadToBuild(data.buildId);
        return false;
      }
    }
  } catch {
    // Ignore version check failures and continue booting the app.
  }

  window.localStorage.setItem(BUILD_STORAGE_KEY, currentBuildId);
  return true;
}

void syncLatestBuild().then((shouldRender) => {
  if (!shouldRender) {
    return;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
