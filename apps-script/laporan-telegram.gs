/* ============================================================
   LAPORAN TELEGRAM · Bank Kertas 1 Perniagaan
   Hantar kiraan murid dah jawab + nama murid yang BELUM jawab
   bagi setiap kertas dalam KERTAS_LAPORAN, setiap hari 10 malam.

   PEMASANGAN (sekali sahaja):
   1. Tampal fail ini sebagai fail baharu dalam projek Apps Script.
   2. Project Settings (⚙️) → Script Properties → tambah:
        TELEGRAM_TOKEN    = token daripada @BotFather
        TELEGRAM_CHAT_ID  = chat ID cikgu (guna fungsi dapatkanChatId)
   3. Jalankan ujiLaporan   → semak mesej sampai di Telegram.
   4. Jalankan pasangJadual → laporan automatik setiap hari 10 malam.

   Token TIDAK disimpan dalam fail ini — jangan tampal token di sini.
   ============================================================ */

/* ---------- TETAPAN ---------- */

// Kosongkan jika skrip ini terikat (bound) pada Google Sheet rekod.
// Jika skrip berasingan, isi dengan ID Sheet: docs.google.com/spreadsheets/d/<ID>/edit
const SHEET_ID = "";

const ZON_MASA = "Asia/Kuala_Lumpur";
const JAM_LAPORAN = 22; // 10 malam

// Kertas yang dilaporkan. Tambah baris baharu untuk kertas lain.
// "set" boleh senaraikan beberapa nama (contoh: nama lama sebelum ditukar).
const KERTAS_LAPORAN = [
  { negeri: "Terengganu", set: ["PPC K1 2026", "PPC Percubaan SPM 2026 - Kertas 1"] }
  // { negeri: "Johor",        set: ["PPC K1 2026"] },
  // { negeri: "Kuala Lumpur", set: ["PPC K1 2026"] },
];

// Senarai nama rasmi (sama seperti dalam dashboard.html).
const SENARAI_KELAS = {
  "5 Intelek": [
    "AISYA ZULAIKHA BINTI AHMAD ZAMANI",
    "ANISHA A/P ASHOK KUMAR",
    "ARISSA QAISARA BINTI AZIZUL RAHMAN",
    "BEN NELSEA A/L NASPIJOJO",
    "FAZREENA SYAHILA BINTI JEFFRY SUHAILI",
    "GREYSON JOSEPH A/L DEVASAKAYAM",
    "HASVINDER SINGH A/L KESHMINDER SINGH",
    "INTAN SHAHIRA BINTI IRWAN",
    "JUANDA DAWINA A/P DALLAS",
    "MANISHA CARINE A/P JAYA KUMARAN",
    "MELDY STEFANIE NAIR",
    "MELLYZA A/P DIWAN",
    "MUHAMMAD AMIRUL NAHIM BIN MOHD MUSTAFA",
    "MUHAMMAD AQIL ZHARIF BIN MOHD NIZAM",
    "NUR HUMAIRA BINTI MOHD FAIZAL",
    "NUR SYASYA ADRIANA BINTI MOHD FIRDAUS",
    "NURHASHATY DAMIEA QIEFTIA BINTI NORHISSAM",
    "NURKASIH AZZAHRA BINTI MOHD FAIZ",
    "PIRITHIKA REDDY A/P SARAVANAN",
    "PRIYAA THARSHINIE A/P SEKAR",
    "RUUPIKAA A/P PATMANATHAN",
    "VISSHAAL A/L GANESAN"
  ],
  "5 Dedikasi": [
    "ALEESYA BINTI AHMAD SAUFI",
    "DELIA ELISA A/P DESALIMA RALONE",
    "ERNEEDARNIA A/P ZAINAL",
    "IRIS ALYA ADRIANA BINTI NOORUL HISHAM",
    "ISMA DAMIA BINTI ABDUL HADI",
    "MIMIE SAMILA BINTI AHMAD SUHAIMI",
    "MOHAMAD FAIZ FARHAN BIN BASHARUDIN",
    "MOHAMMAD ARIS KUZAIRIE BIN AZLEY",
    "MUHAMMAD AIZRIL DISYA BIN ABDULLAH",
    "MUHAMMAD AQIL SUFI BIN YUSHANIF",
    "MUHAMMAD AZFAR EID BIN SALEHUDDIN",
    "MUHAMMAD AZMIRUL AZIQ BIN AZIZ",
    "MUHAMMAD DANIAL NAUFAL BIN HASLIN",
    "MUHAMMAD IZZUL ILMI BIN MOHAMAD ROFEEZAL",
    "NUR AFIQAH BATRISYIA BINTI MOHD HAFEZ",
    "NUR AISYAH ATIQAH BINTI SARILIJAL",
    "NUR AQILAH BINTI LAILATUL BADRI",
    "NUR QALESYA NABILA BINTI AHMAD MAZUKI",
    "NUR ZURAIDA MYSARAH BINTI ZULKIFLI",
    "NURUL DIYANA BINTI MOHAMAD",
    "PUTERI NUR AILIS SAFINI BINTI IBRAHIM",
    "QALIESSYA A/P SYUKRI",
    "RISHITHA KAUR BHAL A/P JASPAL SINGH",
    "RIYA SHASHA BINTI SHAH HAIROL",
    "SERI ATIQAH MAISARA BINTI MOHD ARIS",
    "SITI NUR MAYA KUINTAN BINTI RAZALI",
    "VYNESH BINTI ZAIFULLAH",
    "WAN NUR AINUN INSYIRAH BINTI WAN MOHD AFFENDI"
  ]
};

