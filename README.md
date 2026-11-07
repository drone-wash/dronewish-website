# dronewash — אתר ודף נחיתה

- `public/` — האתר (`/`) ודף הנחיתה (`/lp/`). HTML/CSS/JS סטטי, בלי build.
- `public/js/lead-form.js` — שליחת הטופס בשני העמודים ל־`/api/lead`.
- `netlify/functions/lead.mjs` — ולידציה בצד השרת, מלכודת ספאם, הגבלת קצב (5 פניות ל־10 דקות לכל IP), ושמירה ב־Supabase.
- `supabase/migrations/` — טבלת `leads`. RLS פעיל ללא מדיניות: הדפדפן לא יכול לקרוא או לכתוב.

## משתני סביבה ב־Netlify (Site configuration → Environment variables)
- `SUPABASE_URL` — כתובת הפרויקט ב־Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — מפתח service_role (סודי, לסמן Secret). לא נכנס לקוד.

## ענפים
- `main` — הגרסה החיה. `dev` — פיתוח עם תצוגה מקדימה קבועה. כל Pull Request מקבל תצוגה משלו.

## לפני השקה
- להסיר את חסימת האינדוקס: בלוק ה־headers ב־`netlify.toml`, `public/robots.txt` ותגיות `meta name="robots"`.
- להסיר הודעות דמו רק אחרי בדיקת פנייה מקצה לקצה.

## חזרה לגרסה קודמת
ב־Netlify: Deploys → בוחרים deploy קודם → Publish deploy.

הוראות המקור של החבילה: `ORIGINAL_README.md`.
