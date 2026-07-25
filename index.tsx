import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StudioAuthorPreviewProviderV1 } from './components/studio/StudioAuthorPreviewProviderV1';
import { detectPreferredLocale, isLocale, prefixPath, stripLocaleFromPathname } from './localeRouting';
import { SCIENTIFIC_BROWSER_PERFORMANCE_APP_ENTRY_MARK_V0 } from './components/scientificPerformance/scientificBrowserPerformanceTraceV0';

const Home = React.lazy(
  () => import('./components/Home').then((module) => ({ default: module.Home })),
);
const OfficialCases = React.lazy(
  () => import('./components/Cases').then((module) => ({ default: module.OfficialCases })),
);
const LessonReadingRoute = React.lazy(
  () => import('./components/reading/LessonReadingRoute').then((module) => ({
    default: module.LessonReadingRoute,
  })),
);
const ScientificRuntimeAlphaPage = React.lazy(
  () => import('./components/scientificAlpha/ScientificRuntimeAlphaPage'),
);
const ScientificWorkbenchPage = React.lazy(
  () => import('./components/scientificWorkbench/ScientificWorkbenchPageV1'),
);
const ScientificProductWorkbenchPage = React.lazy(
  () => import('./components/scientificProduct/ScientificProductWorkbenchPageV1'),
);
const StudioDocumentRouteV1 = React.lazy(
  () => import('./components/studio/StudioDocumentRouteV1'),
);
const StudioReaderPreviewRouteV1 = React.lazy(
  () => import('./components/studio/reader/StudioReaderPreviewRouteV1'),
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
    <Route
      index
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading home…" />}>
          <Home />
        </React.Suspense>
      )}
    />
    <Route
      path="cases"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading cases…" />}>
          <OfficialCases />
        </React.Suspense>
      )}
    />
    <Route
      path="lesson/:id"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading lesson…" />}>
          <LessonReadingRoute />
        </React.Suspense>
      )}
    />
    <Route
      path="workbench"
      element={(
        <React.Suspense fallback={<ProductWorkbenchLoading />}>
          <ScientificProductWorkbenchPage />
        </React.Suspense>
      )}
    />
    <Route
      path="workbench/:caseId"
      element={(
        <React.Suspense fallback={<ProductWorkbenchLoading />}>
          <ScientificProductWorkbenchPage />
        </React.Suspense>
      )}
    />
    <Route
      path="studio/author"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading author workspace…" />}>
          <StudioDocumentRouteV1 />
        </React.Suspense>
      )}
    />
    <Route
      path="studio/preview/:previewId"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Opening Reader Preview…" />}>
          <StudioReaderPreviewRouteV1 />
        </React.Suspense>
      )}
    />
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

const ProductWorkbenchLoading = () => (
  <div
    className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400"
    role="status"
  >
    Loading the circulation workbench…
  </div>
);

const ProductPageLoading = ({ label }: { label: string }) => (
  <div
    className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400"
    role="status"
  >
    {label}
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
  return (
    <StudioAuthorPreviewProviderV1>
      <Layout />
    </StudioAuthorPreviewProviderV1>
  );
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
