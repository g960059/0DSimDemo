import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { OfficialCases } from './components/Cases';
import { LessonReadingRoute } from './components/reading/LessonReadingRoute';
import Workbench from './WorkbenchPage';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { detectPreferredLocale, isLocale, prefixPath, stripLocaleFromPathname } from './localeRouting';
import { SCIENTIFIC_BROWSER_PERFORMANCE_APP_ENTRY_MARK_V0 } from './components/scientificPerformance/scientificBrowserPerformanceTraceV0';

const ScientificRuntimeAlphaPage = React.lazy(
  () => import('./components/scientificAlpha/ScientificRuntimeAlphaPage'),
);
const ScientificWorkbenchPage = React.lazy(
  () => import('./components/scientificWorkbench/ScientificWorkbenchPageV1'),
);
const ScientificBrowserPerformanceLab = React.lazy(
  () => import('./components/scientificPerformance/ScientificBrowserPerformanceLabV0'),
);

if (
  window.location.pathname.endsWith('/scientific-performance-lab')
  && performance.getEntriesByName(
    SCIENTIFIC_BROWSER_PERFORMANCE_APP_ENTRY_MARK_V0,
  ).length === 0
) {
  performance.mark(SCIENTIFIC_BROWSER_PERFORMANCE_APP_ENTRY_MARK_V0);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const appRoutes = () => (
  <>
    <Route index element={<Home />} />
    <Route path="cases" element={<OfficialCases />} />
    <Route path="lesson/:id" element={<LessonReadingRoute />} />
    <Route path="workbench" element={<Workbench />} />
    <Route path="workbench/:caseId" element={<Workbench />} />
    <Route
      path="scientific-alpha"
      element={(
        <React.Suspense fallback={<ScientificAlphaLoading />}>
          <ScientificRuntimeAlphaPage />
        </React.Suspense>
      )}
    />
    <Route
      path="scientific-workbench"
      element={(
        <React.Suspense fallback={<ScientificWorkbenchLoading />}>
          <ScientificWorkbenchPage />
        </React.Suspense>
      )}
    />
    <Route
      path="scientific-performance-lab"
      element={(
        <React.Suspense fallback={<ScientificPerformanceLabLoading />}>
          <ScientificBrowserPerformanceLab />
        </React.Suspense>
      )}
    />
    <Route path="*" element={<Navigate to="." replace />} />
  </>
);

const ScientificAlphaLoading = () => (
  <div
    className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400"
    role="status"
  >
    Loading scientific runtime alpha…
  </div>
);

const ScientificWorkbenchLoading = () => (
  <div
    className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400"
    role="status"
  >
    Loading document-bound scientific workspace…
  </div>
);

const ScientificPerformanceLabLoading = () => (
  <div
    className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400"
    role="status"
  >
    Loading raw scientific browser measurement lab…
  </div>
);

const LocalizedLayout = () => {
  const { locale } = useParams();
  const location = useLocation();
  if (!isLocale(locale)) {
    const redirected = `${prefixPath(stripLocaleFromPathname(location.pathname), detectPreferredLocale())}${location.search}${location.hash}`;
    return <Navigate to={redirected} replace />;
  }
  return <Layout />;
};

const PreferredLocaleRedirect = () => (
  <Navigate to={prefixPath("/", detectPreferredLocale())} replace />
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PreferredLocaleRedirect />} />
            <Route path="/:locale" element={<LocalizedLayout />}>
              {appRoutes()}
            </Route>
            <Route path="*" element={<PreferredLocaleRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
