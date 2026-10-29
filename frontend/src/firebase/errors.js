/*
 * Turning Firebase error codes into something an admin can act on.
 *
 * The screen and firestore.rules both check the `settings/admins` allow-list,
 * so a refused save usually means the address was removed from it or the
 * sign-in expired. Say which, rather than a bare "failed to save".
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
