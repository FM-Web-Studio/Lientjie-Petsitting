/*
 * Turning Firebase error codes into something an admin can act on.
 *
 * Every admin save shares one non-obvious failure mode: reaching this screen is
 * gated by the ADMIN_EMAILS build variable, but WRITING is gated by
 * firestore.rules, which reads its allow-list from the `settings/admins`
 * document. The two are maintained separately, so an address can log in, see
 * the whole admin UI, and have every save silently refused. A toast that only
 * says "failed to save" sends you looking in the wrong place for that.
 */
export function saveErrorMessage(err, what = 'those changes') {
  switch (err?.code) {
    case 'permission-denied':
      return `Could not save ${what}: your account is not on the admin allow-list (settings/admins in Firestore).`;
    case 'unauthenticated':
      return `Could not save ${what}: your sign-in expired. Sign out and back in.`;
    case 'unavailable':
    case 'deadline-exceeded':
      return `Could not save ${what}: no connection to the server. Check your network and try again.`;
    default:
      return `Could not save ${what}. Please try again.`;
  }
}
