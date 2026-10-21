# AquaFlow Firebase / Google Login

The app is configured for Firebase project `flow-5ffcb` using the Web App config supplied by the project owner.

## Required Firebase Console settings

1. Firebase Console -> Authentication -> Sign-in method -> Google -> Enable.
2. Authentication -> Settings -> Authorized domains -> add `localhost`.
3. If the error is `auth/api-key-not-valid`, open Google Cloud Console for the same Firebase project and check the API key used by the Web App:
   - It must be an active Browser/Web API key belonging to project `flow-5ffcb`.
   - If API restrictions are enabled, allow the Firebase Authentication / Identity Toolkit APIs, or temporarily remove API restrictions while testing locally.
   - If Application restrictions are HTTP referrers, allow `http://localhost/*` and `http://localhost:5173/*`.
4. In Firebase Project settings -> General -> Your apps -> Web app, copy the current SDK config if the project owner has regenerated/replaced the API key. Update `src/firebase.js` with that exact config.

## Roles

- `markalexsodayi82@gmail.com` -> admin
- Every other Google account -> customer

Email/password admin login:
- Email: `markalexsodayi82@gmail.com`
- Password: `ALEXADIEMARKSODAYI2006`

This role mapping is app-side routing. For production security, use Firebase custom claims + Firestore Security Rules for server-enforced admin authorization.


## Google accounts
You do **not** need to manually add every Google email under Firebase Authentication > Users. Once the Google sign-in provider is enabled, a Google account can sign in for the first time and Firebase Authentication creates the user automatically. AquaFlow assigns `markalexsodayi82@gmail.com` to the admin role and every other Google account to the customer role.

Firebase still requires the Google provider to be enabled and the site's domain (for local development, `localhost`) to be authorized. This is a Firebase security requirement and cannot be bypassed by React code.
