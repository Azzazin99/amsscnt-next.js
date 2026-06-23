# Deploy on-prem — P999

คู่มือติดตั้งและ cutover ระบบ **Next.js + PostgreSQL** บนเซิร์ฟเวอร์ภายใน **สพป.ชัยนาท**  
อ้างอิง [`context.html`](../context.html#s7) §7 และ [`../amsscnt-go/docs/deploy-onprem.md`](../../amsscnt-go/docs/deploy-onprem.md) (โครง backup/Nginx — ปรับเป็น Next.js)

**เป้าหมาย:** โดเมน `https://amsscnt.com` เดิม — cutover แบบ **big bang** สลับ Nginx ครั้งเดียว ปิด PHP  
**Rollback:** แผน **C** — snapshot ก่อน cutover + PHP/MySQL standby 1–2 สัปดาห์ + สลับ Nginx กลับได้ภายในนาที

---

## สรุปสถาปัตยกรรม

| ชั้น | Production (`amsscnt.com`) | UAT / Staging |
|------|---------------------------|---------------|
| เครื่อง | **เครื่อง PHP เดิม** — ติดตั้ง Next.js + PostgreSQL บน server ที่รัน amsscnt.com วันนี้ | **Server แยก** ในเครือข่ายเขต (คนละเครื่องกับ production PHP) |
| OS | Linux Ubuntu 22.04+ | เหมือน production |
| Runtime | Node.js 20 LTS + PM2 | เหมือน production |
| Database | PostgreSQL 16 (local) | PostgreSQL 16 + dump ชัยนาทจริง |
| Web | Nginx → `localhost:3000` | Nginx หรือ IP ภายใน (ไม่ใช่ amsscnt.com จน cutover) |
| ไฟล์ PDF | `/var/amsscnt/storage` | เหมือน production path |
| Build | `pnpm build` → `pm2 start` — **ไม่ deploy บน Vercel** | เหมือน production |

---

## ความต้องการก่อนเริ่ม

- Ubuntu 22.04+ พร้อมสิทธิ์ `sudo`
- Node.js 20 LTS, pnpm, PM2 (`npm i -g pm2`)
- PostgreSQL 16
- Nginx
- Git + SSH ไป repo `amsscnt-next.js`
- ช่วง cutover: หยุดงานสารบรรณชั่วคราว (แนะนำนอกเวลาราชการ)
- ทีม IT เขต: สำรอง MySQL + PDF + config Nginx **ก่อน** cutover ทุกครั้ง

---

## 1. Staging UAT

### 1.1 เตรียมเครื่อง staging

```bash
# ตัวอย่าง path มาตรฐาน
sudo mkdir -p /var/amsscnt/{app,storage,backup}
sudo chown -R $USER:www-data /var/amsscnt
```

1. Clone repo ไป `/var/amsscnt/app`
2. ติดตั้ง PostgreSQL 16 — สร้าง role/database `amsscnt`
3. ตั้ง `.env` (ดู [ตัวแปรสภาพแวดล้อม](#ตัวแปรสภาพแวดล้อม-production--staging))
4. รัน migration + import ข้อมูลชัยนาท (§2) + migrate PDF (§3)
5. `pnpm build && pm2 start` (ดู §6)
6. เปิด URL ภายในเขต (เช่น `https://staging.amsscnt.local` หรือ IP) — **ไม่ชี้ amsscnt.com**

### 1.2 Checklist UAT (sign-off ก่อน production)

ทดสอบบน **staging ด้วย dump ชัยนาทจริง** + PDF ครบ — ไม่ใช้ demo สงขลา 2

#### ข้อมูลและระบบพื้นฐาน

- [ ] Login บุคลากรเขต + โรงเรียน (username/password, เลขบัตรครั้งแรน, multi-school)
- [ ] ชื่อหน่วยงานแสดงเป็น สพป.ชัยนาท
- [ ] รายการโรงเรียน / กลุ่ม / กลุ่มงาน ตรง production
- [ ] สิทธิ์โมดูล (p1/p2/p3) และ module admin ตรง production
- [ ] รหัสผ่าน legacy (MD5) import แล้ว — ผู้ใช้ reset เป็น bcrypt ได้

#### โมดูล — ทดสอบทีละ slug

ใช้ [`TESTING-MODULES.md`](./TESTING-MODULES.md) เทียบ [amsscnt.com](https://amsscnt.com)  
บันทึกบั๊กด้วยเทมเพลตในไฟล์นั้น — sign-off ด้วย `{slug} โอเค`

| ลำดับ | Slug | สถานะเป้าหมายก่อน go-live |
|------|------|---------------------------|
| 1 | `platform` | done |
| 2 | `bookregister` | done |
| 3 | `book` | done (v1 — Phase 2 ดู [`BOOK-PHASE2.md`](./BOOK-PHASE2.md)) |
| 4 | `person` | done |
| 5 | `leave` | done |
| 6 | `permission` | done |
| 7 | `car` | done |
| 8 | `mail` | done |
| 9 | `meeting` | done |
| 10 | `affair` | done |
| 11 | `cabinet` | done |
| 12 | `news` | done |
| 13 | `achievement` | done |
| 14 | `student_main` | done |
| 15 | `spacial_student` | done |
| 16 | `plan` | done |
| 17 | `budget` | done (MVP subset) |

#### PDF และไฟล์แนบ

- [ ] ทะเบียนรับ/ส่ง/คำสั่ง/เกียรติบัตร — เปิดดาวน์โหลดได้ (ชื่อไฟล์ใน DB = ชื่อบนดิสก์)
- [ ] รับส่งหนังสือ (`book`) — แนบ/ดาวน์โหลดได้
- [ ] ไม่มีไฟล์ 404 จาก sampling สุ่มอย่างน้อย 20 รายการต่อชนิด

#### Responsive + theme

- [ ] ทดสอบ viewport ~375px / ~768px / ~1280px บนโมดูลหลัก
- [ ] โหมดสี ราชการ + มืด ใช้ได้

#### สำรองและกู้คืน (dry-run บน staging)

- [ ] `pg_dump` + restore ทดสอบบนเครื่องอื่น
- [ ] rsync `/var/amsscnt/storage` กู้คืนได้
- [ ] ทีม IT ทำ rollback Nginx จำลอง (§8) สำเร็จภายใน 5 นาที

**เกณฑ์ผ่าน UAT:** ครบ 18 โมดูล + checklist ด้านบน + ผู้ใช้งานเขต sign-off เป็นลายลักษณ์อักษร (หรือ `{slug} โอเค` ครบทุก slug ในแชทโปรเจกต์)

---

## 2. MySQL → PostgreSQL (ชัยนาทจริง)

Production วันนี้: **MySQL** schema `smart_area` / DB `amsscntc_cnt`  
ระบบใหม่: **PostgreSQL 16** + Drizzle schema normalize + `scripts/import-smart-area.ts`

### 2.1 Export จาก production PHP

บนเครื่อง production (หรือ replica อ่านอย่างเดียว):

```bash
# ตัวอย่าง — ปรับ user/host ตามจริง
mysqldump -u <user> -p \
  --single-transaction --routines --triggers \
  --default-character-set=utf8mb4 \
  amsscntc_cnt > /backup/chainat-$(date +%F).sql
```

ส่งไฟล์ไป staging **อย่างปลอดภัย** (scp ภายในเขต / USB ที่เข้ารหัส)

### 2.2 แปลง MySQL dump → PostgreSQL

กลยุทธ์ lock: **Hybrid** ([`context.html`](../context.html#s5) §5)

1. แปลง syntax MySQL → PostgreSQL (เลือกอย่างใดอย่างหนึ่ง):
   - **pgloader** (แนะนำสำหรับ UAT ครั้งแรก)
   - หรือ `scripts/mysql-to-postgres.ts` (เมื่อ implement แล้ว)
2. โหลดเข้า PostgreSQL เป็น legacy tables:

```bash
cd /var/amsscnt/app
export LEGACY_DUMP_PATH=/backup/chainat-YYYY-MM-DD.pg.sql   # หลังแปลงแล้ว
pnpm db:load-legacy
```

`db:load-legacy` รัน `scripts/load-legacy-dump.sh` — ทำความสะอาด zero date / escape artifacts แล้ว `psql`

### 2.3 Transform → schema ใหม่

```bash
pnpm db:migrate                                    # Drizzle schema เปล่า
pnpm db:import-smart-area -- --scope=full        # core + bookregister + mail + book
# หรือระหว่างพัฒนา: --scope=core,bookregister
# ทด inbox สงขลา dev: --scope=full --legacy-master (เปิดอัตโนมัติเมื่อมี mail/book ใน scope)
```

- ครั้งแรก: โหลด legacy ทั้งไฟล์ → transform ตาม scope
- ครั้งถัดไป (re-import): ใช้ `--skip-legacy-load` ถ้า legacy tables ยังอยู่
- **`--legacy-master`** หรือ `AMSS_IMPORT_LEGACY_MASTER=1`: ใช้ `system_school` / `person_*` / `system_user` จาก dump แทน Excel ชัยนาท (จำเป็นสำหรับทดรายการ mail/book เก่าบน local)
- หลัง import mail/book: `pnpm storage:copy-samples` (copy PDF จาก `modules/book/upload_files`, `modules/mail/upload_files`)

### 2.4 Sync ข้อมูลเขต (ถ้าจำเป็น)

```bash
pnpm db:sync-schools-chainat
pnpm db:sync-school-groups-chainat
pnpm db:sync-workgroups-chainat
pnpm db:sync-personnel-chainat
```

### 2.5 ตรวจสอบหลัง import

```bash
# จำนวนแถวตัวอย่าง
psql -U amsscnt -d amsscnt -c "SELECT COUNT(*) FROM users;"
psql -U amsscnt -d amsscnt -c "SELECT COUNT(*) FROM register_receives;"
psql -U amsscnt -d amsscnt -c "SELECT COUNT(*) FROM book_documents;"
psql -U amsscnt -d amsscnt -c "SELECT COUNT(*) FROM mail_documents;"
psql -U amsscnt -d amsscnt -c "SELECT COUNT(*) FROM mail_recipients;"
```

- เทียบจำนวนแถวหลักกับ MySQL production
- ทดสอบ login ผู้ใช้จริง 2–3 บัญชี (รวมโรงเรียน)
- ตรวจ `file_name` ใน DB ว่ามีไฟล์คู่บนดิสก์ (§3)

---

## 3. Migrate ไฟล์ PDF / แนบ

Production path: **`/var/amsscnt/storage`** (`STORAGE_PATH` ใน `.env`)

### 3.1 แผนที่โฟลเดอร์ (legacy PHP → ระบบใหม่)

| ชนิด | โฟลเดอร์ PHP (`Amssplus`) | ระบบใหม่ |
|------|---------------------------|----------|
| ทะเบียนรับ | `modules/bookregister/upload_files1/` | `storage/bookregister/receive/` |
| ทะเบียนส่ง | `modules/bookregister/upload_files2/` | `storage/bookregister/send/` |
| ทะเบียนคำสั่ง | `modules/bookregister/upload_files3/` | `storage/bookregister/command/` |
| ทะเบียนเกียรติบัตร | `modules/bookregister/upload_files4/` | `storage/bookregister/certificate/` |
| รับส่งหนังสือ | `modules/book/upload_files/` (หรือ path เดียวกันใน Amssplus) | `storage/book/` |

ชื่อไฟล์ใน DB ต้องตรงกับชื่อบนดิสก์ — ดู [`context.html`](../context.html#s4) §4

### 3.2 rsync จาก production

```bash
STORAGE=/var/amsscnt/storage
LEGACY=/var/www/Amssplus/modules   # ปรับ path PHP จริง

sudo mkdir -p "$STORAGE"/{bookregister/{receive,send,command,certificate},book}

# ทะเบียน
rsync -av --progress "$LEGACY/bookregister/upload_files1/" "$STORAGE/bookregister/receive/"
rsync -av --progress "$LEGACY/bookregister/upload_files2/" "$STORAGE/bookregister/send/"
rsync -av --progress "$LEGACY/bookregister/upload_files3/" "$STORAGE/bookregister/command/"
rsync -av --progress "$LEGACY/bookregister/upload_files4/" "$STORAGE/bookregister/certificate/"

# รับส่งหนังสือ (ตรวจ path บน server จริงก่อน)
rsync -av --progress "$LEGACY/book/upload_files/" "$STORAGE/book/"

sudo chown -R www-data:www-data "$STORAGE"
sudo chmod -R ug+rwX "$STORAGE"
```

**Dev เท่านั้น:** `pnpm storage:copy-samples` — copy ตัวอย่างจาก `../Amssplus` local (ไม่ใช้ใน go-live)

### 3.3 ตรวจสอบความครบ

```bash
# ตัวอย่าง: นับไฟล์ที่ DB อ้างอิงแต่ไม่มีบนดิสก์ (รันบน app server)
psql -U amsscnt -d amsscnt -t -c \
  "SELECT file_name FROM register_receive_files LIMIT 5;" | while read f; do
  test -f "$STORAGE/bookregister/receive/$f" || echo "MISSING receive: $f"
done
```

แก้ไขก่อน cutover — ไฟล์หาย = ผู้ใช้เปิดแนบไม่ได้

---

## 4. ติดตั้งแอป production

```bash
cd /var/amsscnt/app
git pull origin main          # หรือ tag release ที่ UAT ผ่านแล้ว
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate               # ถ้ามี migration ใหม่ตั้งแต่ UAT
```

### ตัวแปรสภาพแวดล้อม (production / staging)

สร้าง `/var/amsscnt/app/.env`:

```env
NODE_ENV=production

DATABASE_URL=postgresql://amsscnt:<password>@127.0.0.1:5432/amsscnt

STORAGE_PATH=/var/amsscnt/storage

AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://amsscnt.com          # staging: URL ภายในเขต

AMSS_OFFICE_CODE=1701
AMSS_DISTRICT_NAME=สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท

SESSION_MAX_AGE_SECONDS=14400
SESSION_UPDATE_AGE_SECONDS=1800
```

---

## 5. Nginx

เก็บ config PHP เดิมไว้เป็น `amsscnt-php.conf.bak` ก่อน cutover (§8)

### 5.1 Next.js (production หลัง cutover)

```nginx
# /etc/nginx/sites-available/amsscnt-next.conf
upstream amsscnt_next {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name amsscnt.com www.amsscnt.com;

    ssl_certificate     /etc/ssl/amsscnt/fullchain.pem;
    ssl_certificate_key /etc/ssl/amsscnt/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 50M;   # อัปโหลด PDF

    location / {
        proxy_pass http://amsscnt_next;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name amsscnt.com www.amsscnt.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/amsscnt-next.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.2 PHP standby (rollback)

เก็บไฟล์เดิม เช่น `/etc/nginx/sites-available/amsscnt-php.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name amsscnt.com;
    root /var/www/Amssplus;    # path PHP จริง

    ssl_certificate     /etc/ssl/amsscnt/fullchain.pem;
    ssl_certificate_key /etc/ssl/amsscnt/privkey.pem;

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

สลับ symlink `sites-enabled` ระหว่าง `amsscnt-next` ↔ `amsscnt-php` เมื่อ rollback (§8)

---

## 6. PM2

สร้าง `ecosystem.config.cjs` ใน `/var/amsscnt/app`:

```javascript
module.exports = {
  apps: [
    {
      name: "amsscnt",
      cwd: "/var/amsscnt/app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "1G",
      error_file: "/var/amsscnt/logs/pm2-error.log",
      out_file: "/var/amsscnt/logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
```

```bash
sudo mkdir -p /var/amsscnt/logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # รันคำสั่งที่ PM2 พิมพ์ออกมา (systemd)
```

คำสั่งประจำวัน:

```bash
pm2 status
pm2 logs amsscnt --lines 100
pm2 restart amsscnt    # หลัง deploy ใหม่
```

---

## 7. สำรองข้อมูล (รายวัน)

อ้างอิง [`deploy-onprem.md`](../../amsscnt-go/docs/deploy-onprem.md) — ปรับ path เป็น Next.js

### 7.1 PostgreSQL

```bash
#!/bin/bash
# /var/amsscnt/scripts/backup-db.sh
set -euo pipefail
DEST=/var/amsscnt/backup/db
mkdir -p "$DEST"
pg_dump -h 127.0.0.1 -U amsscnt -Fc amsscnt \
  > "$DEST/amsscnt-$(date +%F).dump"
# เก็บ 14 วัน
find "$DEST" -name 'amsscnt-*.dump' -mtime +14 -delete
```

```cron
0 2 * * * root /var/amsscnt/scripts/backup-db.sh >> /var/log/amsscnt-backup.log 2>&1
```

### 7.2 ไฟล์ PDF

```bash
rsync -a --delete /var/amsscnt/storage/ /var/amsscnt/backup/storage/
```

### 7.3 ทดสอบกู้คืน

อย่างน้อย **รายไตรมาส** — restore dump + storage บนเครื่องทดสอบ แล้วเปิดแอปได้

---

## 8. Snapshot และ Rollback (แผน C)

ทำ **ก่อน cutover ทุกครั้ง** — เก็บ PHP + MySQL ไว้ 1–2 สัปดาห์หลัง go-live

### 8.1 Snapshot ก่อน cutover

| รายการ | คำสั่ง / การกระทำ |
|--------|------------------|
| MySQL | `mysqldump` เต็ม (§2.1) → `/backup/pre-cutover-mysql-YYYY-MM-DD.sql` |
| PostgreSQL (ถ้ามีแล้ว) | `pg_dump -Fc` → `/backup/pre-cutover-pg-YYYY-MM-DD.dump` |
| PDF | `tar czf /backup/pre-cutover-storage-YYYY-MM-DD.tar.gz /var/www/Amssplus/modules/bookregister/upload_files* /var/www/Amssplus/modules/book/upload_files*` |
| Nginx | `cp /etc/nginx/sites-enabled/* /backup/nginx-YYYY-MM-DD/` |
| PHP tree | `tar czf /backup/amssplus-YYYY-MM-DD.tar.gz /var/www/Amssplus` (ถ้าพื้นที่พอ) |
| บันทึกเวลา | จดเวลาเริ่ม/จบ maintenance + ผู้รับผิดชอบ |

### 8.2 Rollback ภายในนาที (กลับ PHP)

เมื่อ Next.js มีปัญหาร้ายแรงหลัง cutover:

```bash
# 1. หยุด Next.js
pm2 stop amsscnt

# 2. สลับ Nginx กลับ PHP
sudo rm /etc/nginx/sites-enabled/amsscnt-next.conf
sudo ln -sf /etc/nginx/sites-available/amsscnt-php.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. ยืนยัน MySQL + PHP-FPM ยังรัน
sudo systemctl status mysql php8.3-fpm

# 4. ทดสอบ https://amsscnt.com/login
```

- **อย่าลบ** PostgreSQL หรือโฟลเดอร์ `/var/amsscnt/app` ทันที — ใช้วิเคราะห์สาเหตุ
- ข้อมูลที่บันทึกบน Next.js หลัง cutover **จะไม่** กลับเข้า MySQL อัตโนมัติ — ถ้ามีธุรกรรมหลัง cutover ต้อง reconcile manual หรือ re-cutover หลังแก้

### 8.3 Rollback ข้อมูล (ถ้าจำเป็น)

```bash
# กู้ MySQL จาก snapshot (ระวัง — ทับข้อมูลปัจจุบัน)
mysql -u root -p amsscntc_cnt < /backup/pre-cutover-mysql-YYYY-MM-DD.sql

# กู้ PDF
tar xzf /backup/pre-cutover-storage-YYYY-MM-DD.tar.gz -C /
```

---

## 9. Cutover amsscnt.com (Big bang)

**เงื่อนไข:** UAT sign-off ครบ 18 โมดูล + snapshot §8.1 เสร็จ

### 9.1 ก่อนวัน D (T-1)

- [ ] Tag release ใน git ตรงกับที่ UAT ผ่าน
- [ ] Rehearsal cutover บน staging (สลับ upstream, ทดสอบ login + ทะเบียน + PDF)
- [ ] แจ้งผู้ใช้งานเวลาหยุดระบบ
- [ ] ยืนยัน snapshot ล่าสุด < 24 ชม.

### 9.2 วัน D — ลำดับงาน

| เวลา | ขั้นตอน |
|------|---------|
| T+0 | ประกาศ maintenance — ปิดการบันทึกใหม่บน PHP (maintenance page หรือปิดเมนู) |
| T+5m | **Snapshot สุดท้าย:** MySQL dump + PDF rsync + `pg_dump` (ถ้ามี PG แล้ว) |
| T+15m | บน production server: ติดตั้ง/อัปเดต Node 20, PostgreSQL 16, clone app, `.env` |
| T+30m | Import MySQL → PG (§2) + migrate PDF ครั้งสุดท้าย (§3) |
| T+45m | `pnpm build` + `pm2 start` — smoke test ผ่าน `curl -I http://127.0.0.1:3000/login` |
| T+50m | **สลับ Nginx:** ปิด `amsscnt-php` → เปิด `amsscnt-next` (§5) |
| T+55m | ทดสอบ HTTPS: login เขต, โรงเรียน, เปิด PDF ทะเบียน, ส่งหนังสือ |
| T+60m | ปิด PHP-FPM (optional — เก็บ standby): `sudo systemctl stop php8.3-fpm` |
| T+90m | ประกาศเปิดระบบ — เฝ้าระวัง error log `pm2 logs` + Nginx |

### 9.3 หลัง cutover (สัปดาห์ที่ 1–2)

- เฝ้า `pm2`, disk, PostgreSQL connections
- เก็บ MySQL + PHP tree + Nginx PHP config — **อย่าลบก่อน 2 สัปดาห์**
- รวบรวมบั๊กจากผู้ใช้ — hotfix ผ่าน `git pull && pnpm build && pm2 restart`
- เมื่อมั่นใจ: ปิด MySQL service (หรือเก็บ read-only archive)

### 9.4 เกณฑ์ความสำเร็จ P999

- [ ] `https://amsscnt.com` ชี้ Next.js
- [ ] ข้อมูลชัยนาท + PDF ครบ
- [ ] Backup cron ทำงาน
- [ ] Rollback drill ผ่าน (อย่างน้อยบน staging)
- [ ] Runbook นี้อยู่ใน `docs/DEPLOY-ONPREM.md` และทีม IT อ่านแล้ว

---

## อ้างอิง

- [`context.html`](../context.html#s7) §7 Deploy, §8 ความเสี่ยง, §12 การตัดสินใจ lock
- [`TESTING-MODULES.md`](./TESTING-MODULES.md) — UAT ทีละโมดูล
- [`../amsscnt-go/docs/deploy-onprem.md`](../../amsscnt-go/docs/deploy-onprem.md) — แนว backup/Nginx (Laravel)
- Scripts: `scripts/load-legacy-dump.sh`, `scripts/import-smart-area.ts`, `scripts/copy-sample-pdfs.ts`
