import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { detectPreferredLocale, isLocale, prefixPath, stripLocaleFromPathname } from './localeRouting';

const Home = React.lazy(
  () => import('./components/Home').then((module) => ({ default: module.Home })),
);
const WorkbenchV3Page = React.lazy(
  () => import('./components/WorkbenchV3Page').then((module) => ({
    default: module.WorkbenchV3Page,
  })),
);

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
      path="workbench"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading V3 Workbench…" />}>
          <WorkbenchV3Page />
        </React.Suspense>
      )}
    />
    <Route path="*" element={<LocalizedHomeRedirect />} />
  </>
);

const ProductPageLoading = ({ label }: { label: string }) => (
  <div
    className="flex h-full items-center justify-center bg-wb-app text-sm text-wb-muted"
    role="status"
  >
    {label}
  </div>
);

/** Unknown locale-scoped paths return to the home page in the same locale. */
const LocalizedHomeRedirect = () => {
  const { locale } = useParams();
  return (
    <Navigate
      to={prefixPath("/", isLocale(locale) ? locale : detectPreferredLocale())}
      replace
    />
  );
};

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PreferredLocaleRedirect />} />
          <Route path="/:locale" element={<LocalizedLayout />}>
            {appRoutes()}
          </Route>
          <Route path="*" element={<PreferredLocaleRedirect />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
