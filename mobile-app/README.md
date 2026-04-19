# EduFlow Mobile (APK Design)

Bu loyiha web-mobile emas, **native mobile app (APK)** dizayni uchun tayyorlangan `Expo + React Native` skeleton.

## Tayyorlangan UI
- `student` rol: progress, payment, task holatlari
- `teacher` rol: class metrics, assignment queue
- `admin` rol: finance + platform analytics overview
- premium dark visual style: glass cardlar, soft border, mobile touch-first layout

## Fayl tuzilmasi
- `App.tsx` — app shell, role switcher, bottom nav, screen routing
- `src/screens/StudentScreen.tsx` — student mobil dashboard/tabs
- `src/screens/TeacherScreen.tsx` — teacher mobil dashboard/tabs
- `src/screens/AdminScreen.tsx` — admin mobil dashboard/tabs
- `src/components/BottomNav.tsx` — pastki mobil navigatsiya
- `src/components/RoleSwitcher.tsx` — role switch (demo)
- `src/components/GlassCard.tsx` — reusable premium stat card
- `src/components/SectionTitle.tsx` — section heading komponenti
- `src/theme/colors.ts` — rang tizimi
- `src/theme/spacing.ts` — spacing tokenlari

## Ishga tushirish

```powershell
Set-Location "C:\react Jonibek\vite-project\mobile-app"
npm install
npm run start
```

## Local verifikatsiya

```powershell
Set-Location "C:\react Jonibek\vite-project\mobile-app"
npm run typecheck
```

## Android dev build (USB/emulator)

```powershell
Set-Location "C:\react Jonibek\vite-project\mobile-app"
npm run android
```

## APK release build (EAS)

```powershell
Set-Location "C:\react Jonibek\vite-project\mobile-app"
npx eas login
npx eas build:configure
npx eas build -p android --profile preview
```

> `preview` profildan olingan build odatda APK bo‘ladi (AAB emas). Agar kerak bo‘lsa `eas.json` bilan profilni aniq sozlab beraman.

## Keyingi bosqich (xohlasangiz)
- real API auth (`JWT`) integratsiya
- `React Navigation` (stack + tabs) production flow
- push notifications (`expo-notifications`)
- offline cache (`AsyncStorage`) va shimmer loading
