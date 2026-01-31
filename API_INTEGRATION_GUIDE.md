# دليل ربط تطبيق خارجي (API Integration Guide)

هذا الدليل يشرح كيفية ربط نظام خارجي مع لوحة التحكم لإضافة وحذف المباريات برمجياً.

## بيانات المصادقة (Authentication)
جميع الطلبات إلى روابط الـ Admin تتطلب إرسال `secret` التابع للمسؤول.

- **Admin Secret:** `7esen`

---

## 1. إضافة مباراة جديدة (Create Match)

يتم إرسال طلب `POST` إلى الرابط التالي:
`POST /api/admin/matches`

### جسم الطلب (Request Body - JSON):
```json
{
  "secret": "7esen",
  "team_a": "الأهلي",
  "team_b": "الزمالك",
  "match_time": "20:00",
  "channel": "OnTime Sports 1",
  "commentator": "مدحت شلبي",
  "champion": "الدوري المصري",
  "is_premium": false,
  "is_published": true,
  "logo_a": "https://...",
  "logo_b": "https://...",
  "stream_link": [
    { "name": "FHD", "url": "https://...", "is_premium": false }
  ]
}
```

---

## 2. إضافة خبر جديد (Create News)

يتم إرسال طلب `POST` إلى الرابط التالي:
`POST /api/admin/news`

### جسم الطلب (Request Body - JSON):
```json
{
  "secret": "7esen",
  "title": "عنوان الخبر هنا",
  "image": { "url": "https://..." },
  "link": { "url": "https://..." },
  "is_premium": false,
  "is_published": true
}
```

---

## 3. حذف بيانات (Bulk Delete)

يتم إرسال طلب `POST` إلى الرابط التالي:
`POST /api/admin/delete`

### جسم الطلب (Request Body - JSON):
```json
{
  "secret": "7esen",
  "type": "matches",
  "ids": [1, 2, 3]
}
```
*ملاحظة: الـ `ids` هي أرقام المعرفات الخاصة بالمباريات المراد حذفها.*

---

## 3. جلب قائمة المباريات (Get Matches)

يمكنك جلب المباريات المتاحة (المنشورة) عبر الرابط:
`GET /api/mobile/matches`

وفي حالة رغبتك في جلب الروابط حتى لو كنت غير مشترك (لأغراض التطوير)، أضف الـ secret كـ query parameter:
`GET /api/mobile/matches?secret=7esen`

---

## 4. بنية البيانات (Data Structures)

لفهم كيفية إرسال البيانات بشكل صحيح، إليك تفاصيل كل حقل:

### أ. كائن المباراة (Match Object)
| الحقل | النوع | الوصف |
| :--- | :--- | :--- |
| `team_a` / `team_b` | String | اسم الفريق (مثال: "ليفربول"). **مطلوب**. |
| `match_time` | String | وقت المباراة بتنسيق 24 ساعة (مثال: "21:45"). **مطلوب**. |
| `logo_a` / `logo_b` | String / Object | رابط شعار الفريق. يمكن أن يكون رابط مباشر (String) أو كائن Cloudinary. |
| `champion` | String | اسم البطولة (مثال: "دوري أبطال أوروبا"). |
| `channel` | String | القناة الناقلة (مثال: "beIN Sports 1"). |
| `commentator` | String | اسم المعلق. |
| `is_premium` | Boolean | `true` للمباريات المشفرة (VIP)، و `false` للمجانية. |
| `is_published` | Boolean | `true` لظهور المباراة في التطبيق، و `false` لحفظها كمسودة. |
| `stream_link` | Array | قائمة روابط البث (انظر التفاصيل بالأسفل). |

### ب. بنية روابط البث (Stream Link Logic)
حقل `stream_link` عبارة عن مصفوفة (Array) تحتوي على كائنات. كل كائن يمثل جودة أو سيرفر مختلف:

```json
[
  {
    "name": "FHD - 1080p", 
    "url": "https://server1.com/live/stream.m3u8",
    "is_premium": true
  },
  {
    "name": "SD - Low Quality",
    "url": "https://server2.com/live/stream.m3u8",
    "is_premium": false
  }
]
```
- **name**: اسم السيرفر أو الجودة اللي هتظهر للمستخدم.
- **url**: رابط البث المباشر (يدعم m3u8, mp4, وغيرها).
- **is_premium**: لو `true` الرابط ده هيظهر للمشتركين فقط، لو `false` هيظهر للكل.

---

## 5. ملاحظات تقنية هامة:
1. الروابط تعمل بنظام JSON بالكامل.
2. تأكد من إرسال الـ Header التالي: `Content-Type: application/json`.
3. الوقت (`match_time`) يفضل إرساله بتوقيت UTC لتجنب مشاكل فارق التوقيت في التطبيقات.
4. يمكنك إرسال `stream_link` كـ JSON String أو كـ Array مباشرة، السيستم مصمم ليفهم الاثنين.
