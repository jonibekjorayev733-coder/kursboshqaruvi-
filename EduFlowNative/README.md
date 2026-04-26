# EduFlow Native (Student Panel)

This is the React Native (Expo) mobile app for **student-only panel** of your existing EduGrow/Kurs Boshqaruvi backend.

## Implemented screens

- `Dashboard`
- `Courses`
- `Payments`
- `Notifications`
- `Profile`

## Backend configuration

By default, app uses:

- `https://kursboshqaruvi-backend.onrender.com`

If you need another backend URL, set env variable:

```bash
EXPO_PUBLIC_API_URL=https://your-backend-url
```

## Run locally

```bash
npm install
npx expo start
```

Quick platform commands:

```bash
npm run android
npm run ios
npm run web
```

## Notes

- Student session stores selected `studentId` in local storage.
- You can change active student from `Profile` tab.
- No git push was performed for this mobile app work.
