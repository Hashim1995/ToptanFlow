# Verilənlər Bazası ilə Lokal İnkişaf (Database Development Guide)

> Bu sənəd ön (frontend) mühəndislər üçün yazılıb və PostgreSQL barədə əvvəlcədən dərin bilik tələb etmir. Komandalar, identifikatorlar və kod nümunələri qəsdən ingilis dilində saxlanılıb (repo konvensiyası), izahlar isə Azərbaycan dilindədir. Texniki qərarların mənbəyi: `docs/decisions/ADR-008-postgresql-primary-database.md`, `ADR-014-prisma-orm.md`, `ADR-021-prisma-migrate.md`, `ADR-023-postgresql-decimal-precision.md`.

## 1. PostgreSQL bu layihədə nədir?

TOPTANFLOW-un bütün əməliyyat məlumatları (məhsullar, tərəf-müqabillər, satışlar, alışlar, kassa əməliyyatları və s.) PostgreSQL adlı əlaqəli (relational) verilənlər bazasında saxlanılır (ADR-008). Backend tərəfindən bu bazaya **Prisma** adlı ORM (Object-Relational Mapper) vasitəsilə müraciət olunur (ADR-014) — yəni siz özünüz əl ilə SQL yazmırsınız, Prisma sizin üçün `apps/api/prisma/schema.prisma` faylındakı modelə uyğun sorğular yaradır.

## 2. Lokal məlumatlar harada saxlanılır?

Lokal inkişaf zamanı PostgreSQL sizin öz kompüterinizdə, ayrıca bir server prosesi (Windows-da xidmət/servis) kimi işləyir və məlumatları öz disk qovluğunda (`PostgreSQL data directory`, adətən `C:\Program Files\PostgreSQL\<versiya>\data`) saxlayır. Bu, sizin `apps/api` layihə qovluğunuzdan tamamilə ayrıdır — layihə qovluğunda heç bir `.sql`/məlumat faylı olmur, yalnız **struktur** (schema) və **miqrasiya** (migration) faylları olur.

## 3. Schema, Migration, Database və Seed fərqi

Bu dörd anlayış tez-tez qarışdırılır, ona görə aydın ayıraq:

| Anlayış | Nədir? | Harada yaşayır? |
| --- | --- | --- |
| **Schema** (`schema.prisma`) | Verilənlər bazasının **istənilən** son strukturunun təsviri (cədvəllər, sahələr, əlaqələr). Kod kimi versiyalaşdırılır. | `apps/api/prisma/schema.prisma` (git-ə commit olunur) |
| **Migration** | Schema-nı bir vəziyyətdən digərinə aparan, faktiki icra olunan SQL addımlarının tarixi qeydi. Hər dəyişiklik öz qovluğunda saxlanılır. | `apps/api/prisma/migrations/` (git-ə commit olunur) |
| **Database** (verilənlər bazası) | Faktiki, canlı, işləyən PostgreSQL nüsxəsi — həqiqi sətirlər (rows) burada yaşayır. | Sizin kompüterinizdəki PostgreSQL serverinin daxilində (git-ə **heç vaxt** commit olunmur) |
| **Seed** (`prisma/seed.ts`) | Optional bootstrap user when `BOOTSTRAP_*` set and `User` empty (ADR-025). No default warehouse seed (ADR-026 superseded by ADR-029 — product quantity lives on Product). | `apps/api/prisma/seed.ts` |

Qısaca: **Schema** = "necə olmalıdır", **Migration** = "necə oraya çatdıq" tarixçəsi, **Database** = "hazırda faktiki nə var", **Seed** = "istəyə bağlı ilk istifadəçi (anbar seed yoxdur — ADR-029)".

## 4. Lokal `DATABASE_URL` necə konfiqurasiya olunur?

1. `apps/api/.env.example` faylını `apps/api/.env` adı ilə kopyalayın (bu fayl artıq `.gitignore`-dadır, heç vaxt commit olunmayacaq).
2. `.env` faylındakı `DATABASE_URL` sətrini öz lokal PostgreSQL istifadəçi adı, şifrəniz və (əgər yaratmısınızsa) `toptanflow_dev` bazasının adı ilə doldurun:

   ```
   DATABASE_URL="postgresql://toptanflow_dev:CHANGE_ME@localhost:5432/toptanflow_dev?schema=public"
   ```

   `CHANGE_ME` yerinə öz həqiqi şifrənizi yazın. Bu şifrəni heç kimlə paylaşmayın və commit etməyin.

## 5. Lokal `toptanflow_dev` istifadəçisi/bazası necə yaradılır? (əl ilə quraşdırma)

Əgər sizin kompüterinizdə artıq PostgreSQL quraşdırılıb və işə salınıbsa (adətən Windows xidməti kimi, məsələn `postgresql-x64-18`), amma `toptanflow_dev` adlı ayrıca istifadəçi/baza hələ yoxdursa, bunu **yalnız siz özünüz**, öz PostgreSQL superuser (`postgres`) şifrənizi bilərək edə bilərsiniz — heç bir agent və ya skript bu şifrəni təxmin edə bilməz və etməməlidir.

Addımlar:

1. PostgreSQL-in `bin` qovluğunu tapın (məs. `C:\Program Files\PostgreSQL\18\bin`).
2. Aşağıdakı əmri terminalda işə salın (sizdən `postgres` istifadəçisinin şifrəsini soruşacaq):

   ```
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d postgres
   ```