/* ---------- FUNGSI UNTUK CIKGU ---------- */

/** Hantar laporan sekarang (untuk uji). */
function ujiLaporan() {
  hantarLaporan();
}

/** Pasang jadual harian 10 malam. Jalankan sekali sahaja. */
function pasangJadual() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "hantarLaporan")
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("hantarLaporan")
    .timeBased().everyDays(1).atHour(JAM_LAPORAN).nearMinute(0)
    .inTimezone(ZON_MASA)
    .create();
  Logger.log("Jadual dipasang: setiap hari sekitar " + JAM_LAPORAN + ":00 (" + ZON_MASA + ").");
}

/** Hentikan laporan automatik. */
function buangJadual() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "hantarLaporan")
    .forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log("Jadual laporan dibuang.");
}

/** Hantar sebarang mesej kepada bot dahulu, kemudian jalankan ini untuk melihat chat ID dalam Log. */
function dapatkanChatId() {
  const token = PropertiesService.getScriptProperties().getProperty("TELEGRAM_TOKEN");
  if (!token) throw new Error("Tetapkan TELEGRAM_TOKEN dalam Script Properties dahulu.");
  const res = JSON.parse(UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/getUpdates").getContentText());
  const chat = (res.result || []).map(u => (u.message || u.channel_post || {}).chat).filter(Boolean);
  if (!chat.length) { Logger.log("Tiada mesej ditemui. Hantar 'hai' kepada bot, kemudian cuba lagi."); return; }
  chat.forEach(c => Logger.log("Chat ID: " + c.id + "  (" + (c.first_name || c.title || "") + ")"));
}

/* ---------- LAPORAN ---------- */

function hantarLaporan() {
  const rekod = bacaRekod();
  const tarikh = Utilities.formatDate(new Date(), ZON_MASA, "d/M/yyyy");
  const bahagian = ["📊 Laporan Kertas 1 Perniagaan — " + tarikh];

  KERTAS_LAPORAN.forEach(k => {
    const setNorm = k.set.map(normTeks);
    const rekodKertas = rekod.filter(r =>
      normTeks(r.negeri) === normTeks(k.negeri) && setNorm.indexOf(normTeks(r.set)) !== -1);

    const baris = ["", "📝 " + k.negeri + " · " + k.set[0]];
    Object.keys(SENARAI_KELAS).forEach(kelas => {
      const rasmi = SENARAI_KELAS[kelas];
      const sudah = {};
      const tidakPadan = {};
      rekodKertas
        .filter(r => normTeks(r.kelas) === normTeks(kelas))
        .forEach(r => {
          const padan = padanNama(r.nama, rasmi);
          if (padan) sudah[padan] = true; else tidakPadan[r.nama] = true;
        });
      const belum = rasmi.filter(n => !sudah[n]);
      const bilSudah = rasmi.length - belum.length;

      baris.push("");
      baris.push("🏫 " + kelas.toUpperCase() + ": " + bilSudah + "/" + rasmi.length + " dah jawab");
      if (belum.length) {
        baris.push("❌ Belum jawab (" + belum.length + "):");
        belum.forEach((n, i) => baris.push((i + 1) + ". " + n));
      } else {
        baris.push("🎉 Semua murid sudah menjawab.");
      }
      const tp = Object.keys(tidakPadan);
      if (tp.length) baris.push("⚠️ Nama tidak padan (semak ejaan): " + tp.join(", "));
    });
    bahagian.push(baris.join("\n"));
  });

  hantarTelegram(bahagian.join("\n"));
}

function bacaRekod() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Sheet tidak ditemui. Isi SHEET_ID di bahagian TETAPAN.");
  const helaian = ss.getSheets().filter(s => s.getSheetId() === 0)[0] || ss.getSheets()[0];
  const data = helaian.getDataRange().getDisplayValues();
  if (data.length < 2) return [];

  const tajuk = data[0];
  const iNama = cariLajur(tajuk, "Nama");
  const iKelas = cariLajur(tajuk, "Kelas");
  const iNegeri = cariLajur(tajuk, "Negeri");
  const iSet = cariLajur(tajuk, "Set", "Kertas");
  if ([iNama, iKelas, iNegeri, iSet].indexOf(-1) !== -1)
    throw new Error("Lajur Nama/Kelas/Negeri/Set tidak ditemui dalam baris tajuk Sheet.");

  return data.slice(1)
    .map(r => ({ nama: String(r[iNama]).trim(), kelas: String(r[iKelas]).trim(),
                 negeri: String(r[iNegeri]).trim(), set: String(r[iSet]).trim() }))
    .filter(r => r.nama);
}

