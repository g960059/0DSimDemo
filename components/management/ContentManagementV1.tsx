import React from "react";
import { BookOpenText, FileText, FlaskConical, Plus } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { myArticlesHref, myExperimentsHref } from "@/homeLinks";
import { localeFromPathname, stripLocaleFromPathname } from "@/localeRouting";
import "./ContentManagementV1.css";

export function isContentManagementRouteV1(pathname: string): boolean {
  return /^\/me\/(articles|courses|experiments)\/?$/.test(stripLocaleFromPathname(pathname));
}

export function ContentManagementLayoutV1({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const locale = localeFromPathname(pathname);
  const items = [
    { href: myArticlesHref(locale), label: t("management.articles"), icon: FileText },
    { href: `/${locale}/me/courses`, label: t("management.courses"), icon: BookOpenText },
    { href: myExperimentsHref(locale), label: t("management.experiments"), icon: FlaskConical },
  ];
  return (
    <div className="management-scroll">
      <div className="management-layout">
        <aside className="management-sidebar">
          <nav aria-label={t("management.navigation")} className="management-nav">
            {items.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} to={href} end className="management-nav-link">
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="management-content">{children}</div>
      </div>
    </div>
  );
}

export function ManagementPageHeaderV1({ title, createHref, createLabel, createTestId }: Readonly<{
  title: string;
  createHref: string;
  createLabel: string;
  createTestId?: string;
}>) {
  const { t } = useTranslation();
  return (
    <div className="management-page-header">
      <h1>{title}</h1>
      <Link to={createHref} className="management-create" aria-label={createLabel} data-testid={createTestId}>
        <Plus aria-hidden="true" />
        {t("management.create")}
      </Link>
    </div>
  );
}
