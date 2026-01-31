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
  "logo_a": { "url": "https://..." },
  "logo_b": { "url": "https://..." },
  "stream_link": [
    { "name": "FHD", "url": "https://...", "is_premium": false }
  ]
}
```

---

## 2. حذف مباريات (Bulk Delete)

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

## ملاحظات تقنية:
1. الروابط تعمل بنظام JSON بالكامل.
2. تأكد من إرسال الـ Header التالي: `Content-Type: application/json`.
3. الصور (`logo_a`, `logo_b`) والروابط (`stream_link`) يتم تخزينها ككائنات JSON.