function hantarTelegram(teks) {
  const p = PropertiesService.getScriptProperties();
  const token = p.getProperty("TELEGRAM_TOKEN");
  const chatId = p.getProperty("TELEGRAM_CHAT_ID");
  if (!token || !chatId) throw new Error("Tetapkan TELEGRAM_TOKEN dan TELEGRAM_CHAT_ID dalam Script Properties.");

  // Had Telegram: 4096 aksara setiap mesej — pecahkan ikut baris jika perlu.
  const potongan = [];
  let semasa = "";
  teks.split("\n").forEach(b => {
    if ((semasa + "\n" + b).length > 3900) { potongan.push(semasa); semasa = b; }
    else semasa = semasa ? semasa + "\n" + b : b;
  });
  if (semasa) potongan.push(semasa);

  potongan.forEach(m => {
    const res = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ chat_id: chatId, text: m }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) throw new Error("Telegram menolak mesej: " + res.getContentText());
  });
}

/* ---------- Pembantu (logik sama seperti dashboard.html) ---------- */

function normTeks(s) {
  return String(s).toLowerCase().replace(/\s+/g, " ").trim();
}

function cariLajur(tajuk, ...kunci) {
  const norm = tajuk.map(t => String(t).toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const k of kunci) {
    const i = norm.indexOf(k.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (i !== -1) return i;
  }
  for (const k of kunci) {
    const kk = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    const i = norm.findIndex(t => t.indexOf(kk) !== -1);
    if (i !== -1) return i;
  }
  return -1;
}

const KATA_ABAI = ["BIN", "BINTI", "BT", "BTE", "B", "AP", "AL", "A", "L", "P", "S", "O", "D"];

function tokenNama(s) {
  return String(s).toUpperCase().replace(/\b(A\/P|A\/L|S\/O|D\/O)\b/g, " ")
    .replace(/[^A-Z ]/g, " ").split(/\s+/).filter(t => t && KATA_ABAI.indexOf(t) === -1);
}

/** Padankan nama yang ditaip murid dengan nama rasmi (tahan huruf besar/kecil, BIN/BINTI, nama separuh). */
function padanNama(namaTaip, rasmi) {
  const t = tokenNama(namaTaip);
  if (!t.length) return null;
  const sama = n => tokenNama(n).join(" ") === t.join(" ");
  const calon = rasmi.filter(n => {
    const r = tokenNama(n);
    return sama(n) || t.every(x => r.indexOf(x) !== -1);
  });
  if (calon.length === 1) return calon[0];
  return calon.filter(sama)[0] || null;
}
