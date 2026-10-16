# COMSATS Internship Portal

## Run locally

```sh
npm install
npm run dev
```

## Firebase requirements

Portal access requires a verified Firebase Authentication session. User accounts, profiles, academic and placement details, student submissions and signatures, and campus templates are read from and saved to Firebase so they can be loaded on another device after sign-in. Image and document files are stored in Firebase Storage; their metadata is stored in Cloud Firestore.

Configure the Firebase project used in `src/firebase.js` with:

- Email/password authentication and email verification enabled.
- A Cloud Firestore database with the `users` and `templates` collections available.
- Firebase Storage enabled for profile photos, signatures, uploaded documents, and templates.
- Firestore and Storage security rules that enforce signed-in access, same-campus role access for staff workflows, and prevent users from changing their own role or campus.

The application reports Firebase read/write and upload failures to the user. It does not treat local browser storage as the source of truth for account data.
