export const lessonHref = (id: string) => `/lesson/${encodeURIComponent(id)}`;

export const caseHref = (id: string) => `/workbench/${encodeURIComponent(id)}?from=cases`;

export const workbenchHref = () => '/workbench';

export const allCasesHref = () => '/cases';
