// Formatting helpers mirroring the original app.
// Date locales follow the saved app language (en-US / fr-FR / ar-MA).

function dateLocale() {
  try {
    const l = localStorage.getItem('ff_lang');
    return l === 'ar' ? 'ar-MA' : l === 'fr' ? 'fr-FR' : 'en-US';
  } catch {
    return 'en-US';
  }
}

export const currency = (n) =>
  Number(n || 0).toLocaleString('en-US').replace(/,/g, ' ') + ' DH';

export const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString(dateLocale(), { month: 'short', day: 'numeric' }) : '—';

export const fullDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(dateLocale(), { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

export const longDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(dateLocale(), { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

export const monthKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
