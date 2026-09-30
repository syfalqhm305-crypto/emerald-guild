# نقابة إميرالد — Emerald Guild Web Platform

نظام متكامل: موقع رئيسي + لوحة قيادة عليا + بنك النقابة + متجر مرتبط بالبنك.
البيانات الآن محفوظة على **Firebase Firestore** (قاعدة بيانات Google السحابية المجانية) —
لا تنقطع أبدًا، وتظهر لكل زوار الموقع من أي جهاز.

## هيكل الملفات
```
index.html            → الموقع الرئيسي (عام) + زر دخول القائد/النواب
bank.html              → دخول عضو + دخول مسؤول البنك + لوحتا التحكم
store.html             → المتجر العام + دخول مسؤول المتجر + لوحة إدارة المنتجات
leader.html            → لوحة القيادة العليا (القائد + النواب)
css/style.css          → التصميم الموحّد
js/firebase-config.js  → بيانات مشروعك في Firebase (لازم تعبّيها بنفسك)
js/db.js               → طبقة البيانات (تتصل بـ Firestore)
js/main.js             → أدوات الواجهة: تنبيهات، نوافذ، أصوات، أنيميشن
assets/logo.png        → شعار النقابة
```

---

## خطوات ربط الموقع بـ Firebase (من الجوال بالكامل)

### 1) أنشئ مشروع Firebase
1. افتح [console.firebase.google.com](https://console.firebase.google.com) وسجّل دخول بحساب Google
2. اضغط **Add project / إضافة مشروع**
3. اكتب اسم (مثلاً `emerald-guild`) → التالي → **عطّل** خيار Google Analytics (مو ضروري) → **Create project**

### 2) فعّل قاعدة بيانات Firestore
1. من القائمة الجانبية (☰) اختر **Build → Firestore Database**
2. اضغط **Create database**
3. اختر **Start in production mode** → Next
4. اختر أقرب موقع سيرفر لك (مثلاً `eur3` أو `me-central`) → **Enable**

### 3) أنشئ تطبيق ويب واحصل على بيانات الربط
1. ارجع للصفحة الرئيسية للمشروع (اضغط اسم المشروع/البيت 🏠)
2. اضغط أيقونة **</>）(Web)** لإضافة تطبيق ويب
3. اكتب اسم أي شيء (مثلاً `emerald-web`) → **Register app** (لا تحتاج Firebase Hosting)
4. بيظهر لك كائن `firebaseConfig` فيه قيم مثل:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "emerald-guild.firebaseapp.com",
     projectId: "emerald-guild",
     storageBucket: "emerald-guild.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
5. انسخ هذا الكائن بالكامل

### 4) عبّي ملف الإعدادات في المشروع
1. افتح ملف `js/firebase-config.js` (من GitHub مباشرة: اضغط الملف → أيقونة القلم للتعديل)
2. الصق القيم اللي نسختها مكان `"ضع القيمة هنا"` في كل سطر
3. احفظ (Commit changes)

### 5) فعّل قواعد الحماية (Security Rules)
1. ارجع لـ Firestore Database في Firebase Console → تبويب **Rules**
2. امسح المحتوى والصق:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. اضغط **Publish**

⚠️ **مهم بخصوص الأمان:** هذه القاعدة تسمح للجميع بالقراءة والكتابة مباشرة عبر Firebase API
(مو بس من خلال الموقع). هذا نفس مستوى الحماية الحالي في الموقع أصلًا (كلمات مرور تُقارن داخل
المتصفح)، لكن من الناحية النظرية أي شخص تقني يعرف رابط مشروعك يقدر يوصل للبيانات مباشرة
متجاوزًا كلمات المرور. لحماية أقوى مستقبلًا، الخطوة التالية هي إضافة **Firebase Authentication**
الحقيقي — وهذا تطوير إضافي يمكن نعمله لاحقًا لو احتجته.

### 6) ارفع الملفات على GitHub
- استخدم نفس طريقة رفع الزيب وفكّه تلقائيًا اللي سوّيناها سابقًا (GitHub Action)
- تأكد إن ملف `js/firebase-config.js` معبّى **قبل** ما ترفع، أو عدّله مباشرة بعد الرفع من GitHub

### 7) جرّب
- افتح الموقع → أول فتح بيزرع البيانات الافتراضية تلقائيًا في Firestore (تقدر تتأكد من تبويب
  **Data** بقاعدة البيانات في Firebase Console، بتشوف مجموعات مثل `guild`, `members`, `products`)
- من الآن، أي عضو يفتح الموقع من أي جهاز بيشوف نفس البيانات لحظيًا

---

## كلمات المرور الافتراضية (غيّرها فورًا بعد الرفع)
- القائد الأعلى: `leader123`
- مسؤول البنك: `bank123`
- مسؤول المتجر: `store123`
- عضو تجريبي: ID `1000001` / اللقب `العضو المؤسس` / باسورد `member123`

غيّرها من لوحة القيادة (`leader.html`) بعد أول دخول، أو مباشرة من بيانات المستند `guild/main`
و`admins/bank` و`admins/store` داخل Firebase Console.

## لماذا Firebase ولا تنقطع؟
خطة Firebase المجانية (Spark) لا تتوقف أو "تنام" أبدًا بعكس بعض البدائل — تفضل متاحة 24/7 طالما
ما تجاوزت الحد المجاني السخي (50 ألف قراءة و20 ألف كتابة يوميًا، 1 جيجابايت تخزين)، وهذا أكثر من
كافٍ لنقابة عادية.

## الرفع على GitHub Pages / Vercel / Netlify
هذا مشروع Static (HTML/CSS/JS) — ارفعه كما هو على أي من هذه الخدمات، الاتصال بـ Firestore
يشتغل من المتصفح مباشرة بدون أي سيرفر خلفي.
