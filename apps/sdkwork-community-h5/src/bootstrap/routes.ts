export const routes = {
  home: '/',
  community: {
    feed: '/community',
    entry: '/community/:entryId',
    newEntry: '/community/new',
  },
} as const;