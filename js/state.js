export const state = {
  user: null,
  activeSeason: null,
  usersById: {},
  teamCodes: {},
  pendingCount: 0,
  isAdmin: false
};

export function displayNameFor(uid) {
  if (state.user && uid === state.user.uid) return state.user.displayName || "Ich";
  const u = state.usersById[uid];
  return u?.displayName || u?.email || "Unbekannt";
}
