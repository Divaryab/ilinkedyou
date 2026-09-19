# فرم نیازسنجی خرید

فرم دو مرحله‌ای در هر دو صفحه فارسی و انگلیسی، بخش #consultation قرار دارد. دکمه‌های اصلی به آن می‌رسند.

فایل‌ها: assets/css/consultation.css و assets/js/consultation.js و fa/index.html.

API و پنل مدیریت در پروژه MyDashboard قرار دارند. راهنمای کامل: docs/consultation-setup.fa.md در آن پروژه.

وضعیت ۱۲ سپتامبر ۲۰۲۶: جدول خصوصی درخواست‌ها در Supabase ایجاد شده، پنل جدید روی Worker ilinkedyou-portal-preview منتشر شده و کلیدهای اتصال و Turnstile ثبت شده‌اند. پاسخ عمومی API با Origin سایت 200 است. ثبت کامل آنلاین باید پس از انتشار سایت تأیید شود.

آدرس API در data-endpoint فرم تنظیم می‌شود. هیچ کلید محرمانه‌ای در این مخزن عمومی قرار نمی‌گیرد.

صفحه انگلیسی نیز از همان data model و API استفاده می‌کند و locale را به‌صورت صحیح ارسال می‌کند.
۱۳ سپتامبر ۲۰۲۶: پیام موفقیت با متن تأییدشده علی، تیک مجزا در چپ عنوان و نام روش انتخاب‌شده تنظیم شد. فرم چهار روش phone/whatsapp/telegram/email دارد؛ کاربر اجرای migration شماره 202609130002_contact_methods.sql را تأیید کرد؛ نسخه API پشتیبان نیز در MyDashboard آماده شد.

۱۹ سپتامبر ۲۰۲۶: فرم به دو مرحله تغییر کرد؛ Deposit و Summary حذف شدند و صفحه انگلیسی نیز فرم کامل دارد. locale، landing_page، lead_source، UTMها و referrer همراه Lead ذخیره می‌شوند. ویرایش پس از ثبت با همان UUID به‌صورت upsert انجام می‌شود تا رکورد تکراری ساخته نشود. migration جدید `202609190001_consultation_tracking.sql` برای ستون‌های tracking اضافه شده است.