3. Açılan `psql` konsolunda aşağıdakı SQL əmrlərini SIRA İLƏ icra edin (öz güclü şifrənizi seçin, `CHANGE_ME` yerinə yazın):

   ```sql
   CREATE ROLE toptanflow_dev WITH LOGIN PASSWORD 'CHANGE_ME';
   CREATE DATABASE toptanflow_dev OWNER toptanflow_dev;
   ```

4. `\q` yazıb Enter basaraq `psql`-dan çıxın.
5. `apps/api/.env` faylınızdakı `DATABASE_URL`-i yuxarıdakı 4-cü bölmədəki formata uyğun, öz seçdiyiniz şifrə ilə yeniləyin.
6. Bağlantını yoxlamaq üçün:

   ```
   cd apps/api
   yarn prisma:validate
   ```

**Diqqət:** Yuxarıdakı `CREATE ROLE` / `CREATE DATABASE` əmrləri yalnız **lokal inkişaf** məqsədi üçündür və yalnız öz kompüterinizdəki PostgreSQL-ə qarşı icra olunmalıdır. Heç vaxt uzaq (remote) və ya production verilənlər bazasına qarşı icra etməyin.

## 6. Miqrasiyaları necə tətbiq etmək olar?

İlk dəfə, yaxud schema-ya yeni dəyişiklik əlavə olunduqdan sonra, aşağıdakı əmr həm yeni miqrasiya yaradır, həm də onu dərhal lokal bazanıza tətbiq edir:

```
cd apps/api
yarn prisma:migrate:dev
```

Bu əmr sizdən miqrasiya üçün qısa, təsviri bir ad istəyəcək (məs. `initial_domain_model`). Yaradılan SQL faylını tətbiq etməzdən əvvəl nəzərdən keçirməyi tövsiyə edirik — Prisma onu ekranda göstərir.

Yalnız schema faylının özünü formatlamaq/doğrulamaq/client generasiya etmək üçün (bazaya toxunmadan):

```
yarn prisma:format
yarn prisma:validate
yarn prisma:generate
```

## 7. Prisma Studio ilə məlumata baxmaq

Prisma Studio, brauzerdə açılan sadə bir cədvəl görünüşüdür — lokal bazanızdakı sətirlərə baxmaq/redaktə etmək üçün:

```
cd apps/api
yarn prisma:studio
```

## 8. Miqrasiya vəziyyətini (status) necə yoxlamaq olar?

Lokal bazanızın schema-nın son vəziyyəti ilə sinxron olub-olmadığını görmək üçün:

```
cd apps/api
yarn prisma:migrate:status
```

## 9. İnkişaf (development) və production verilənlər bazaları niyə tamamilə ayrı olmalıdır?

- Lokal `toptanflow_dev` bazası sınaq və inkişaf üçündür; onun içindəki məlumat istənilən vaxt silinə, sıfırlana bilər.
- Production baza həqiqi biznes məlumatlarını (real satışlar, real pul hərəkətləri) saxlayır — burada səhv, real maliyyə zərəri deməkdir (bax: `AGENTS.md`, "Business-first").
- Heç bir agent və ya developer production `DATABASE_URL`-inə lokal mühitdən qoşulmamalıdır. Bu tapşırıqda (database infrastructure) production bazasına HEÇ VAXT toxunulmayıb və toxunulmayacaq.
- Production miqrasiya icrası (`prisma migrate deploy`) ayrıca, sənədləşdirilmiş bir deployment prosesinin hissəsidir (aşağıya bax), sadəcə lokal əmrlərlə qarışdırılmamalıdır.

## 10. `.env` niyə heç vaxt commit olunmamalıdır?

`.env` faylı sizin **həqiqi** şifrənizi/bağlantı sətrinizi saxlayır. Əgər bu fayl git-ə commit olunsa:

- Şifrə repo tarixçəsində əbədi qalar (silsəniz belə, köhnə commit-lərdə görünə bilər).
- Başqa developerlər və ya potensial ictimai repo baxıcıları sizin verilənlər bazanıza qoşula bilər.

Ona görə `apps/api/.gitignore` faylında `.env` artıq nəzərə alınıb (ignored). Yalnız `.env.example` (real şifrəsiz, sadəcə format nümunəsi) commit olunur.

## 11. Hansı əmrlər təhlükəlidir və təsdiqsiz icra edilməməlidir?

Aşağıdakı əmrlər **məlumat itkisinə** səbəb ola bilər. Bunları heç vaxt production-a qarşı, və lokal mühitdə də düşünmədən icra etməyin:

- `prisma migrate reset` — bütün lokal bazanı sıfırlayır (bütün cədvəlləri silib yenidən yaradır).
- `prisma db push --force-reset` / məlumat itkisi xəbərdarlığı olan hər hansı `db push`.
- Əl ilə yazılmış `DROP DATABASE`, `DROP SCHEMA`, `DROP TABLE`, `TRUNCATE` kimi SQL əmrləri.
- `yarn prisma:migrate:deploy` (`prisma migrate deploy`) — bu, **yalnız deployment (CI/CD və ya production) proseslərinə aid** bir əmrdir: gözləyən miqrasiyaları sualsız/interaktivsiz tətbiq edir. Bu, adi lokal inkişaf iş axınının bir hissəsi deyil (adi halda `prisma:migrate:dev` istifadə edin); istifadəsi ayrıca, sənədləşdirilmiş bir deployment tapşırığı çərçivəsində olmalıdır.

Bu əmrlərdən hər hansını icra etməzdən əvvəl, hansı mühitə (lokal/production) qarşı işlədiyinizi mütləq iki dəfə yoxlayın.
