# Contact-form email notifications (shared)

One Cloud Functions codebase that emails Lientjie whenever a visitor submits a
contact form on **either** site (both live in the Firebase project
`lientjie-project`). Email is sent through the account's own **Gmail SMTP**
(nodemailer) - no third-party service, the same approach as the Francois0203
project. Replying to the notification replies to the visitor.

| Trigger | Collection | Site |
|---|---|---|
| `onPortfolioMessage`  | `portfolio_messages`  | Portfolio |
| `onPetsittingMessage` | `petsitting_messages` | Petsitting |

## One-time setup (no new signups)

1. **Blaze plan** - already done.

2. **Gmail App Password** - a setting on the existing Gmail account, not a new
   account:
   - Enable **2-Step Verification** on the Google account (required for app passwords).
   - Google Account -> Security -> **App passwords** -> create one -> copy the
     16-character password.

3. **Install deps**

   ```bash
   cd functions
   npm install
   ```

4. **Set the secret** (the app password, stored encrypted in Secret Manager):

   ```bash
   firebase functions:secrets:set SMTP_PASSWORD
   ```

5. **Params** live in `functions/.env` (gitignored):

   ```
   SMTP_USER=meiringjacqueline1302@gmail.com
   NOTIFY_TO=meiringjacqueline1302@gmail.com
   ```

   `SMTP_USER` is the Gmail that sends; `NOTIFY_TO` is where notifications land
   (the same inbox is fine). Both sites deliver here.

6. **Region** - `index.js` sets `REGION = 'europe-west1'` to match the Firestore
   database location. A mismatch makes the deploy fail.

7. **Deploy**

   ```bash
   firebase deploy --only functions --project lientjie-project
   ```

## Notes

- Firestore security rules already allow anyone to *create* a message and only
  admins to read/delete, so no rules change is needed.
- The function never rethrows on send failure (a bad password won't cause a retry
  storm); check `firebase functions:log` if a notification doesn't arrive. The
  message is stored in Firestore (and shown in the admin inbox) regardless.
