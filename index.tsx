import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import './index.css';
import 'katex/dist/katex.min.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SiteAccountSessionProviderV3 } from './components/site/SiteAccountSessionV3';
import { detectPreferredLocale, isLocale, prefixPath, stripLocaleFromPathname } from './localeRouting';

const Home = React.lazy(
  () => import('./components/Home').then((module) => ({ default: module.Home })),
);
const WorkbenchPage = React.lazy(
  () => import('./components/workbench/WorkbenchPage').then((module) => ({
    default: module.WorkbenchPage,
  })),
);
const WorkbenchModelLabPage = React.lazy(
  () => import('./components/workbench/WorkbenchPage').then((module) => ({
    default: module.WorkbenchModelLabPage,
  })),
);
const DevDashboardPage = React.lazy(
  () => import('./components/dev/DevDashboardPage').then((module) => ({
    default: module.DevDashboardPage,
  })),
);
const WorkbenchSelectorPage = React.lazy(
  () => import('./components/workbench/WorkbenchSelectorPage').then((module) => ({
    default: module.WorkbenchSelectorPage,
  })),
);
const PublicExperimentDirectoryPage = React.lazy(
  () => import('./components/site/PublicExperimentDirectoryPage').then((module) => ({
    default: module.PublicExperimentDirectoryPage,
  })),
);
const ArticleEditorPage = React.lazy(
  () => import('./components/article/editor/ArticleEditorPage').then((module) => ({
    default: module.ArticleEditorPage,
  })),
);
const ArticleLibraryPage = React.lazy(
  () => import('./components/article/ArticleLibraryPage').then((module) => ({
    default: module.ArticleLibraryPage,
  })),
);
const PublicArticleDirectoryPage = React.lazy(
  () => import('./components/site/PublicArticleDirectoryPage').then((module) => ({
    default: module.PublicArticleDirectoryPage,
  })),
);
const ArticleReaderPage = React.lazy(
  () => import('./components/article/ArticleReaderPage').then((module) => ({
    default: module.ArticleReaderPage,
  })),
);
const ExperimentSnapshotPage = React.lazy(
  () => import('./components/experiment/ExperimentSnapshotPage').then((module) => ({
    default: module.ExperimentSnapshotPage,
  })),
);
const AccountAccessPage = React.lazy(
  () => import('./components/account/AccountAccessPage').then((module) => ({
    default: module.AccountAccessPage,
  })),
);
const AccountSettingsPage = React.lazy(
  () => import('./components/account/AccountSettingsPage').then((module) => ({
    default: module.AccountSettingsPage,
  })),
);
const AuthoringCliDocsPage = React.lazy(
  () => import('./components/dev/AuthoringCliDocsPage').then((module) => ({
    default: module.AuthoringCliDocsPage,
  })),
);
const ModelDocumentationPage = React.lazy(
  () => import('./components/model/ModelDocumentationPage').then((module) => ({
    default: module.ModelDocumentationPage,
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
      path="experiments"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Experiments…" />}>
          <PublicExperimentDirectoryPage />
        </React.Suspense>
      )}
    />
    <Route
      path="me/experiments"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading saved Experiments…" />}>
          <WorkbenchSelectorPage />
        </React.Suspense>
      )}
    />
    <Route
      path="experiments/:experimentId"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Workbench…" />}>
          <WorkbenchPage />
        </React.Suspense>
      )}
    />
    <Route
      path="dev"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading development content…" />}>
          <DevDashboardPage />
        </React.Suspense>
      )}
    />
    <Route
      path="dev/model-lab"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Model Lab…" />}>
          <WorkbenchModelLabPage />
        </React.Suspense>
      )}
    />
    <Route
      path="snapshots/:snapshotId"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Snapshot…" />}>
          <ExperimentSnapshotPage />
        </React.Suspense>
      )}
    />
    <Route
      path="articles"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Articles…" />}>
          <PublicArticleDirectoryPage />
        </React.Suspense>
      )}
    />
    <Route
      path="me/articles"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading saved Articles…" />}>
          <ArticleLibraryPage />
        </React.Suspense>
      )}
    />
    <Route
      path="articles/:articleId/edit"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Article Editor…" />}>
          <ArticleEditorPage />
        </React.Suspense>
      )}
    />
    <Route
      path="articles/:articleId/preview"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Article preview…" />}>
          <ArticleReaderPage />
        </React.Suspense>
      )}
    />
    <Route
      path="articles/:articleId"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Article…" />}>
          <ArticleReaderPage />
        </React.Suspense>
      )}
    />
    <Route
      path="login"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading account…" />}>
          <AccountAccessPage />
        </React.Suspense>
      )}
    />
    <Route
      path="me/settings"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading settings…" />}>
          <AccountSettingsPage />
        </React.Suspense>
      )}
    />
    <Route
      path="docs/authoring-cli"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading Authoring CLI guide…" />}>
          <AuthoringCliDocsPage />
        </React.Suspense>
      )}
    />
    <Route
      path="models/:modelId"
      element={(
        <React.Suspense fallback={<ProductPageLoading label="Loading model documentation…" />}>
          <ModelDocumentationPage />
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
      <SiteAccountSessionProviderV3>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PreferredLocaleRedirect />} />
            <Route path="/:locale" element={<LocalizedLayout />}>
              {appRoutes()}
            </Route>
            <Route path="*" element={<PreferredLocaleRedirect />} />
          </Routes>
        </BrowserRouter>
      </SiteAccountSessionProviderV3>
    </ErrorBoundary>
  </React.StrictMode>
);
