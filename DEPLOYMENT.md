# 🚀 دليل النشر

دليل شامل لنشر نظام إدارة الشحنات على منصات مختلفة.

## 🌐 النشر على Firebase Hosting

### 1. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول إلى Firebase

```bash
firebase login
```

### 3. تهيئة المشروع

```bash
firebase init hosting
```

اختر الخيارات التالية:
- Use an existing project
- اختر مشروع Firebase الخاص بك
- Public directory: `dist`
- Configure as a single-page app: `Yes`
- Set up automatic builds and deploys: `No`

### 4. بناء المشروع

```bash
npm run build
```

### 5. النشر

```bash
firebase deploy
```

## 🌐 النشر على Vercel

### 1. تثبيت Vercel CLI

```bash
npm install -g vercel
```

### 2. تسجيل الدخول

```bash
vercel login
```

### 3. النشر

```bash
vercel
```

أو للنشر مباشرة:

```bash
vercel --prod
```

## 🌐 النشر على Netlify

### 1. رفع المشروع إلى GitHub

### 2. ربط المشروع بـ Netlify

1. اذهب إلى [netlify.com](https://netlify.com)
2. اضغط على "New site from Git"
3. اختر GitHub واختر المشروع
4. إعدادات البناء:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. إعداد متغيرات البيئة

أضف متغيرات Firebase في إعدادات Netlify.

## 🔧 إعدادات البيئة

### متغيرات البيئة المطلوبة

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### إعداد Firebase

1. أنشئ مشروع Firebase جديد
2. فعّل Authentication
3. فعّل Firestore Database
4. أنشئ تطبيق ويب
5. انسخ بيانات التكوين

## 📱 النشر كـ PWA

### 1. إضافة Service Worker

```bash
npm install workbox-webpack-plugin
```

### 2. تكوين Vite

أضف إعدادات PWA في `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
```

### 3. إضافة Manifest

أنشئ ملف `public/manifest.json`:

```json
{
  "name": "نظام إدارة الشحنات",
  "short_name": "الشحنات",
  "description": "نظام متكامل لإدارة الشحنات والنقل السريع",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔒 إعدادات الأمان

### 1. قواعد Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قواعد للمستخدمين
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // قواعد للشحنات
    match /shipments/{shipmentId} {
      allow read, write: if request.auth != null;
    }
    
    // قواعد للرحلات
    match /trips/{tripId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. إعدادات CORS

```javascript
// في Firebase Functions
const cors = require('cors')({origin: true});
```

## 📊 مراقبة الأداء

### 1. Google Analytics

```javascript
// إضافة في index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 2. Firebase Analytics

```javascript
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);
```

## 🔄 النشر التلقائي

### GitHub Actions

أنشئ ملف `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-project-id
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في Firebase Config**
   - تأكد من صحة بيانات التكوين
   - تحقق من تفعيل الخدمات المطلوبة

2. **مشاكل في البناء**
   - تأكد من تثبيت جميع التبعيات
   - تحقق من إصدار Node.js

3. **مشاكل في النشر**
   - تحقق من إعدادات CORS
   - تأكد من صحة قواعد Firestore

## 📞 الدعم

للاستفسارات حول النشر:
- راجع وثائق Firebase
- راجع وثائق Vercel/Netlify
- راسلنا على البريد الإلكتروني

---

**شركة المستقيم للنقل السريع والشحن الدولي** 🚚
