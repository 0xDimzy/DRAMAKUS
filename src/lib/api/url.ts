export const normalizePlaybackUrl = (input?: string | null): string => {
  const value = String(input || '').trim();
  if (!value) return '';

  if (value.startsWith('http://')) {
    return `https://${value.slice('http://'.length)}`;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  return value;
};
