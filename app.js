const cfg = window.SITE_CONFIG;
// UAT-SPECIFIC: this deploys as a GitHub Pages project site under
// /QuranAnyWhere/ (talibahmad1793.github.io/QuranAnyWhere/), not at a
// domain root like the live site. Every root-absolute reference (routing,
// data fetches, manifests, static assets) is prefixed with this so paths
// resolve correctly under the subfolder. If this ever moves to its own
// custom domain/root, set this back to "" (see the live site's app.js).
const BASE_PATH = "/QuranAnyWhere";
const SITE_ORIGIN = "https://talibahmad1793.github.io";

// Updates the document title, meta description, canonical URL, and OG tags
// for the current route. Now that routing uses real paths (via the History
// API + the 404.html redirect trick) instead of "#/..." hash fragments,
// every route is a genuine, independently-crawlable URL, so canonical/og:url
// correctly point at wherever the visitor actually is.
function setMeta({ title, description, full }) {
  const fullTitle = full || (title ? `${title} | ${cfg.siteTitle}` : cfg.siteTitle);
  document.title = fullTitle;

  const descTag = document.querySelector('meta[name="description"]');
  if (descTag && description) descTag.setAttribute("content", description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", fullTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && description) ogDesc.setAttribute("content", description);

  const canonicalUrl = `${SITE_ORIGIN}${window.location.pathname}`;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", canonicalUrl);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);
}


// Data files (Quran text, hadith, duas, search indexes) are already part of
// this deployed site, so we fetch them same-origin instead of round-tripping
// to raw.githubusercontent.com - much faster and avoids an extra DNS/TLS hop.
// IMPORTANT: this must be root-relative ("/"), not a bare "." (relative to
// current path) - now that routing uses real paths like /hadith/bukhari
// instead of "#/..." hashes, a relative "." would resolve against whatever
// the current URL happens to be (e.g. "/hadith/") and silently 404.
const RAW_ROOT = BASE_PATH;
const PROGRESS_PREFIX = "qaw:progress:";

// Verified, structured Quran text data (not OCR). Sourced originally from
// tanzil.net (Arabic + transliteration) and quranromanurdu.com (Urdu
// translation by Abul Ala Maududi), packaged and stored directly in this
// repo (see /quran-data) - no dependency on any external repo or API.
const QURAN_DATA_PATH = "quran-data";
const QURAN_TEXT_BOOK_SLUG = "quran-roman-urdu-hindi";
const DUAS_JSON_PATH = "duas/duas.json";

// Verified hadith data (Arabic + English), packaged and stored directly in
// this repo (see /hadith-data) - no external dependency. Numbering matches
// sunnah.com: each hadith's overall number is its standard citation (e.g.
// "Sahih al-Bukhari 1"), and reference.book/reference.hadith give the
// traditional in-book chapter and position sunnah.com also shows.
const HADITH_DATA_PATH = "hadith-data";
const HADITH_ABOUT_PATH = "hadith-data/about";
const HADITH_BOOKS = [
  {
    slug: "bukhari",
    name: "Sahih al-Bukhari",
    arabic: "صحيح البخاري",
    group: "major",
    count: 7278,
    status: "ready",
    shortDesc:
      "Sahih al-Bukhari is a collection of hadith compiled by Imam Muhammad al-Bukhari (d. 256 AH/870 CE) (rahimahullah). His collection is recognized by the overwhelming majority of the Muslim world to be the most authentic collection of reports of the Sunnah of the Prophet Muhammad (\uFDFA). It contains over 7500 hadith (with repetitions) in 97 books. The translation provided here is by Dr. M. Muhsin Khan.",
  },
  {
    slug: "muslim",
    name: "Sahih Muslim",
    arabic: "صحيح مسلم",
    group: "major",
    count: 7461,
    status: "ready",
    shortDesc:
      "Sahih Muslim is a collection of hadith compiled by Imam Muslim ibn al-Hajjaj al-Naysaburi (rahimahullah). His collection is considered one of the most authentic collections of the Sunnah of the Prophet Muhammad (\uFDFA), and together with Sahih al-Bukhari forms the \u2018Sahihain\u2019 (the Two Sahihs). It contains roughly 7,500 hadith (with repetitions) in 57 books. The translation provided here is by Abdul Hamid Siddiqui.",
  },
  {
    slug: "abudawud",
    name: "Sunan Abi Dawud",
    arabic: "سنن أبي داود",
    group: "major",
    count: 5274,
    status: "ready",
    shortDesc:
      "Sunan Abi Dawud is a collection of hadith compiled by Imam Abu Dawud Sulaiman ibn al-Ash\u2019ath as-Sijistani (rahimahullah). It is one of the six canonical hadith collections (Kutub as-Sittah) and contains 5,274 hadith in 43 books.",
    extraLinks: [
      {
        aboutSlug: "abudawud-letter",
        label: "Letter from Imam Abu Dawud to the people of Makkah explaining his book, terms he uses, and his methodology.",
      },
    ],
  },
  {
    slug: "tirmidhi",
    name: "Jami' at-Tirmidhi",
    arabic: "جامع الترمذي",
    group: "major",
    count: 3998,
    status: "ready",
    shortDesc:
      "Jami' at-Tirmidhi is a collection of hadith compiled by Imam Abu 'Isa Muhammad at-Tirmidhi (rahimahullah). It is one of the six canonical collections of hadith (Kutub as-Sittah) and contains roughly 4,400 hadith (with repetitions) in 46 books.",
  },
  {
    slug: "nasai",
    name: "Sunan an-Nasa'i",
    arabic: "سنن النسائي",
    group: "major",
    count: 5683,
    status: "progress",
    shortDesc:
      "Sunan an-Nasa'i is a collection of hadith compiled by Imam Ahmad an-Nasa'i (rahimahullah). It is unanimously regarded as one of the six canonical collections of hadith (Kutub as-Sittah) and contains roughly 5,700 hadith (with repetitions) in 52 books.",
  },
  {
    slug: "ibnmajah",
    name: "Sunan Ibn Majah",
    arabic: "سنن ابن ماجه",
    group: "major",
    count: 4341,
    status: "ready",
    shortDesc:
      "Sunan Ibn Majah is a collection of hadith compiled by Imam Muhammad bin Yazid Ibn Majah al-Qazvini (rahimahullah). It is widely regarded as the sixth of the six canonical collections of hadith (Kutub as-Sittah) and contains 4,341 hadith arranged in 37 books.",
  },
  {
    slug: "malik",
    name: "Muwatta Malik",
    arabic: "موطأ مالك",
    group: "major",
    count: 1840,
    status: "ready",
    shortDesc:
      "Al-Muwatta of Imam Malik is one of the earliest and most influential collections of hadith and Islamic jurisprudence, compiled by Imam Malik ibn Anas (rahimahullah). It contains hadith, statements of the Companions, opinions of the Tabi'in, and the legal practice of the people of Madinah.",
  },
  {
    slug: "darimi",
    name: "Sunan ad-Darimi",
    arabic: "سنن الدارمي",
    group: "major",
    count: 3406,
    status: "ready",
    shortDesc:
      "Sunan ad-Darimi is a collection of hadith compiled by Imam Abu Muhammad Abd Allah ibn Abd al-Rahman ad-Darimi (rahimahullah). It contains roughly 3,400 hadith arranged across the major books of fiqh and belief.",
  },
  {
    slug: "nawawi",
    name: "40 Hadith of an-Nawawi",
    arabic: "الأربعون النووية",
    group: "forty",
  },
  {
    slug: "qudsi",
    name: "40 Hadith Qudsi",
    arabic: "الأربعون القدسية",
    group: "forty",
  },
  {
    slug: "dehlawi",
    name: "40 Hadith of Shah Waliullah Dehlawi",
    arabic: "أربعون حديثاً لشاه ولي الله الدهلوي",
    group: "forty",
  },
];
const hadithBookCache = {}; // slug -> { sections, hadithsByBook: {bookNum: [{ar,en}]} }

const SEARCH_INDEX_PATHS = {
  quran: "search-index/quran_index.json",
  hadith: "search-index/hadith_index.json",
};
let searchIndexCache = null; // { quran: [...], hadith: [...] }
const HADITH_BOOK_NAMES = Object.fromEntries(HADITH_BOOKS.map((b) => [b.slug, b.name]));

const SURAH_NAMES = [
  null, "Al-Fatihah", "Al-Baqarah", "Aal-e-Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf",
  "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl",
  "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha", "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
  "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab",
  "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shuraa",
  "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila",
  "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil",
  "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la",
  "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
  "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah", "At-Takathur",
  "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas",
];

// Per-surah metadata: Arabic name, revelation type, ayah count, and the juz
// number this surah *starts* in (computed from this project's own
// quran-data files) - used to build the Surah tab list and its links.
const SURAH_META = [
  null, // 1-indexed
  { ar: "الفاتحة", type: "Meccan", ayahs: 7, juz: 1 },
  { ar: "البقرة", type: "Medinan", ayahs: 286, juz: 1 },
  { ar: "آل عمران", type: "Medinan", ayahs: 200, juz: 3 },
  { ar: "النساء", type: "Medinan", ayahs: 176, juz: 4 },
  { ar: "المائدة", type: "Medinan", ayahs: 120, juz: 6 },
  { ar: "الأنعام", type: "Meccan", ayahs: 165, juz: 7 },
  { ar: "الأعراف", type: "Meccan", ayahs: 206, juz: 8 },
  { ar: "الأنفال", type: "Medinan", ayahs: 75, juz: 9 },
  { ar: "التوبة", type: "Medinan", ayahs: 129, juz: 10 },
  { ar: "يونس", type: "Meccan", ayahs: 109, juz: 11 },
  { ar: "هود", type: "Meccan", ayahs: 123, juz: 11 },
  { ar: "يوسف", type: "Meccan", ayahs: 111, juz: 12 },
  { ar: "الرعد", type: "Medinan", ayahs: 43, juz: 13 },
  { ar: "إبراهيم", type: "Meccan", ayahs: 52, juz: 13 },
  { ar: "الحجر", type: "Meccan", ayahs: 99, juz: 14 },
  { ar: "النحل", type: "Meccan", ayahs: 128, juz: 14 },
  { ar: "الإسراء", type: "Meccan", ayahs: 111, juz: 15 },
  { ar: "الكهف", type: "Meccan", ayahs: 110, juz: 15 },
  { ar: "مريم", type: "Meccan", ayahs: 98, juz: 16 },
  { ar: "طه", type: "Meccan", ayahs: 135, juz: 16 },
  { ar: "الأنبياء", type: "Meccan", ayahs: 112, juz: 17 },
  { ar: "الحج", type: "Medinan", ayahs: 78, juz: 17 },
  { ar: "المؤمنون", type: "Meccan", ayahs: 118, juz: 18 },
  { ar: "النور", type: "Medinan", ayahs: 64, juz: 18 },
  { ar: "الفرقان", type: "Meccan", ayahs: 77, juz: 18 },
  { ar: "الشعراء", type: "Meccan", ayahs: 227, juz: 19 },
  { ar: "النمل", type: "Meccan", ayahs: 93, juz: 19 },
  { ar: "القصص", type: "Meccan", ayahs: 88, juz: 20 },
  { ar: "العنكبوت", type: "Meccan", ayahs: 69, juz: 20 },
  { ar: "الروم", type: "Meccan", ayahs: 60, juz: 21 },
  { ar: "لقمان", type: "Meccan", ayahs: 34, juz: 21 },
  { ar: "السجدة", type: "Meccan", ayahs: 30, juz: 21 },
  { ar: "الأحزاب", type: "Medinan", ayahs: 73, juz: 21 },
  { ar: "سبأ", type: "Meccan", ayahs: 54, juz: 22 },
  { ar: "فاطر", type: "Meccan", ayahs: 45, juz: 22 },
  { ar: "يس", type: "Meccan", ayahs: 83, juz: 22 },
  { ar: "الصافات", type: "Meccan", ayahs: 182, juz: 23 },
  { ar: "ص", type: "Meccan", ayahs: 88, juz: 23 },
  { ar: "الزمر", type: "Meccan", ayahs: 75, juz: 23 },
  { ar: "غافر", type: "Meccan", ayahs: 85, juz: 24 },
  { ar: "فصلت", type: "Meccan", ayahs: 54, juz: 24 },
  { ar: "الشورى", type: "Meccan", ayahs: 53, juz: 25 },
  { ar: "الزخرف", type: "Meccan", ayahs: 89, juz: 25 },
  { ar: "الدخان", type: "Meccan", ayahs: 59, juz: 25 },
  { ar: "الجاثية", type: "Meccan", ayahs: 37, juz: 25 },
  { ar: "الأحقاف", type: "Meccan", ayahs: 35, juz: 26 },
  { ar: "محمد", type: "Medinan", ayahs: 38, juz: 26 },
  { ar: "الفتح", type: "Medinan", ayahs: 29, juz: 26 },
  { ar: "الحجرات", type: "Medinan", ayahs: 18, juz: 26 },
  { ar: "ق", type: "Meccan", ayahs: 45, juz: 26 },
  { ar: "الذاريات", type: "Meccan", ayahs: 60, juz: 26 },
  { ar: "الطور", type: "Meccan", ayahs: 49, juz: 27 },
  { ar: "النجم", type: "Meccan", ayahs: 62, juz: 27 },
  { ar: "القمر", type: "Meccan", ayahs: 55, juz: 27 },
  { ar: "الرحمن", type: "Medinan", ayahs: 78, juz: 27 },
  { ar: "الواقعة", type: "Meccan", ayahs: 96, juz: 27 },
  { ar: "الحديد", type: "Medinan", ayahs: 29, juz: 27 },
  { ar: "المجادلة", type: "Medinan", ayahs: 22, juz: 28 },
  { ar: "الحشر", type: "Medinan", ayahs: 24, juz: 28 },
  { ar: "الممتحنة", type: "Medinan", ayahs: 13, juz: 28 },
  { ar: "الصف", type: "Medinan", ayahs: 14, juz: 28 },
  { ar: "الجمعة", type: "Medinan", ayahs: 11, juz: 28 },
  { ar: "المنافقون", type: "Medinan", ayahs: 11, juz: 28 },
  { ar: "التغابن", type: "Medinan", ayahs: 18, juz: 28 },
  { ar: "الطلاق", type: "Medinan", ayahs: 12, juz: 28 },
  { ar: "التحريم", type: "Medinan", ayahs: 12, juz: 28 },
  { ar: "الملك", type: "Meccan", ayahs: 30, juz: 29 },
  { ar: "القلم", type: "Meccan", ayahs: 52, juz: 29 },
  { ar: "الحاقة", type: "Meccan", ayahs: 52, juz: 29 },
  { ar: "المعارج", type: "Meccan", ayahs: 44, juz: 29 },
  { ar: "نوح", type: "Meccan", ayahs: 28, juz: 29 },
  { ar: "الجن", type: "Meccan", ayahs: 28, juz: 29 },
  { ar: "المزمل", type: "Meccan", ayahs: 20, juz: 29 },
  { ar: "المدثر", type: "Meccan", ayahs: 56, juz: 29 },
  { ar: "القيامة", type: "Meccan", ayahs: 40, juz: 29 },
  { ar: "الإنسان", type: "Medinan", ayahs: 31, juz: 29 },
  { ar: "المرسلات", type: "Meccan", ayahs: 50, juz: 29 },
  { ar: "النبأ", type: "Meccan", ayahs: 40, juz: 30 },
  { ar: "النازعات", type: "Meccan", ayahs: 46, juz: 30 },
  { ar: "عبس", type: "Meccan", ayahs: 42, juz: 30 },
  { ar: "التكوير", type: "Meccan", ayahs: 29, juz: 30 },
  { ar: "الإنفطار", type: "Meccan", ayahs: 19, juz: 30 },
  { ar: "المطففين", type: "Meccan", ayahs: 36, juz: 30 },
  { ar: "الإنشقاق", type: "Meccan", ayahs: 25, juz: 30 },
  { ar: "البروج", type: "Meccan", ayahs: 22, juz: 30 },
  { ar: "الطارق", type: "Meccan", ayahs: 17, juz: 30 },
  { ar: "الأعلى", type: "Meccan", ayahs: 19, juz: 30 },
  { ar: "الغاشية", type: "Meccan", ayahs: 26, juz: 30 },
  { ar: "الفجر", type: "Meccan", ayahs: 30, juz: 30 },
  { ar: "البلد", type: "Meccan", ayahs: 20, juz: 30 },
  { ar: "الشمس", type: "Meccan", ayahs: 15, juz: 30 },
  { ar: "الليل", type: "Meccan", ayahs: 21, juz: 30 },
  { ar: "الضحى", type: "Meccan", ayahs: 11, juz: 30 },
  { ar: "الشرح", type: "Meccan", ayahs: 8, juz: 30 },
  { ar: "التين", type: "Meccan", ayahs: 8, juz: 30 },
  { ar: "العلق", type: "Meccan", ayahs: 19, juz: 30 },
  { ar: "القدر", type: "Meccan", ayahs: 5, juz: 30 },
  { ar: "البينة", type: "Medinan", ayahs: 8, juz: 30 },
  { ar: "الزلزلة", type: "Medinan", ayahs: 8, juz: 30 },
  { ar: "العاديات", type: "Meccan", ayahs: 11, juz: 30 },
  { ar: "القارعة", type: "Meccan", ayahs: 11, juz: 30 },
  { ar: "التكاثر", type: "Meccan", ayahs: 8, juz: 30 },
  { ar: "العصر", type: "Meccan", ayahs: 3, juz: 30 },
  { ar: "الهمزة", type: "Meccan", ayahs: 9, juz: 30 },
  { ar: "الفيل", type: "Meccan", ayahs: 5, juz: 30 },
  { ar: "قريش", type: "Meccan", ayahs: 4, juz: 30 },
  { ar: "الماعون", type: "Meccan", ayahs: 7, juz: 30 },
  { ar: "الكوثر", type: "Meccan", ayahs: 3, juz: 30 },
  { ar: "الكافرون", type: "Meccan", ayahs: 6, juz: 30 },
  { ar: "النصر", type: "Medinan", ayahs: 3, juz: 30 },
  { ar: "المسد", type: "Meccan", ayahs: 5, juz: 30 },
  { ar: "الإخلاص", type: "Meccan", ayahs: 4, juz: 30 },
  { ar: "الفلق", type: "Meccan", ayahs: 5, juz: 30 },
  { ar: "الناس", type: "Meccan", ayahs: 6, juz: 30 },
];

/* =============================================================================
   QuranAW — recitation audio. Streams from cdn.islamic.network (the CDN
   behind alquran.cloud) - free, no API key, CORS-open. Reciter: Mishary
   Rashid Alafasy (ar.alafasy), a widely-used default edition on that CDN.
   Only one clip plays at a time. Clicking the active button again pauses
   in place (resume continues from the same position, not the start).
   ========================================================================== */
const QAW_RECITER_EDITION = "ar.alafasy";
const QAW_RECITER_BITRATE = 128;
let qawAudioEl = null;
let qawAudioActiveBtn = null;
let qawAudioActiveUrl = null;

// Converts (surah, ayah) into the Quran-wide ayah number (1-6236) the CDN
// indexes by, using this project's own verified per-surah ayah counts.
function qawGlobalAyahNumber(s, a) {
  let total = a;
  for (let i = 1; i < s; i++) total += SURAH_META[i].ayahs;
  return total;
}

function qawAyahAudioUrl(s, a) {
  return `https://cdn.islamic.network/quran/audio/${QAW_RECITER_BITRATE}/${QAW_RECITER_EDITION}/${qawGlobalAyahNumber(s, a)}.mp3`;
}

function qawSurahAudioUrl(s) {
  return `https://cdn.islamic.network/quran/audio-surah/${QAW_RECITER_BITRATE}/${QAW_RECITER_EDITION}/${s}.mp3`;
}

function qawStopAudio() {
  if (qawAudioEl) {
    qawAudioEl.onended = null;
    qawAudioEl.pause();
  }
  if (qawAudioActiveBtn) {
    qawAudioActiveBtn.textContent = qawAudioActiveBtn.dataset.playLabel || "Play";
  }
  qawAudioActiveBtn = null;
  qawAudioActiveUrl = null;
}

// Plays a recitation URL through a single shared <audio> element.
// - Clicking the SAME button while that exact track is active toggles
//   pause/resume in place (position is preserved).
// - Clicking a different Play button (or a new track) stops whatever was
//   playing first and starts the new one from the beginning.
// - `onFinished`, if given, fires after the recitation ends naturally (not
//   on manual pause/stop) - used to auto-advance a playlist.
function qawPlayAudioUrl(url, btn, label, onFinished) {
  const isSameTrack = qawAudioActiveBtn === btn && qawAudioActiveUrl === url && qawAudioEl;
  if (isSameTrack) {
    if (qawAudioEl.paused) {
      qawAudioEl.play().then(() => {
        if (qawAudioActiveBtn === btn) btn.textContent = "Pause";
      }, () => {});
    } else {
      qawAudioEl.pause();
      btn.textContent = "Resume";
    }
    return;
  }

  qawStopAudio();
  if (!qawAudioEl) qawAudioEl = new Audio();
  qawAudioEl.src = url;
  qawAudioActiveUrl = url;
  btn.dataset.playLabel = label;
  qawAudioActiveBtn = btn;
  btn.textContent = "Loading\u2026";

  qawAudioEl.play().then(
    () => {
      if (qawAudioActiveBtn === btn) btn.textContent = "Pause";
    },
    () => {
      btn.textContent = "Couldn't play audio";
      if (qawAudioActiveBtn === btn) {
        qawAudioActiveBtn = null;
        qawAudioActiveUrl = null;
      }
      setTimeout(() => {
        if (btn.textContent === "Couldn't play audio") btn.textContent = label;
      }, 2000);
    }
  );

  qawAudioEl.onended = () => {
    if (qawAudioActiveBtn !== btn) return; // superseded by another track already
    btn.textContent = label;
    qawAudioActiveBtn = null;
    qawAudioActiveUrl = null;
    if (onFinished) onFinished();
  };
}


const app = document.getElementById("app");

document.title = cfg.siteTitle;
document.querySelectorAll("[data-site-title]").forEach((el) => (el.textContent = cfg.siteTitle));

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\.pdf$/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Reads a pre-generated, same-origin manifest.json instead of calling the
// live GitHub API. This is what previously hit api.github.com's 60
// requests/hour/IP unauthenticated rate limit on every homepage visit and
// every book page - a real risk once real traffic is shared behind the same
// IP (mobile carrier CGNAT, office/school/mosque WiFi, etc). Static files
// served through GitHub Pages' CDN have no such limit.
// Root manifest.json lists the top-level book folders; each book folder has
// its own manifest.json listing its PDF files. Regenerate these with
// generate-manifests.py whenever you add/remove a book or PDF file.
async function githubList(path) {
  const url = path ? `${BASE_PATH}/${path}/manifest.json` : `${BASE_PATH}/manifest.json`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error("manifest.json not found. Run generate-manifests.py after adding files.");
    throw new Error(`Manifest fetch error (${res.status})`);
  }
  return res.json();
}

function naturalSort(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function renderLoading(target) {
  target.appendChild(el("div", { class: "spinner" }));
}

// document.createElement("svg") does NOT create a real, namespaced SVG
// element - it silently produces an inert HTMLUnknownElement, so anything
// built that way (or with el("svg", ...)) never renders, even though it
// looks correct in markup. Setting innerHTML on a plain wrapper does parse
// real SVG correctly (the HTML parser switches into foreign-content/SVG
// mode when it sees a literal "<svg>" tag), so build icons that way instead.
function svgIcon(svgMarkup) {
  const wrap = document.createElement("span");
  wrap.innerHTML = svgMarkup.trim();
  return wrap.firstElementChild;
}

function renderError(target, message) {
  target.appendChild(el("p", { class: "state-msg error" }, message));
}

// --- "Report a correction" popup, used on hadith cards ---
function openReportModal(context) {
  const email = (cfg.contactEmail || "").trim();

  const messageArea = el("textarea", {
    class: "modal-textarea",
    rows: "5",
    placeholder: "Describe what looks wrong — a typo, a mistranslation, a missing word…",
  });

  const overlay = el("div", { class: "modal-overlay", role: "presentation" });

  function closeModal() {
    overlay.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
    setTimeout(() => overlay.remove(), 180);
  }
  function onKeydown(e) {
    if (e.key === "Escape") closeModal();
  }

  const closeX = el("button", { class: "modal-close", type: "button", "aria-label": "Close" }, "\u00d7");
  closeX.addEventListener("click", closeModal);

  const copyBtn = el("button", { class: "btn btn-ghost", type: "button" }, "Copy email");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(email);
      copyBtn.textContent = "Copied!";
    } catch (e) {
      copyBtn.textContent = "Couldn't copy";
    }
    setTimeout(() => (copyBtn.textContent = "Copy email"), 1600);
  });

  const sendBtn = el("button", { class: "btn btn-primary", type: "button" }, "Open in email app");
  sendBtn.addEventListener("click", () => {
    const subject = `Correction — ${context}`;
    const body = [
      `Regarding: ${context}`,
      `Page: ${window.location.href}`,
      "",
      messageArea.value.trim() || "(describe the issue here)",
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const panel = el(
    "div",
    { class: "modal-panel", role: "dialog", "aria-modal": "true", "aria-label": "Report a correction" },
    [
      el("div", { class: "modal-head" }, [el("h3", { class: "modal-title" }, "Report a correction"), closeX]),
      el("p", { class: "modal-context" }, context),
      el("label", { class: "modal-label", for: "modal-message" }, "What's wrong?"),
      messageArea,
      el("div", { class: "modal-email-row" }, [
        el("span", { class: "modal-email-label" }, "Or email us directly"),
        el("span", { class: "modal-email" }, email),
        copyBtn,
      ]),
      el("div", { class: "modal-actions" }, [sendBtn]),
    ]
  );

  overlay.appendChild(panel);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.body.appendChild(overlay);
  document.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  messageArea.focus();
}

// --- Reading progress (kept in the visitor's own browser only) ---
function getProgress(bookSlug) {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + bookSlug);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setProgress(bookSlug, file, page) {
  try {
    localStorage.setItem(PROGRESS_PREFIX + bookSlug, JSON.stringify({ file, page, updatedAt: Date.now() }));
  } catch (e) {
    // Storage may be unavailable (private browsing etc) - fine to skip.
  }
}

function partHref(bookSlug, fileName, page) {
  const base = `${BASE_PATH}/book/${encodeURIComponent(bookSlug)}/part/${encodeURIComponent(fileName)}`;
  return page && page > 1 ? `${base}/page/${page}` : base;
}

// --- Qur'an (JSON reader) reading progress - separate from the PDF-page
// progress above. Tracks the last ayah the visitor scrolled to within a
// juz, plus how far through that juz's ayah list they've reached, so the
// home "Continue reading" panel can resume at the right place.
const QURAN_PROGRESS_SLUG = "quran-text";

function getQuranProgress() {
  return getProgress(QURAN_PROGRESS_SLUG);
}

function setQuranProgress(juz, s, a, percent) {
  try {
    localStorage.setItem(
      PROGRESS_PREFIX + QURAN_PROGRESS_SLUG,
      JSON.stringify({ juz, s, a, percent, updatedAt: Date.now() })
    );
  } catch (e) {
    /* storage unavailable */
  }
}

function qawRelativeTime(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH > 1 ? "s" : ""} ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD} day${diffD > 1 ? "s" : ""} ago`;
}

// --- Favorite hadith (kept in the visitor's own browser only, like reading
// progress above). We only store the identity (which book/section/hadith),
// not the hadith text itself - the Favorites page re-loads the real hadith
// data via loadHadithBook() so it always shows current text/translations,
// and never drifts out of sync if a hadith gets corrected later.
const FAVORITES_KEY = "qaw:favorites";

function favoriteId(bookSlug, sectionNum, hadithnumber) {
  return `${bookSlug}:${sectionNum}:${hadithnumber}`;
}

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch (e) {
    // Storage may be unavailable (private browsing etc) - fine to skip.
  }
}

function isFavorited(bookSlug, sectionNum, hadithnumber) {
  const id = favoriteId(bookSlug, sectionNum, hadithnumber);
  return getFavorites().some((f) => f.id === id);
}

// Adds/removes a favorite and returns the new state (true = now favorited).
// `meta` carries just enough to render the Favorites list index quickly
// (book name, chapter name) without a full data fetch on that page.
function toggleFavorite(bookSlug, sectionNum, hadithnumber, meta) {
  const id = favoriteId(bookSlug, sectionNum, hadithnumber);
  const list = getFavorites();
  const idx = list.findIndex((f) => f.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveFavorites(list);
    updateFavoritesBadge();
    return false;
  }
  list.unshift({ id, bookSlug, sectionNum, hadithnumber, ...meta, savedAt: Date.now() });
  saveFavorites(list);
  updateFavoritesBadge();
  return true;
}

// Keeps the little count badge in the header nav in sync with storage.
function updateFavoritesBadge() {
  const badge = document.getElementById("headerFavCount");
  if (!badge) return;
  const count = getFavorites().length;
  badge.textContent = count > 0 ? String(count) : "";
  badge.style.display = count > 0 ? "" : "none";
}

// --- Favorite ayah (Qur'an verses) - shares the same FAVORITES_KEY store as
// hadith favorites above, distinguished by an "ayah:" id prefix and a
// kind:"ayah" field so renderFavorites() can render each kind correctly.
// Only the identity + which juz file it lives in is stored; the actual
// Arabic/translation text is re-fetched from quran-data at display time.
function ayahFavoriteId(s, a) {
  return `ayah:${s}:${a}`;
}

function isAyahFavorited(s, a) {
  const id = ayahFavoriteId(s, a);
  return getFavorites().some((f) => f.id === id);
}

function toggleAyahFavorite(s, a, meta) {
  const id = ayahFavoriteId(s, a);
  const list = getFavorites();
  const idx = list.findIndex((f) => f.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveFavorites(list);
    updateFavoritesBadge();
    return false;
  }
  list.unshift(Object.assign({ id, kind: "ayah", s, a, savedAt: Date.now() }, meta));
  saveFavorites(list);
  updateFavoritesBadge();
  return true;
}

// --- Favorite dua - same store, "dua:" id prefix, kind:"dua". Only the
// index + a display snapshot is kept; renderFavorites re-fetches duas.json
// for the live text where possible and falls back to the snapshot.
function duaFavoriteId(i) {
  return `dua:${i}`;
}

function isDuaFavorited(i) {
  const id = duaFavoriteId(i);
  return getFavorites().some((f) => f.id === id);
}

function toggleDuaFavorite(i, meta) {
  const id = duaFavoriteId(i);
  const list = getFavorites();
  const idx = list.findIndex((f) => f.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveFavorites(list);
    updateFavoritesBadge();
    return false;
  }
  list.unshift(Object.assign({ id, kind: "dua", i, savedAt: Date.now() }, meta));
  saveFavorites(list);
  updateFavoritesBadge();
  return true;
}

// --- Tasbeeh counters: a simple per-dua lifetime tally, kept locally. ---
const QAW_TASBEEH_KEY = "qaw:tasbeeh";

function qawGetTasbeehCounts() {
  try {
    return JSON.parse(localStorage.getItem(QAW_TASBEEH_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function qawIncrementTasbeeh(i) {
  const counts = qawGetTasbeehCounts();
  counts[i] = (counts[i] || 0) + 1;
  try {
    localStorage.setItem(QAW_TASBEEH_KEY, JSON.stringify(counts));
  } catch (e) {
    /* storage unavailable */
  }
  return counts[i];
}

// Best-effort Hinglish "when to say this" tag derived from a dua's title,
// since duas.json doesn't carry a separate timing field. Falls back to a
// generic label rather than guessing wrong.
function qawDuaTiming(title) {
  const t = title.toLowerCase();
  if (t.includes("sleep")) return "Sone se pehle";
  if (t.includes("waking") || t.includes("wake")) return "Jagne ke baad";
  if (t.includes("entering the toilet")) return "Toilet jaate waqt";
  if (t.includes("leaving the toilet")) return "Toilet se nikalte waqt";
  if (t.includes("before & after meals") || t.includes("before and after meals")) return "Khane se pehle/baad";
  if (t.includes("before eating")) return "Khane se pehle";
  if (t.includes("after eating")) return "Khane ke baad";
  if (t.includes("entering & leaving home") || t.includes("entering and leaving home")) return "Ghar aate/jaate waqt";
  if (t.includes("entering home")) return "Ghar mein aate waqt";
  if (t.includes("travel")) return "Safar ke waqt";
  if (t.includes("hearing someone sneeze")) return "Kisi ko chheenkte sunkar";
  if (t.includes("sneezer")) return "Chheenkne wale ka jawab";
  if (t.includes("sneez")) return "Chheenk aane par";
  if (t.includes("adhaan") || t.includes("azaan")) return "Azaan ke baad";
  if (t.includes("breaking fast") || t.includes("iftar")) return "Iftar ke waqt";
  return "Har waqt";
}

//replace code 
/* =============================================================================
   QuranAW — new home page  (v2 — BASE_PATH aware, fully namespaced)
   Drop-in replacement for renderHome() in app.js.
   Uses only existing helpers: el, cfg, setMeta, githubList, naturalSort,
   titleFromSlug, getProgress, partHref, startHadithTicker, renderLoading,
   renderError, PROGRESS_PREFIX, getFavorites, BASE_PATH.
   Every CSS class it emits is prefixed home- (except the existing .grid /
   .card / .state-msg library classes, reused on purpose).
   ========================================================================== */

const QAW_DAILY_VERSES = [
  { s: 2, a: 153, juz: 2, arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", hinglish: "Beshak Allah sabr karne walon ke saath hai.", ref: "Al-Baqarah 2:153" },
  { s: 65, a: 3, juz: 28, arabic: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", hinglish: "Aur use wahan se rizq deta hai jahan se woh soch bhi nahi sakta.", ref: "At-Talaq 65:3" },
  { s: 94, a: 5, juz: 30, arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", hinglish: "Beshak har mushkil ke saath aasani hai.", ref: "Ash-Sharh 94:5" },
  { s: 20, a: 114, juz: 16, arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", hinglish: "Aur kahiye: ae mere Rabb, mera ilm badha de.", ref: "Ta-Ha 20:114" },
  { s: 13, a: 28, juz: 13, arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", hinglish: "Yaad rakho — Allah ke zikr se hi dilon ko sukoon milta hai.", ref: "Ar-Ra'd 13:28" },
  { s: 62, a: 11, juz: 28, arabic: "وَاللَّهُ خَيْرُ الرَّازِقِينَ", hinglish: "Aur Allah hi sabse behtar rizq dene wala hai.", ref: "Al-Jumu'ah 62:11" },
  { s: 2, a: 201, juz: 2, arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", hinglish: "Ae hamare Rabb, humein duniya mein behtari de.", ref: "Al-Baqarah 2:201" },
];

function qawVerseOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((new Date() - start) / 86400000);
  return QAW_DAILY_VERSES[day % QAW_DAILY_VERSES.length];
}

/* --- Reading streak: local-only day log ------------------------------------ */
const QAW_DAYS_KEY = "qaw:days";

function qawTouchStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let days = JSON.parse(localStorage.getItem(QAW_DAYS_KEY) || "[]");
    if (days[days.length - 1] !== today) days.push(today);
    days = days.slice(-400);
    localStorage.setItem(QAW_DAYS_KEY, JSON.stringify(days));
    return days;
  } catch (e) {
    return [];
  }
}

function qawStreakInfo() {
  const set = new Set(qawTouchStreak());
  const iso = (d) => d.toISOString().slice(0, 10);
  let streak = 0;
  const cursor = new Date();
  while (set.has(iso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    week.push(set.has(iso(d)));
  }
  return { streak, week };
}

/* --- Most recently read book across all stored progress -------------------- */
function qawLatestProgress() {
  let best = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key.indexOf(PROGRESS_PREFIX) !== 0) continue;
      const slug = key.slice(PROGRESS_PREFIX.length);
      const p = getProgress(slug);
      if (!p || !p.file) continue;
      if (!best || (p.updatedAt || 0) > (best.updatedAt || 0)) best = Object.assign({ slug }, p);
    }
  } catch (e) {
    /* storage unavailable */
  }
  return best;
}

/* --- Home ------------------------------------------------------------------ */
async function renderHome() {
  setMeta({
    full: "QuranAnyWhere — Read the Qur'an and Hadith Online, Free",
    description:
      "Read the Qur'an juz by juz and explore Hinglish translations of Sahih al-Bukhari, Sahih Muslim & more hadith collections — free, anywhere, on any device.",
  });
  app.innerHTML = "";

  const main = el("main", { class: "container home" });
  app.appendChild(main);

  /* Row 1 — continue reading + verse of the day */
  const qProgress = getQuranProgress();
  const { streak, week } = qawStreakInfo();
  const verse = qawVerseOfTheDay();

  const resumeChildren = [
    el("span", { class: "home-kicker" }, qProgress ? "Continue reading" : "Start reading"),
    el(
      "h2",
      { class: "home-resume-title" },
      qProgress ? `${SURAH_NAMES[qProgress.s] || "Surah " + qProgress.s}, ayah ${qProgress.a}` : "The Holy Qur'an"
    ),
    el(
      "p",
      { class: "home-resume-meta" },
      qProgress
        ? `Juz ${qProgress.juz} \u00b7 ${qProgress.percent}% complete \u00b7 last read ${qawRelativeTime(qProgress.updatedAt)}`
        : "Juz by juz — Arabic, transliteration and translation."
    ),
  ];

  if (qProgress) {
    resumeChildren.push(
      el("div", { class: "home-progress-bar" }, [
        el("div", { class: "home-progress-fill", style: `width:${qProgress.percent}%` }),
      ])
    );
  }

  const playBtn = el("button", { class: "home-btn home-btn-ghost", type: "button" }, "Play recitation");
  playBtn.addEventListener("click", () => {
    const surahNum = qProgress && qProgress.s ? qProgress.s : 1;
    qawPlayAudioUrl(qawSurahAudioUrl(surahNum), playBtn, "Play recitation");
  });

  resumeChildren.push(
    el("div", { class: "home-actions" }, [
      el(
        "a",
        {
          class: "home-btn home-btn-cream",
          href: qProgress ? `${BASE_PATH}/quran-text/${qProgress.juz}/v/${qProgress.s}/${qProgress.a}` : `${BASE_PATH}/quran-text/1`,
        },
        qProgress ? `Resume Juz ${qProgress.juz}` : "Read Qur'an"
      ),
      playBtn,
    ])
  );

  if (streak > 1) {
    resumeChildren.push(
      el("div", { class: "home-streak" }, [
        el("span", { class: "home-streak-count" }, String(streak)),
        el("span", { class: "home-streak-label" }, "din lagatar · MashaAllah"),
        el(
          "div",
          { class: "home-streak-week", "aria-hidden": "true" },
          week.map((on) => el("span", { class: on ? "home-streak-dot is-on" : "home-streak-dot" }))
        ),
      ])
    );
  }

  const resume = el("section", { class: "home-panel home-panel-emerald" }, resumeChildren);

  const dailyFavSaved = isAyahFavorited(verse.s, verse.a);
  const dailyFavBtn = el(
    "button",
    { class: `btn btn-ghost home-verse-save${dailyFavSaved ? " is-active" : ""}`, type: "button" },
    dailyFavSaved ? "Saved" : "Save verse"
  );
  dailyFavBtn.addEventListener("click", () => {
    const now = toggleAyahFavorite(verse.s, verse.a, { juz: verse.juz, ar: verse.arabic, t: "", u: verse.hinglish, surahName: SURAH_NAMES[verse.s] });
    dailyFavBtn.textContent = now ? "Saved" : "Save verse";
    dailyFavBtn.classList.toggle("is-active", now);
  });

  const daily = el("section", { class: "home-panel home-panel-verse" }, [
    el("span", { class: "home-kicker home-kicker-dark" }, "Verse of the day"),
    el("p", { class: "home-verse-ar", dir: "rtl" }, verse.arabic),
    el("p", { class: "home-verse-tr" }, verse.hinglish),
    el("div", { class: "home-verse-foot" }, [
      el("span", { class: "home-verse-ref" }, verse.ref),
      dailyFavBtn,
    ]),
  ]);

  main.appendChild(el("div", { class: "home-top" }, [resume, daily]));

  /* Row 2 — quick tiles */
  const tiles = [
    { href: `${BASE_PATH}/quran-text/1`, label: "Read Qur'an", sub: "Juz by juz ya surah — apni marzi se", tint: "is-emerald" },
    { href: `${BASE_PATH}/hadith`, label: "Hadith", sub: "Bukhari, Muslim aur more", tint: "is-gold" },
    { href: `${BASE_PATH}/duas`, label: "Dua & Azkar", sub: "Roz ke duas, tasbeeh counter", tint: "is-sage" },
    { href: `${BASE_PATH}/prayer-times`, label: "Prayer times", sub: "Finding your location\u2026", tint: "is-clay", subId: "qawPrayerTileSub" },
  ];
  main.appendChild(
    el(
      "div",
      { class: "home-tiles" },
      tiles.map((t) =>
        el("a", { class: `home-tile ${t.tint}`, href: t.href }, [
          el("span", { class: "home-tile-mark", "aria-hidden": "true" }),
          el("span", { class: "home-tile-label" }, t.label),
          el("span", Object.assign({ class: "home-tile-sub" }, t.subId ? { id: t.subId } : {}), t.sub),
        ])
      )
    )
  );
  if (typeof qawApplyPrayerLabelsIfCached === "function") qawApplyPrayerLabelsIfCached();

  /* Row 3 — Hadith collections in Hinglish */
  main.appendChild(
    el("div", { class: "home-section-head" }, [
      el("h2", { class: "home-section-title" }, "Hadith collections in Hinglish"),
      el("a", { class: "home-section-link", href: `${BASE_PATH}/hadith` }, "All books"),
    ])
  );

  const hGrid = el("div", { class: "grid" });
  HADITH_BOOKS.filter((b) => b.group === "major").forEach((b) => {
    const statusLabel = b.status === "ready" ? "Hinglish ready" : b.status === "progress" ? "In progress" : "Coming soon";
    const desc = b.count ? `${b.count.toLocaleString()} hadith \u00b7 ${statusLabel}` : `Hadith \u00b7 ${statusLabel}`;
    hGrid.appendChild(
      el("a", { class: "card", href: `${BASE_PATH}/hadith/${b.slug}` }, [
        el("div", { class: "card-spine" }),
        el("div", { class: "card-body" }, [
          el("span", { class: "card-kicker home-hadith-ar", dir: "rtl" }, b.arabic),
          el("h2", { class: "card-title" }, b.name),
          el("p", { class: "card-desc" }, desc),
        ]),
      ])
    );
  });
  main.appendChild(hGrid);
}


// relace end 

async function renderBook(bookSlug) {
  setMeta({
    title: titleFromSlug(bookSlug),
    description: `Read ${titleFromSlug(bookSlug)} online, free, on any device — part of the QuranAnyWhere library.`,
  });
  app.innerHTML = "";
  const main = el("main", { class: "container" });
  app.appendChild(main);
  main.appendChild(el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), ` / ${titleFromSlug(bookSlug)}`]));
  main.appendChild(el("h1", { class: "page-title" }, titleFromSlug(bookSlug)));

  const progress = getProgress(bookSlug);
  if (progress) {
    main.appendChild(
      el("a", { class: "continue-banner", href: partHref(bookSlug, progress.file, progress.page) }, [
        el("span", {}, "\u25b6 Continue reading"),
        el("span", { class: "continue-banner-detail" }, `${titleFromSlug(progress.file)} \u2014 page ${progress.page}`),
      ])
    );
  }

  if (bookSlug === QURAN_TEXT_BOOK_SLUG) {
    main.appendChild(
      el("a", { class: "text-mode-banner", href: `${BASE_PATH}/quran-text/1` }, [
        el("span", {}, "\u0627 Read as typed text"),
        el("span", { class: "continue-banner-detail" }, "Arabic \u00b7 transliteration \u00b7 Urdu translation \u2014 no scanned pages"),
      ])
    );
  }

  const listWrap = el("div");
  main.appendChild(listWrap);
  renderLoading(listWrap);

  try {
    const items = await githubList(bookSlug);
    const files = items.filter((i) => i.type === "file" && /\.pdf$/i.test(i.name)).sort(naturalSort);
    listWrap.innerHTML = "";

    if (files.length === 0) {
      listWrap.appendChild(el("p", { class: "state-msg" }, "No PDF parts uploaded to this folder yet."));
      return;
    }

    const grid = el("div", { class: "part-grid" });
    files.forEach((file, i) => {
      const tile = el("a", { class: "tile", href: partHref(bookSlug, file.name) }, [
        el("span", { class: "tile-num" }, String(i + 1)),
        el("span", { class: "tile-label" }, titleFromSlug(file.name)),
      ]);
      grid.appendChild(tile);
    });
    listWrap.appendChild(grid);
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

// GitHub's raw file server sends PDFs as application/octet-stream with
// X-Frame-Options: deny, so they can never be shown in an <iframe> - the
// browser just downloads them. Instead we fetch the raw bytes ourselves
// (allowed - GitHub raw sends Access-Control-Allow-Origin: *) and render
// pages with PDF.js onto a canvas.
async function renderPart(bookSlug, fileName, startPage) {
  setMeta({
    title: `${titleFromSlug(fileName)} — ${titleFromSlug(bookSlug)}`,
    description: `Read ${titleFromSlug(fileName)} from ${titleFromSlug(bookSlug)}, free, on any device.`,
  });
  app.innerHTML = "";
  const rawUrl = `${RAW_ROOT}/${bookSlug}/${encodeURIComponent(fileName)}`;

  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: `${BASE_PATH}/` }, "Library"),
    " / ",
    el("a", { href: `${BASE_PATH}/book/${encodeURIComponent(bookSlug)}` }, titleFromSlug(bookSlug)),
    ` / ${titleFromSlug(fileName)}`,
  ]);

  const topBar = el("div", { class: "viewer-top" }, [
    el("a", { href: `${BASE_PATH}/book/${encodeURIComponent(bookSlug)}` }, "\u2190 Back to parts"),
    el("span", { class: "viewer-part-label" }, titleFromSlug(fileName)),
    el("span", { class: "viewer-page-counter", id: "pageCounter" }, ""),
  ]);

  const canvas = el("canvas", { class: "pdf-canvas", id: "pdfCanvas" });
  const canvasScroll = el("div", { class: "pdf-canvas-scroll", id: "canvasScroll" }, [canvas]);
  const canvasWrap = el("div", { class: "pdf-canvas-wrap" }, [
    el("button", { class: "page-nav-btn page-nav-btn--prev", id: "prevBtn", "aria-label": "Previous page" }, "\u2039"),
    canvasScroll,
    el("button", { class: "page-nav-btn page-nav-btn--next", id: "nextBtn", "aria-label": "Next page" }, "\u203a"),
  ]);
  const hint = el("p", { class: "viewer-hint" }, "Swipe to turn pages \u00b7 pinch or double-tap to zoom");

  const viewerWrap = el("div", { class: "viewer-wrap" }, [topBar, canvasWrap, hint]);
  const wrap = el("div", { class: "container" }, [crumb, viewerWrap]);
  app.appendChild(el("main", {}, wrap));

  const pageCounter = document.getElementById("pageCounter");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Figure out this file's neighbors within the book, so paging past the
  // first/last page of this PDF can hop into the previous/next part.
  let siblingFiles = [fileName];
  let fileIndex = 0;
  try {
    const items = await githubList(bookSlug);
    siblingFiles = items.filter((i) => i.type === "file" && /\.pdf$/i.test(i.name)).sort(naturalSort).map((f) => f.name);
    fileIndex = siblingFiles.indexOf(fileName);
  } catch (e) {
    // Non-fatal - we just won't be able to auto-advance between parts.
  }

  let pdfDoc = null;
  let currentPage = 1;
  let rendering = false;
  let zoomed = false;
  let zoomScale = 1; // continuous multiplier on top of fitScale; 1 = fit-width

  async function renderPage(num) {
    if (!pdfDoc || rendering) return;
    rendering = true;
    const page = await pdfDoc.getPage(num);

    // Fixed small padding only - the nav buttons intentionally float over
    // the page rather than reserving their own column, on both mobile and
    // desktop, so this doesn't need to change per device.
    const availableWidth = canvasWrap.clientWidth - 24;
    const desktopCap = 820; // comfortable single-page reading width

    const baseViewport = page.getViewport({ scale: 1 });

    // Fit to WIDTH, not height. Fitting the whole page height into the
    // screen shrinks text unnecessarily on normal (non-scanned) documents -
    // mobile readers expect to scroll down a tall page, same as any PDF or
    // e-book app, rather than have everything squeezed to fit one screen.
    const fitScale = Math.min(availableWidth, desktopCap) / baseViewport.width;
    const scale = fitScale * zoomScale;
    const viewport = page.getViewport({ scale });

    // Render at device pixel ratio so text stays crisp on phone screens.
    // The canvas's backing store (width/height attributes) is scaled by
    // dpr; its displayed CSS size (style.width/height) is not - these are
    // set as the only source of truth for display size, with no competing
    // CSS max-width/auto rules, to avoid the browser recomputing a
    // different size than we intended.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    await page.render({ canvasContext: ctx, viewport }).promise;

    currentPage = num;
    pageCounter.textContent = `Page ${num} of ${pdfDoc.numPages}`;
    setProgress(bookSlug, fileName, num);
    rendering = false;
  }

  function setZoom(nextZoomed) {
    zoomed = nextZoomed;
    zoomScale = nextZoomed ? 1.9 : 1;
    canvasScroll.classList.toggle("zoomed", zoomed);
    canvasScroll.scrollLeft = 0;
    canvasScroll.scrollTop = 0;
    renderPage(currentPage);
  }

  function goNext() {
    if (!pdfDoc) return;
    if (currentPage < pdfDoc.numPages) {
      renderPage(currentPage + 1);
    } else if (fileIndex >= 0 && fileIndex < siblingFiles.length - 1) {
      navigate(partHref(bookSlug, siblingFiles[fileIndex + 1]));
    }
  }

  function goPrev() {
    if (!pdfDoc) return;
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    } else if (fileIndex > 0) {
      navigate(partHref(bookSlug, siblingFiles[fileIndex - 1]));
    }
  }

  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  function onKey(e) {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  }
  window.addEventListener("keydown", onKey);

  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderPage(currentPage), 200);
  }
  window.addEventListener("resize", onResize);

  // Swipe to turn pages (only while not zoomed in - while zoomed, a swipe
  // pans around the enlarged page instead). Guarded against multi-touch so
  // a pinch gesture (handled separately below) never gets misread as a swipe.
  let touchStartX = 0;
  let touchStartY = 0;
  canvasScroll.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  canvasScroll.addEventListener(
    "touchend",
    (e) => {
      if (zoomed || pinchJustEnded || e.changedTouches.length !== 1 || e.touches.length !== 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    { passive: true }
  );

  // Two-finger pinch to zoom in/out, in addition to the double-tap/double-
  // click shortcut below. While pinching, we scale the canvas live with a
  // cheap CSS transform (smooth, no re-render cost); once the fingers lift,
  // we bake the final zoom level into an actual pdf.js re-render so the
  // page stays crisp rather than a blurry stretched bitmap.
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3.5;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let pinching = false;
  let pinchJustEnded = false;

  function touchDist(touches) {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  canvasScroll.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        pinching = true;
        pinchStartDist = touchDist(e.touches);
        pinchStartScale = zoomScale;
        canvas.style.transition = "none";
      }
    },
    { passive: true }
  );

  canvasScroll.addEventListener(
    "touchmove",
    (e) => {
      if (!pinching || e.touches.length !== 2) return;
      e.preventDefault();
      const ratio = touchDist(e.touches) / pinchStartDist;
      const liveScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartScale * ratio));
      canvas.style.transform = `scale(${liveScale / zoomScale})`;
    },
    { passive: false }
  );

  function endPinch(e) {
    if (!pinching) return;
    if (e.touches.length >= 2) return; // still pinching with 2+ fingers (e.g. a 3rd touch briefly registered)
    pinching = false;
    canvas.style.transition = "";
    // Read back whatever scale the live CSS transform landed on and bake it
    // into a real pdf.js render at that resolution. This must run whenever
    // the touch count drops below 2 - not only when it reaches exactly 0 -
    // since people usually lift one finger slightly before the other,
    // which would otherwise leave a stale CSS transform stuck on the
    // canvas, out of sync with the real zoomScale.
    const currentTransform = canvas.style.transform.match(/scale\(([\d.]+)\)/);
    const appliedRatio = currentTransform ? parseFloat(currentTransform[1]) : 1;
    canvas.style.transform = "";
    zoomScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomScale * appliedRatio));
    zoomed = zoomScale > 1.05;
    canvasScroll.classList.toggle("zoomed", zoomed);
    renderPage(currentPage);
    pinchJustEnded = true;
    setTimeout(() => (pinchJustEnded = false), 300);
  }
  canvasScroll.addEventListener("touchend", endPinch, { passive: true });
  canvasScroll.addEventListener("touchcancel", endPinch, { passive: true });

  // Double-tap / double-click to toggle between fit-width and a fixed
  // zoomed-in level - a quick shortcut alongside free pinch-to-zoom above.
  let lastTap = 0;
  canvasScroll.addEventListener("click", () => {
    if (pinchJustEnded) return;
    const now = Date.now();
    if (now - lastTap < 350) setZoom(!zoomed);
    lastTap = now;
  });

  pageCounter.textContent = "Loading\u2026";
  try {
    const loadingTask = pdfjsLib.getDocument(rawUrl);
    pdfDoc = await loadingTask.promise;
    const first = Math.max(1, Math.min(startPage || 1, pdfDoc.numPages));
    await renderPage(first);
  } catch (e) {
    pageCounter.textContent = "";
    canvasWrap.appendChild(el("p", { class: "state-msg error" }, `Couldn't load this PDF: ${e.message}`));
  }
}

async function fetchJuz(juzNumber) {
  const url = `${RAW_ROOT}/${QURAN_DATA_PATH}/juz-${String(juzNumber).padStart(2, "0")}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load text data (${res.status})`);
  return res.json();
}

// Gathers every ayah of a surah, fetching juz files sequentially starting
// from where the surah begins (SURAH_META[s].juz) until every ayah has
// been found - needed because a surah can span more than one juz file.
async function fetchSurahAyahs(surahNumber) {
  const meta = SURAH_META[surahNumber];
  let ayahs = [];
  let juz = meta.juz;
  while (ayahs.length < meta.ayahs && juz <= 30) {
    const data = await fetchJuz(juz);
    ayahs = ayahs.concat(data.filter((v) => v.s === surahNumber));
    juz++;
  }
  return ayahs;
}

/* --- Reading preferences: Arabic size + which lines to show, persisted --- */
const QAW_QURAN_PREFS_KEY = "qaw:quranPrefs";
const QAW_QURAN_PREFS_DEFAULT = { arabicSize: 26, translation: true, translit: true, tafsir: false };

function qawGetQuranPrefs() {
  try {
    return Object.assign({}, QAW_QURAN_PREFS_DEFAULT, JSON.parse(localStorage.getItem(QAW_QURAN_PREFS_KEY) || "{}"));
  } catch (e) {
    return Object.assign({}, QAW_QURAN_PREFS_DEFAULT);
  }
}

function qawSaveQuranPrefs(prefs) {
  try {
    localStorage.setItem(QAW_QURAN_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    /* storage unavailable */
  }
}

// Which tab (Juz/Para vs Surah) the side list shows - a page-local UI
// choice, not persisted, matching how the design behaves.
let qawQuranListTab = "juz";

function qawQuranSideList(activeJuz, activeSurah) {
  const tabs = el("div", { class: "qr-tabs" }, [
    el(
      "button",
      { class: `qr-tab${qawQuranListTab === "juz" ? " is-active" : ""}`, type: "button" },
      "Juz / Para"
    ),
    el(
      "button",
      { class: `qr-tab${qawQuranListTab === "surah" ? " is-active" : ""}`, type: "button" },
      "Surah"
    ),
  ]);

  const list = el("div", { class: "qr-list" });

  function fillList() {
    list.innerHTML = "";
    if (qawQuranListTab === "juz") {
      for (let j = 1; j <= 30; j++) {
        list.appendChild(
          el(
            "a",
            { class: `qr-list-item${j === activeJuz ? " is-active" : ""}`, href: `${BASE_PATH}/quran-text/${j}` },
            [el("span", { class: "qr-list-num" }, String(j)), el("span", { class: "qr-list-label" }, `Juz ${j}`)]
          )
        );
      }
    } else {
      for (let s = 1; s <= 114; s++) {
        const meta = SURAH_META[s];
        list.appendChild(
          el(
            "a",
            {
              class: `qr-list-item${s === activeSurah ? " is-active" : ""}`,
              href: `${BASE_PATH}/quran-text/${meta.juz}/v/${s}/1`,
            },
            [
              el("span", { class: "qr-list-num" }, String(s)),
              el("span", { class: "qr-list-label" }, SURAH_NAMES[s] || `Surah ${s}`),
              el("span", { class: "qr-list-ar", dir: "rtl" }, meta.ar),
            ]
          )
        );
      }
    }
  }
  fillList();

  tabs.querySelectorAll(".qr-tab").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      qawQuranListTab = i === 0 ? "juz" : "surah";
      tabs.querySelectorAll(".qr-tab").forEach((b, j) => b.classList.toggle("is-active", j === i));
      fillList();
    });
  });

  return { tabs, list };
}

function qawQuranSettingsPanel(prefs, onChange) {
  const sizeVal = el("span", { class: "qr-size-val" }, String(prefs.arabicSize));
  const minus = el("button", { class: "qr-size-btn", type: "button", "aria-label": "Decrease Arabic text size" }, "\u2212");
  const plus = el("button", { class: "qr-size-btn", type: "button", "aria-label": "Increase Arabic text size" }, "+");
  minus.addEventListener("click", () => {
    prefs.arabicSize = Math.max(20, prefs.arabicSize - 3);
    sizeVal.textContent = String(prefs.arabicSize);
    qawSaveQuranPrefs(prefs);
    onChange(prefs);
  });
  plus.addEventListener("click", () => {
    prefs.arabicSize = Math.min(48, prefs.arabicSize + 3);
    sizeVal.textContent = String(prefs.arabicSize);
    qawSaveQuranPrefs(prefs);
    onChange(prefs);
  });

  const toggleRow = (label, key) => {
    const track = el("span", { class: `qr-switch-track${prefs[key] ? " is-on" : ""}` }, [
      el("span", { class: "qr-switch-thumb" }),
    ]);
    const row = el(
      "button",
      { class: "qr-toggle-row", type: "button", role: "switch", "aria-checked": String(!!prefs[key]) },
      [el("span", { class: "qr-toggle-label" }, label), track]
    );
    row.addEventListener("click", () => {
      prefs[key] = !prefs[key];
      track.classList.toggle("is-on", prefs[key]);
      row.setAttribute("aria-checked", String(!!prefs[key]));
      qawSaveQuranPrefs(prefs);
      onChange(prefs);
    });
    return row;
  };

  return el("div", { class: "qr-settings" }, [
    el("span", { class: "qr-settings-kicker" }, "Reading"),
    el("div", { class: "qr-size-row" }, [el("span", { class: "qr-toggle-label" }, "Arabic size"), minus, sizeVal, plus]),
    toggleRow("Hinglish translation", "translation"),
    toggleRow("Transliteration", "translit"),
    toggleRow("Tafsir notes", "tafsir"),
  ]);
}

let qawQuranProgressTimer = null;

async function renderQuranText(juzNumber, scrollTarget) {
  juzNumber = Math.max(1, Math.min(juzNumber, 30));
  setMeta({
    title: `Quran Juz ${juzNumber} — Read Online`,
    description: `Read Juz ${juzNumber} of the Holy Quran online with translation, free, on any device.`,
  });
  app.innerHTML = "";

  const prefs = qawGetQuranPrefs();
  const activeSurah = scrollTarget ? scrollTarget.s : null;

  const { tabs, list } = qawQuranSideList(juzNumber, activeSurah);
  const settings = qawQuranSettingsPanel(prefs, applyPrefsToDom);
  const side = el("aside", { class: "qr-side" }, [tabs, list, settings]);

  const header = el("div", { class: "qr-header" });
  const versesWrap = el("div", { class: "qr-verses" });
  renderLoading(versesWrap);
  const reader = el("div", { class: "qr-reader" }, [header, versesWrap]);

  const shell = el("div", { class: "qr-shell" }, [side, reader]);
  app.appendChild(el("main", { class: "container qr-container" }, [shell]));

  function applyPrefsToDom(p) {
    versesWrap.style.setProperty("--qr-arabic-size", `${p.arabicSize}px`);
    versesWrap.querySelectorAll(".verse-translit").forEach((elx) => (elx.style.display = p.translit ? "" : "none"));
    versesWrap.querySelectorAll(".verse-urdu").forEach((elx) => (elx.style.display = p.translation ? "" : "none"));
  }

  function verseShareText(v, surahName) {
    return [v.ar, "", v.t, "", v.u, "", `${surahName} ${v.s}:${v.a} \u00b7 QuranAnyWhere`, `${window.location.origin}${BASE_PATH}/quran-text/${juzNumber}/v/${v.s}/${v.a}`].join(
      "\n"
    );
  }

  function buildVerseActions(v, surahName) {
    const saved = isAyahFavorited(v.s, v.a);
    const saveBtn = el(
      "button",
      { class: `btn btn-ghost qr-action${saved ? " is-active" : ""}`, type: "button" },
      saved ? "Saved" : "Save"
    );
    saveBtn.addEventListener("click", () => {
      const now = toggleAyahFavorite(v.s, v.a, { juz: juzNumber, ar: v.ar, t: v.t, u: v.u, surahName });
      saveBtn.textContent = now ? "Saved" : "Save";
      saveBtn.classList.toggle("is-active", now);
    });

    const shareBtn = el("button", { class: "btn btn-ghost qr-action", type: "button" }, "Share verse");
    shareBtn.addEventListener("click", async () => {
      const text = verseShareText(v, surahName);
      if (navigator.share) {
        try {
          await navigator.share({ title: `${surahName} ${v.s}:${v.a}`, text });
        } catch (e) {
          /* user cancelled the native share sheet - no action needed */
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          shareBtn.textContent = "Copied!";
        } catch (e) {
          shareBtn.textContent = "Couldn't copy";
        }
        setTimeout(() => (shareBtn.textContent = "Share verse"), 1800);
      }
    });

    const playBtn = el("button", { class: "btn btn-ghost qr-action", type: "button" }, "Play");
    playBtn.addEventListener("click", () => {
      qawPlayAudioUrl(qawAyahAudioUrl(v.s, v.a), playBtn, "Play");
    });

    return el("div", { class: "qr-verse-actions" }, [saveBtn, shareBtn, playBtn]);
  }

  try {
    const verses = await fetchJuz(juzNumber);
    const firstSurah = verses.length ? verses[0].s : null;
    const meta = firstSurah ? SURAH_META[firstSurah] : null;

    header.innerHTML = "";
    header.appendChild(
      el("div", {}, [
        el("span", { class: "qr-header-kicker" }, `JUZ ${juzNumber} \u00b7 SURAH ${firstSurah || "\u2014"}`),
        el("h1", { class: "qr-header-title" }, (firstSurah && SURAH_NAMES[firstSurah]) || `Juz ${juzNumber}`),
        el(
          "p",
          { class: "qr-header-sub" },
          meta ? `${meta.ayahs} ayat \u00b7 ${meta.type === "Meccan" ? "Makki" : "Madani"}` : ""
        ),
        firstSurah
          ? el("a", { class: "qr-header-listen", href: `${BASE_PATH}/quran-play/${firstSurah}` }, "\u25b6 Listen to full surah")
          : null,
      ].filter(Boolean))
    );
    if (meta) header.appendChild(el("span", { class: "qr-header-ar", dir: "rtl" }, meta.ar));

    versesWrap.innerHTML = "";
    let currentChapter = null;

    verses.forEach((v) => {
      if (v.s !== currentChapter) {
        currentChapter = v.s;
        versesWrap.appendChild(
          el("div", { class: "surah-header" }, [
            el("span", { class: "surah-header-num" }, String(currentChapter)),
            el("span", { class: "surah-header-name" }, SURAH_NAMES[currentChapter] || `Surah ${currentChapter}`),
          ])
        );
      }
      const surahName = SURAH_NAMES[v.s] || `Surah ${v.s}`;
      const card = el("div", { class: "verse-card", id: `v-${v.s}-${v.a}` }, [
        el("div", { class: "verse-arabic" }, [
          el("span", {}, v.ar),
          el("span", { class: "verse-num-badge" }, String(v.a)),
        ]),
        el("p", { class: "verse-translit" }, v.t),
        el("p", { class: "verse-urdu" }, v.u),
        buildVerseActions(v, surahName),
      ]);
      versesWrap.appendChild(card);
    });

    const note = el("p", { class: "text-source-note" },
      "Arabic text \u00b7 transliteration: tanzil.net. Urdu translation: Abul Ala Maududi, via quranromanurdu.com."
    );
    versesWrap.appendChild(note);

    applyPrefsToDom(prefs);

    // Track roughly how far into this juz the visitor has scrolled, so the
    // home "Continue reading" panel can resume near the right ayah. Fires
    // for whichever verse card is nearest the vertical center of the
    // viewport, debounced so normal scrolling doesn't spam localStorage.
    const cards = Array.from(versesWrap.querySelectorAll(".verse-card"));
    if (cards.length && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const idx = cards.indexOf(entry.target);
            if (idx < 0) return;
            const [, s, a] = entry.target.id.split("-").map(Number);
            const percent = Math.round(((idx + 1) / cards.length) * 100);
            clearTimeout(qawQuranProgressTimer);
            qawQuranProgressTimer = setTimeout(() => setQuranProgress(juzNumber, s, a, percent), 600);
          });
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
      );
      cards.forEach((c) => observer.observe(c));
    }

    if (scrollTarget) {
      const target = document.getElementById(`v-${scrollTarget.s}-${scrollTarget.a}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("search-highlight");
        setTimeout(() => target.classList.remove("search-highlight"), 2500);
      }
    }
  } catch (e) {
    versesWrap.innerHTML = "";
    renderError(versesWrap, e.message);
  }
}

async function renderDuas(scrollTarget) {
  setMeta({
    title: "Dua & Azkar",
    description: "Roz ke duas — Arabic, transliteration aur Hinglish matlab ke saath.",
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), " / Dua & Azkar"]);
  const heading = el("div", {}, [
    el("h1", { class: "page-title" }, "Dua & Azkar"),
    el("p", { class: "duas-subtitle" }, "Roz ke duas \u2014 Arabic, transliteration aur Hinglish matlab ke saath."),
  ]);

  const grid = el("div", { class: "duas-grid" });
  renderLoading(grid);

  const wrap = el("div", { class: "container text-container" }, [crumb, heading, grid]);
  app.appendChild(el("main", {}, wrap));

  function duaUrl(i) {
    return `${window.location.origin}${BASE_PATH}/duas/${i}`;
  }

  function duaShareText(d, i) {
    return [d.title, "", d.arabic, "", d.transliteration, "", `\u201c${d.translation}\u201d`, "", d.reference, duaUrl(i)].join("\n");
  }

  try {
    const res = await fetch(`${RAW_ROOT}/${DUAS_JSON_PATH}`);
    if (!res.ok) throw new Error(`Couldn't load duas.json (${res.status})`);
    const duas = await res.json();
    const tasbeehCounts = qawGetTasbeehCounts();

    grid.innerHTML = "";
    duas.forEach((d, i) => {
      const socialTargets = [
        { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(duaShareText(d, i))}` },
        { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(duaUrl(i))}&text=${encodeURIComponent(d.title)}` },
        { label: "Twitter/X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(d.title)}&url=${encodeURIComponent(duaUrl(i))}` },
        { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(duaUrl(i))}` },
      ];
      const social = el(
        "div",
        { class: "social-row" },
        socialTargets.map((t) => el("a", { class: "social-link", href: t.href, target: "_blank", rel: "noopener noreferrer" }, t.label))
      );
      social.style.display = "none";

      const shareIconBtn = el(
        "button",
        { class: "dua-share-icon", type: "button", "aria-label": "Share this dua" },
        svgIcon(
          '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M14 6.5a2.25 2.25 0 1 0-2.1-3.05L7.4 6.3a2.25 2.25 0 1 0 0 3.9l4.5 2.85a2.25 2.25 0 1 0 .7-1.35L8.1 8.85a2.28 2.28 0 0 0 0-1.2L12.6 4.8c.34.42.83.7 1.4.7Z" fill="currentColor"/></svg>'
        )
      );
      shareIconBtn.addEventListener("click", async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: d.title, text: duaShareText(d, i), url: duaUrl(i) });
          } catch (err) {
            // Cancelled or failed silently - nothing to do.
          }
        } else {
          social.style.display = social.style.display === "none" ? "flex" : "none";
        }
      });

      const saved = isDuaFavorited(i);
      const saveBtn = el(
        "button",
        { class: `btn btn-ghost dua-action${saved ? " is-active" : ""}`, type: "button" },
        saved ? "Saved" : "Save"
      );
      saveBtn.addEventListener("click", () => {
        const now = toggleDuaFavorite(i, { title: d.title, arabic: d.arabic, transliteration: d.transliteration, translation: d.translation, reference: d.reference });
        saveBtn.textContent = now ? "Saved" : "Save";
        saveBtn.classList.toggle("is-active", now);
      });

      const tasbeehBtn = el(
        "button",
        { class: "btn btn-ghost dua-action", type: "button" },
        `Tasbeeh ${tasbeehCounts[i] || 0}`
      );
      tasbeehBtn.addEventListener("click", () => {
        const count = qawIncrementTasbeeh(i);
        tasbeehBtn.textContent = `Tasbeeh ${count}`;
      });

      const card = el("div", { class: "dua-card", id: `dua-${i}` }, [
        el("div", { class: "dua-card-head" }, [
          el("h3", { class: "dua-title" }, d.title),
          el("span", { class: "dua-timing" }, qawDuaTiming(d.title)),
          shareIconBtn,
        ]),
        el("div", { class: "verse-arabic dua-arabic" }, d.arabic),
        el("p", { class: "verse-translit" }, d.transliteration),
        el("p", { class: "verse-urdu dua-translation" }, `\u201c${d.translation}\u201d`),
        el("p", { class: "dua-reference" }, d.reference),
        el("div", { class: "dua-actions" }, [saveBtn, tasbeehBtn]),
        social,
      ]);
      if (d.note) {
        card.appendChild(el("p", { class: "dua-note" }, `\u2139 ${d.note}`));
      }
      grid.appendChild(card);
    });

    if (scrollTarget !== undefined && scrollTarget !== null) {
      const target = document.getElementById(`dua-${scrollTarget}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("search-highlight");
        setTimeout(() => target.classList.remove("search-highlight"), 2500);
      }
    }
  } catch (e) {
    grid.innerHTML = "";
    renderError(grid, e.message);
  }
}

async function loadHadithBook(bookSlug) {
  if (hadithBookCache[bookSlug]) return hadithBookCache[bookSlug];
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  if (!book) throw new Error("Unknown hadith book");

  const res = await fetch(`${RAW_ROOT}/${HADITH_DATA_PATH}/${bookSlug}.json`);
  if (!res.ok) throw new Error("Couldn't load hadith data");
  const data = await res.json();

  const hadithsByBook = {};
  for (const [bookNum, list] of Object.entries(data.hadithsByBook)) {
    hadithsByBook[bookNum] = list.map((h) => ({
      hadithnumber: h.n,
      inBookNumber: h.ib,
      arabic: h.ar,
      english: h.en,
      hinglish: h.hi || null,
    }));
  }

  const result = { sections: data.sections, hadithsByBook };
  hadithBookCache[bookSlug] = result;
  return result;
}

// --- Home page hadith ticker: hadith glide right-to-left, one after another ---
let tickerActive = false;
let tickerPool = [];
let tickerPoolPromise = null;

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function buildTickerPool() {
  if (tickerPoolPromise) return tickerPoolPromise;
  tickerPoolPromise = (async () => {
    const candidates = shuffleInPlace([...HADITH_BOOKS]).slice(0, 3);
    const pool = [];
    for (const b of candidates) {
      try {
        const { sections, hadithsByBook } = await loadHadithBook(b.slug);
        for (const [sectionNum, list] of Object.entries(hadithsByBook)) {
          for (const h of list) {
            if (!h.english) continue;
            pool.push({
              bookSlug: b.slug,
              bookName: b.name,
              sectionNum,
              chapterName: sections[sectionNum] || "",
              hadithnumber: h.hadithnumber,
              inBookNumber: h.inBookNumber,
              snippet: h.english.length > 160 ? h.english.slice(0, 160).trim() + "\u2026" : h.english,
            });
          }
        }
      } catch (e) {
        // That book's data may not be in the repo yet - just skip it.
      }
    }
    return shuffleInPlace(pool);
  })();
  return tickerPoolPromise;
}

function stopHadithTicker() {
  tickerActive = false;
}

async function startHadithTicker(container) {
  const track = el("a", { class: "hadith-ticker-track", href: `${BASE_PATH}/hadith` });
  container.appendChild(track);

  const pool = await buildTickerPool();
  if (!container.isConnected) return; // user navigated away while this was loading
  if (pool.length === 0) {
    container.style.display = "none";
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PIXELS_PER_SECOND = 130; // reading pace - lower is slower
  const PAUSE_BETWEEN_MS = 900; // brief breather between hadith, not a long dead gap
  let idx = 0;
  tickerActive = true;

  async function cycle() {
    if (!tickerActive || !container.isConnected) return;

    const h = pool[idx % pool.length];
    idx++;
    track.href = `${BASE_PATH}/hadith/${h.bookSlug}/${h.sectionNum}/h/${h.hadithnumber}`;
    track.innerHTML = "";
    track.appendChild(el("span", { class: "hadith-ticker-ref" }, `${h.bookName} ${h.hadithnumber}`));
    track.appendChild(el("span", { class: "hadith-ticker-text" }, h.snippet));

    if (reduceMotion) {
      await new Promise((r) => setTimeout(r, 7000));
      cycle();
      return;
    }

    const width = container.clientWidth;
    track.style.transform = `translateX(${width}px)`;
    await new Promise((r) => requestAnimationFrame(r));
    if (!tickerActive || !container.isConnected) return;

    const trackWidth = track.scrollWidth;
    const distance = width + trackWidth;
    const duration = Math.min(24000, Math.max(12000, (distance / PIXELS_PER_SECOND) * 1000));

    track.getAnimations().forEach((a) => a.cancel());
    const anim = track.animate(
      [{ transform: `translateX(${width}px)` }, { transform: `translateX(-${trackWidth}px)` }],
      { duration, easing: "linear", fill: "forwards" }
    );

    try {
      await anim.finished;
    } catch (e) {
      return; // cancelled (route change mid-flight) - stop the chain here
    }
    if (!tickerActive || !container.isConnected) return;
    await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_MS));
    cycle();
  }

  cycle();
}

async function renderHadithBooks() {
  setMeta({
    title: "Hadith Collections",
    description: "Sahih al-Bukhari, Sahih Muslim, and 9 more authentic hadith collections — Arabic text with English translation, free online.",
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), " / Hadith Collections"]);
  const heading = el("div", {}, [
    el("h1", { class: "page-title" }, "Hadith Collections"),
    el("p", { class: "duas-subtitle" }, "The words of the Prophet \uFDFA in Arabic, English & Hinglish"),
  ]);

  function buildGroup(labelEn, labelAr, books) {
    const title = el("div", { class: "hadith-group-title" }, [
      el("span", { class: "hadith-group-title-en" }, labelEn),
      el("span", { class: "hadith-group-title-rule" }),
      el("span", { class: "hadith-group-title-ar" }, labelAr),
    ]);

    const half = Math.ceil(books.length / 2);
    const columns = [books.slice(0, half), books.slice(half)];

    const grid = el(
      "div",
      { class: "hadith-group-grid" },
      columns.map((colBooks) =>
        el(
          "div",
          { class: "hadith-group-col" },
          colBooks.map((b) =>
            el("a", { class: "hadith-row", href: `${BASE_PATH}/hadith/${b.slug}` }, [
              el("span", { class: "hadith-row-en" }, b.name),
              el("span", { class: "hadith-row-ar" }, b.arabic || ""),
            ])
          )
        )
      )
    );

    return el("section", { class: "hadith-group" }, [title, grid]);
  }

  const majorBooks = HADITH_BOOKS.filter((b) => b.group === "major");
  const fortyBooks = HADITH_BOOKS.filter((b) => b.group === "forty");
  const otherBooks = HADITH_BOOKS.filter((b) => b.group !== "major" && b.group !== "forty");

  const sections = [];
  if (majorBooks.length) sections.push(buildGroup("Major Collections", "\u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", majorBooks));
  if (fortyBooks.length) sections.push(buildGroup("Collections of Forty", "\u0627\u0644\u0623\u0631\u0628\u0639\u064a\u0646\u0627\u062a", fortyBooks));
  if (otherBooks.length) sections.push(buildGroup("Other Collections", "\u0645\u062c\u0645\u0648\u0639\u0627\u062a \u0623\u062e\u0631\u0649", otherBooks));

  const wrap = el("div", { class: "container" }, [crumb, heading, ...sections]);
  app.appendChild(el("main", {}, wrap));
}

async function renderHadithChapters(bookSlug) {
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  setMeta({
    title: book ? book.name : bookSlug,
    description: book && book.shortDesc ? book.shortDesc.slice(0, 155) : `Browse the chapters of ${book ? book.name : bookSlug}, free online.`,
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: `${BASE_PATH}/` }, "Library"),
    " / ",
    el("a", { href: `${BASE_PATH}/hadith` }, "Hadith Collections"),
    ` / ${book ? book.name : bookSlug}`,
  ]);
  const heading = el("h1", { class: "page-title" }, book ? book.name : bookSlug);
  const aboutBlockWrap = el("div");
  if (book && book.shortDesc) {
    aboutBlockWrap.appendChild(
      el("p", { class: "hadith-collection-desc" }, [
        book.shortDesc + " ",
        el(
          "a",
          { href: `${BASE_PATH}/hadith-about/${bookSlug}`, target: "_blank", rel: "noopener" },
          "More information \u2026"
        ),
      ])
    );
  }
  if (book && book.extraLinks && book.extraLinks.length) {
    book.extraLinks.forEach((link) => {
      aboutBlockWrap.appendChild(
        el("p", { class: "hadith-collection-extra-link" }, [
          el(
            "a",
            { href: `${BASE_PATH}/hadith-about/${bookSlug}/${link.aboutSlug}`, target: "_blank", rel: "noopener" },
            link.label
          ),
        ])
      );
    });
  }
  const listWrap = el("div");
  renderLoading(listWrap);
  const wrap = el("div", { class: "container" }, [crumb, heading, aboutBlockWrap, listWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const { sections } = await loadHadithBook(bookSlug);
    listWrap.innerHTML = "";
    const grid = el("div", { class: "grid" });
    Object.keys(sections)
      .map(Number)
      .filter((n) => sections[n])
      .sort((a, b) => a - b)
      .forEach((n) => {
        grid.appendChild(
          el("a", { class: "card", href: `${BASE_PATH}/hadith/${bookSlug}/${n}` }, [
            el("div", { class: "card-spine" }),
            el("div", { class: "card-body" }, [
              el("span", { class: "card-kicker" }, n === 0 ? "Introduction" : `Book ${n}`),
              el("h2", { class: "card-title hadith-chapter-title" }, sections[n]),
            ]),
          ])
        );
      });
    listWrap.appendChild(grid);
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

async function renderHadithAbout(bookSlug, aboutSlug) {
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  setMeta({
    title: `About ${book ? book.name : bookSlug}`,
    description: book && book.shortDesc ? book.shortDesc.slice(0, 155) : `Learn about ${book ? book.name : bookSlug}.`,
  });
  app.innerHTML = "";
  const fileSlug = aboutSlug || bookSlug;
  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: `${BASE_PATH}/` }, "Library"),
    " / ",
    el("a", { href: `${BASE_PATH}/hadith` }, "Hadith Collections"),
    " / ",
    el("a", { href: `${BASE_PATH}/hadith/${bookSlug}` }, book ? book.name : bookSlug),
    ...(aboutSlug
      ? [" / ", el("a", { href: `${BASE_PATH}/hadith-about/${bookSlug}` }, "About"), " / Letter"]
      : [" / About"]),
  ]);
  const bodyWrap = el("div");
  renderLoading(bodyWrap);
  const wrap = el("div", { class: "container text-container about-page" }, [crumb, bodyWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const res = await fetch(`${RAW_ROOT}/${HADITH_ABOUT_PATH}/${fileSlug}.json`);
    if (!res.ok) throw new Error("About information is not available yet for this collection.");
    const data = await res.json();
    bodyWrap.innerHTML = "";
    bodyWrap.appendChild(el("h1", { class: "page-title about-title" }, data.title || (book ? book.name : bookSlug)));
    const contentWrap = el("div", { class: "about-content" });
    (data.content || []).forEach((block) => {
      if (block.type === "heading") {
        contentWrap.appendChild(el("h2", { class: "about-heading" }, block.text));
      } else if (block.type === "paragraph") {
        contentWrap.appendChild(el("p", { class: "about-paragraph" }, block.text));
      } else if (block.type === "list") {
        const tag = block.style === "number" ? "ol" : "ul";
        const listEl = el(tag, { class: "about-list" });
        (block.items || []).forEach((item) => listEl.appendChild(el("li", {}, item)));
        contentWrap.appendChild(listEl);
      }
    });
    bodyWrap.appendChild(contentWrap);
  } catch (e) {
    bodyWrap.innerHTML = "";
    renderError(bodyWrap, e.message);
  }
}

const HEART_ICON_PATH =
  'M10 17.3s-6.1-3.8-8.1-7.5C.5 7 1.6 4 4.5 3.3c1.7-.4 3.3.2 4.2 1.6.9-1.4 2.5-2 4.2-1.6 2.9.7 4 3.7 2.6 6.5-2 3.7-8.1 7.5-8.1 7.5z';

// Shared by renderHadithList() and renderFavorites() so a hadith card looks
// and behaves identically everywhere it appears - including the heart
// button's favorited/red state staying in sync across both pages.
function buildHadithCard(h, ctx) {
  // ctx: { bookSlug, bookName, sectionNum, chapterName }
  const { bookSlug, bookName, sectionNum, chapterName } = ctx;

  function hadithUrl() {
    return `${window.location.origin}${BASE_PATH}/hadith/${bookSlug}/${sectionNum}/h/${h.hadithnumber}`;
  }

  function hadithShareText() {
    const lines = [h.arabic, "", h.english];
    if (h.hinglish) lines.push("", h.hinglish);
    lines.push("", `${bookName} ${h.hadithnumber}`, `Book ${sectionNum}: ${chapterName}, Hadith ${h.inBookNumber}`, hadithUrl());
    return lines.join("\n");
  }

  function socialLinksRow() {
    const url = hadithUrl();
    const shortText = `${bookName} ${h.hadithnumber}`;
    const targets = [
      { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(hadithShareText())}` },
      { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shortText)}` },
      { label: "Twitter/X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(url)}` },
      { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    ];
    return el(
      "div",
      { class: "social-row" },
      targets.map((t) => el("a", { class: "social-link", href: t.href, target: "_blank", rel: "noopener noreferrer" }, t.label))
    );
  }

  // ♡ Favorite - filled red when saved, click toggles and (re)persists to
  // localStorage. `onUnfavorite` lets the Favorites page remove the card
  // from view immediately instead of waiting for a full re-render.
  function heartMarkup(filled) {
    return `<svg width="16" height="16" viewBox="0 0 20 20" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="${HEART_ICON_PATH}" stroke-linejoin="round"/></svg>`;
  }
  const favIcon = svgIcon(heartMarkup(isFavorited(bookSlug, sectionNum, h.hadithnumber)));
  const favBtn = el(
    "button",
    {
      class: `fav-btn${isFavorited(bookSlug, sectionNum, h.hadithnumber) ? " is-active" : ""}`,
      type: "button",
      "aria-label": "Favorite this hadith",
      "aria-pressed": String(isFavorited(bookSlug, sectionNum, h.hadithnumber)),
    },
    [favIcon, el("span", {}, "Favorite")]
  );
  favBtn.addEventListener("click", () => {
    const nowFavorited = toggleFavorite(bookSlug, sectionNum, h.hadithnumber, {
      bookName,
      chapterName,
      inBookNumber: h.inBookNumber,
    });
    favBtn.classList.toggle("is-active", nowFavorited);
    favBtn.setAttribute("aria-pressed", String(nowFavorited));
    favIcon.setAttribute("fill", nowFavorited ? "currentColor" : "none");
    if (!nowFavorited && ctx.onUnfavorite) ctx.onUnfavorite(card);
  });

  const copyBtn = el("button", { class: "share-link", type: "button" }, "Copy");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(hadithShareText());
      copyBtn.textContent = "Copied!";
    } catch (err) {
      copyBtn.textContent = "Couldn't copy";
    }
    setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
  });

  const social = socialLinksRow();
  social.style.display = "none";

  const shareBtn = el("button", { class: "share-link", type: "button" }, "Share");
  shareBtn.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${bookName} ${h.hadithnumber}`, text: hadithShareText(), url: hadithUrl() });
      } catch (err) {
        // User cancelled the native share sheet, or it failed silently - no action needed.
      }
    } else {
      social.style.display = social.style.display === "none" ? "flex" : "none";
    }
  });

  const shareRow = el("div", { class: "share-row" }, [
    favBtn,
    el("span", { class: "share-sep" }, "|"),
    shareBtn,
    el("span", { class: "share-sep" }, "|"),
    copyBtn,
  ]);

  const reportBtn = el("button", { class: "report-link", type: "button" }, [
    svgIcon('<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5 14.5 13.5H1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.2v3.3M8 11.6h.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'),
    el("span", {}, "Report issue"),
  ]);
  reportBtn.addEventListener("click", () => {
    openReportModal(`${bookName} ${h.hadithnumber} \u00b7 Book ${sectionNum}, Hadith ${h.inBookNumber}`);
  });

  const card = el("div", { class: "dua-card", id: `h-${h.hadithnumber}` }, [
    el("div", { class: "verse-arabic dua-arabic" }, h.arabic),
    el("p", { class: "verse-urdu dua-translation" }, h.english),
    ...(h.hinglish ? [el("p", { class: "verse-translit hadith-hinglish" }, h.hinglish)] : []),
    el("p", { class: "dua-reference" }, `${bookName} ${h.hadithnumber} \u00b7 Book ${sectionNum}, Hadith ${h.inBookNumber}`),
    shareRow,
    reportBtn,
    social,
  ]);
  return card;
}

async function renderHadithList(bookSlug, sectionNum, scrollTarget) {
  const book = HADITH_BOOKS.find((b) => b.slug === bookSlug);
  setMeta({
    title: `${book ? book.name : bookSlug} — Book ${sectionNum}`,
    description: `Read Book ${sectionNum} of ${book ? book.name : bookSlug} with English translation, free online.`,
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: `${BASE_PATH}/` }, "Library"),
    " / ",
    el("a", { href: `${BASE_PATH}/hadith` }, "Hadith Collections"),
    " / ",
    el("a", { href: `${BASE_PATH}/hadith/${bookSlug}` }, book ? book.name : bookSlug),
    ` / Book ${sectionNum}`,
  ]);
  const headingWrap = el("div", {}, [el("h1", { class: "page-title" }, `Loading\u2026`)]);
  const listWrap = el("div");
  renderLoading(listWrap);
  const wrap = el("div", { class: "container text-container" }, [crumb, headingWrap, listWrap]);
  app.appendChild(el("main", {}, wrap));

  try {
    const { sections, hadithsByBook } = await loadHadithBook(bookSlug);
    headingWrap.innerHTML = "";
    headingWrap.appendChild(el("h1", { class: "page-title" }, sections[sectionNum] || `Book ${sectionNum}`));

    const hadiths = hadithsByBook[sectionNum] || [];
    listWrap.innerHTML = "";

    if (hadiths.length === 0) {
      listWrap.appendChild(el("p", { class: "state-msg" }, "No hadith found in this chapter."));
      return;
    }

    const bookName = book ? book.name : bookSlug;
    const chapterName = sections[sectionNum] || "";

    hadiths.forEach((h) => {
      listWrap.appendChild(buildHadithCard(h, { bookSlug, bookName, sectionNum, chapterName }));
    });

    if (scrollTarget) {
      const target = document.getElementById(`h-${scrollTarget}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("search-highlight");
        setTimeout(() => target.classList.remove("search-highlight"), 2500);
      }
    }
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

// --- Favorites page: shows every hadith the visitor has hearted, newest
// first, re-loading the real text from each collection's JSON so it's
// always current rather than a stale snapshot.
async function renderFavorites() {
  setMeta({
    full: `Your Favorites | ${cfg.siteTitle}`,
    description: "Hadith and Qur'an verses you've favorited on QuranAnyWhere, saved right in this browser.",
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), " / \u2661 Favorites"]);
  const listWrap = el("div");
  const wrap = el("div", { class: "container text-container" }, [
    crumb,
    el("h1", { class: "page-title" }, "\u2661 Your Favorites"),
    listWrap,
  ]);
  app.appendChild(el("main", {}, wrap));

  const favorites = getFavorites();
  if (favorites.length === 0) {
    listWrap.appendChild(
      el("div", { class: "empty-favorites" }, [
        el("p", { class: "state-msg" }, "No favorites yet."),
        el("p", { class: "state-msg" }, "Tap Save on any hadith or ayah to keep it here."),
        el("a", { class: "btn btn-primary", href: `${BASE_PATH}/hadith` }, "Browse Hadith Collections"),
      ])
    );
    return;
  }

  renderLoading(listWrap);

  function buildAyahFavoriteCard(f, v) {
    const surahName = f.surahName || SURAH_NAMES[f.s] || `Surah ${f.s}`;
    const saveBtn = el("button", { class: "btn btn-ghost qr-action is-active", type: "button" }, "Saved");
    saveBtn.addEventListener("click", () => {
      toggleAyahFavorite(f.s, f.a, {});
      card.remove();
      if (listWrap.children.length === 0) renderFavorites();
    });
    const shareBtn = el("button", { class: "btn btn-ghost qr-action", type: "button" }, "Share verse");
    shareBtn.addEventListener("click", async () => {
      const text = [v.ar, v.t, v.u, `${surahName} ${f.s}:${f.a}`].filter(Boolean).join("\n");
      if (navigator.share) {
        try {
          await navigator.share({ title: `${surahName} ${f.s}:${f.a}`, text });
        } catch (e) {
          /* cancelled */
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          shareBtn.textContent = "Copied!";
        } catch (e) {
          shareBtn.textContent = "Couldn't copy";
        }
        setTimeout(() => (shareBtn.textContent = "Share verse"), 1800);
      }
    });
    const openLink = el(
      "a",
      { class: "btn btn-ghost qr-action", href: `${BASE_PATH}/quran-text/${f.juz || 1}/v/${f.s}/${f.a}` },
      "Read in context"
    );

    const card = el("div", { class: "verse-card" }, [
      el("div", { class: "verse-arabic" }, [el("span", {}, v.ar), el("span", { class: "verse-num-badge" }, String(f.a))]),
      v.t ? el("p", { class: "verse-translit" }, v.t) : null,
      v.u ? el("p", { class: "verse-urdu" }, v.u) : null,
      el("p", { class: "dua-reference" }, `${surahName} ${f.s}:${f.a}`),
      el("div", { class: "qr-verse-actions" }, [saveBtn, shareBtn, openLink]),
    ].filter(Boolean));
    return card;
  }

  function buildDuaFavoriteCard(f, d, i) {
    const saveBtn = el("button", { class: "btn btn-ghost dua-action is-active", type: "button" }, "Saved");
    saveBtn.addEventListener("click", () => {
      toggleDuaFavorite(i, {});
      card.remove();
      if (listWrap.children.length === 0) renderFavorites();
    });
    const shareBtn = el("button", { class: "btn btn-ghost dua-action", type: "button" }, "Share");
    shareBtn.addEventListener("click", async () => {
      const text = [d.title, d.arabic, d.transliteration, d.translation, d.reference].filter(Boolean).join("\n");
      if (navigator.share) {
        try {
          await navigator.share({ title: d.title, text });
        } catch (e) {
          /* cancelled */
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          shareBtn.textContent = "Copied!";
        } catch (e) {
          shareBtn.textContent = "Couldn't copy";
        }
        setTimeout(() => (shareBtn.textContent = "Share"), 1800);
      }
    });

    const card = el("div", { class: "dua-card" }, [
      el("h3", { class: "dua-title" }, d.title),
      el("div", { class: "verse-arabic dua-arabic" }, d.arabic),
      d.transliteration ? el("p", { class: "verse-translit" }, d.transliteration) : null,
      d.translation ? el("p", { class: "verse-urdu dua-translation" }, `\u201c${d.translation}\u201d`) : null,
      d.reference ? el("p", { class: "dua-reference" }, d.reference) : null,
      el("div", { class: "dua-actions" }, [saveBtn, shareBtn]),
    ].filter(Boolean));
    return card;
  }

  try {
    const hadithFavs = favorites.filter((f) => f.kind !== "ayah" && f.kind !== "dua");
    const ayahFavs = favorites.filter((f) => f.kind === "ayah");
    const duaFavs = favorites.filter((f) => f.kind === "dua");

    const uniqueSlugs = [...new Set(hadithFavs.map((f) => f.bookSlug))];
    const loadedBooks = {};
    await Promise.all(
      uniqueSlugs.map(async (slug) => {
        try {
          loadedBooks[slug] = await loadHadithBook(slug);
        } catch (e) {
          loadedBooks[slug] = null; // that collection's data failed to load - skip its favorites below
        }
      })
    );

    const uniqueJuz = [...new Set(ayahFavs.map((f) => f.juz).filter(Boolean))];
    const loadedJuz = {};
    await Promise.all(
      uniqueJuz.map(async (j) => {
        try {
          loadedJuz[j] = await fetchJuz(j);
        } catch (e) {
          loadedJuz[j] = null;
        }
      })
    );

    let allDuas = null;
    if (duaFavs.length) {
      try {
        const res = await fetch(`${RAW_ROOT}/${DUAS_JSON_PATH}`);
        allDuas = res.ok ? await res.json() : null;
      } catch (e) {
        allDuas = null;
      }
    }

    listWrap.innerHTML = "";
    let shown = 0;

    favorites.forEach((f) => {
      if (f.kind === "ayah") {
        const juzData = f.juz ? loadedJuz[f.juz] : null;
        const rec = juzData ? juzData.find((x) => x.s === f.s && x.a === f.a) : null;
        // Fall back to the text captured at save time if the juz fetch failed
        // or the ayah's juz wasn't recorded (e.g. an older saved entry).
        const v = rec || (f.ar ? { ar: f.ar, t: f.t, u: f.u } : null);
        if (!v) return;
        listWrap.appendChild(buildAyahFavoriteCard(f, v));
        shown++;
        return;
      }

      if (f.kind === "dua") {
        const live = allDuas && allDuas[f.i] ? allDuas[f.i] : null;
        const d = live || (f.title ? { title: f.title, arabic: f.arabic, transliteration: f.transliteration, translation: f.translation, reference: f.reference } : null);
        if (!d) return;
        listWrap.appendChild(buildDuaFavoriteCard(f, d, f.i));
        shown++;
        return;
      }

      const bookData = loadedBooks[f.bookSlug];
      const h = bookData && bookData.hadithsByBook[f.sectionNum]
        ? bookData.hadithsByBook[f.sectionNum].find((x) => x.hadithnumber === f.hadithnumber)
        : null;
      if (!h) return; // hadith no longer exists at that address - skip silently

      const book = HADITH_BOOKS.find((b) => b.slug === f.bookSlug);
      const bookName = book ? book.name : f.bookSlug;
      const chapterName = (bookData.sections && bookData.sections[f.sectionNum]) || f.chapterName || "";

      const card = buildHadithCard(h, {
        bookSlug: f.bookSlug,
        bookName,
        sectionNum: f.sectionNum,
        chapterName,
        onUnfavorite: (cardEl) => {
          cardEl.remove();
          if (listWrap.children.length === 0) renderFavorites();
        },
      });
      listWrap.appendChild(card);
      shown++;
    });

    if (shown === 0) {
      listWrap.appendChild(el("p", { class: "state-msg" }, "Couldn't load your favorites right now \u2014 try refreshing."));
    }
  } catch (e) {
    listWrap.innerHTML = "";
    renderError(listWrap, e.message);
  }
}

async function loadSearchIndex() {
  if (searchIndexCache) return searchIndexCache;
  const [qRes, hRes] = await Promise.all([
    fetch(`${RAW_ROOT}/${SEARCH_INDEX_PATHS.quran}`),
    fetch(`${RAW_ROOT}/${SEARCH_INDEX_PATHS.hadith}`),
  ]);
  if (!qRes.ok || !hRes.ok) throw new Error("Couldn't load the search index");
  const [quran, hadith] = await Promise.all([qRes.json(), hRes.json()]);
  searchIndexCache = { quran, hadith };
  return searchIndexCache;
}

function snippetAround(text, query, radius) {
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\b${escaped}\\b`, "i").exec(text);
  if (!match) return text.slice(0, radius * 2);
  const idx = match.index;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + match[0].length + radius);
  return (start > 0 ? "\u2026" : "") + text.slice(start, end) + (end < text.length ? "\u2026" : "");
}

async function renderSearch(query) {
  setMeta({
    title: query ? `Search: ${query}` : "Search",
    description: "Search the Qur'an and Hadith collections on QuranAnyWhere.",
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), " / Search"]);

  const form = el("form", { class: "search-form", id: "searchForm" }, [
    el("input", { class: "search-input", id: "searchInput", type: "search", value: query || "", placeholder: "Search the Qur'an and Hadith, or type a hadith number\u2026", autofocus: "true" }),
    el("button", { class: "btn", type: "submit" }, "Search"),
  ]);

  const resultsWrap = el("div", { class: "search-results" });
  const wrap = el("div", { class: "container text-container" }, [crumb, el("h1", { class: "page-title" }, "Search"), form, resultsWrap]);
  app.appendChild(el("main", {}, wrap));

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    if (q) navigate(`${BASE_PATH}/search/${encodeURIComponent(q)}`);
  });

  if (!query) {
    resultsWrap.appendChild(el("p", { class: "state-msg" }, "Type something above to search across every Surah, Ayah, and Hadith on this site \u2014 or enter a hadith number to jump straight to it."));
    return;
  }

  renderLoading(resultsWrap);

  try {
    const { quran, hadith } = await loadSearchIndex();
    const trimmedQuery = query.trim();
    const isNumericQuery = /^\d+$/.test(trimmedQuery);

    let quranMatches = [];
    let hadithMatches = [];
    let wordRegex = null;

    if (isNumericQuery) {
      // Numeric query: treat as a hadith number lookup (the overall running
      // number within its collection), not a text search. The same number
      // can exist in several collections, so show every match.
      const wantedNum = Number(trimmedQuery);
      hadithMatches = hadith.filter((h) => h.n === wantedNum).slice(0, 60);
    } else {
      // Whole-word/phrase matching, not raw substring - otherwise "ali" would
      // match inside "maalik" or "Alif", which is what users actually hit.
      const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      wordRegex = new RegExp(`\\b${escaped}\\b`, "i");

      quranMatches = quran.filter((v) => wordRegex.test(v.t) || wordRegex.test(v.u)).slice(0, 40);
      hadithMatches = hadith.filter((h) => wordRegex.test(h.e) || (h.hi && wordRegex.test(h.hi))).slice(0, 40);
    }

    resultsWrap.innerHTML = "";
    resultsWrap.appendChild(
      el("p", { class: "search-summary" }, `${quranMatches.length + hadithMatches.length} result(s) for \u201c${query}\u201d`)
    );

    if (quranMatches.length > 0) {
      resultsWrap.appendChild(el("h2", { class: "search-section-title" }, "Qur'an"));
      quranMatches.forEach((v) => {
        const matchedUrdu = wordRegex.test(v.u);
        const snippet = snippetAround(matchedUrdu ? v.u : v.t, query, 60);
        resultsWrap.appendChild(
          el("a", { class: "search-result", href: `${BASE_PATH}/quran-text/${v.j}/v/${v.s}/${v.a}` }, [
            el("span", { class: "search-result-ref" }, `${SURAH_NAMES[v.s] || "Surah " + v.s} ${v.s}:${v.a} \u00b7 Juz ${v.j}`),
            el("p", { class: "search-result-snippet" }, snippet),
          ])
        );
      });
    }

    if (hadithMatches.length > 0) {
      resultsWrap.appendChild(el("h2", { class: "search-section-title" }, "Hadith"));
      hadithMatches.forEach((h) => {
        const matchedHi = !isNumericQuery && h.hi && wordRegex.test(h.hi);
        const snippetSource = matchedHi ? h.hi : h.e;
        const snippet = isNumericQuery ? snippetAround(h.e, "", 90) : snippetAround(snippetSource, query, 70);
        resultsWrap.appendChild(
          el("a", { class: "search-result", href: `${BASE_PATH}/hadith/${h.bk}/${h.sc}/h/${h.n}` }, [
            el(
              "span",
              { class: "search-result-ref" },
              `${HADITH_BOOK_NAMES[h.bk] || h.bk} ${h.n} \u00b7 Book ${h.sc}, Hadith ${h.ib}`
            ),
            el("p", { class: "search-result-snippet" }, snippet),
          ])
        );
      });
    }

    if (quranMatches.length === 0 && hadithMatches.length === 0) {
      const msg = isNumericQuery
        ? `No hadith numbered ${trimmedQuery} was found in any collection.`
        : "No matches found. Try a different word or phrase.";
      resultsWrap.appendChild(el("p", { class: "state-msg" }, msg));
    }
  } catch (e) {
    resultsWrap.innerHTML = "";
    renderError(resultsWrap, e.message);
  }
}

function route() {
  stopHadithTicker();
  let path = window.location.pathname;
  if (path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
  path = path.replace(/^\/+/, "");
  const parts = path.split("/").filter(Boolean);

  if (typeof qawStopAudio === "function") qawStopAudio();
  if (typeof qawSetActiveNav === "function") qawSetActiveNav(qawNavKeyFromParts(parts));
  if (typeof qawRefreshSidebarChrome === "function") qawRefreshSidebarChrome();
  const qawTopSearchInput = document.getElementById("qawTopSearchInput");
  if (qawTopSearchInput) qawTopSearchInput.value = parts[0] === "search" && parts[1] ? decodeURIComponent(parts[1]) : "";

  if (parts[0] === "search") {
    renderSearch(parts[1] ? decodeURIComponent(parts[1]) : "");
  } else if (parts[0] === "prayer-times") {
    renderPrayerTimes();
  } else if (parts[0] === "islamic-calendar") {
    renderIslamicCalendar();
  } else if (parts[0] === "quran-play") {
    renderQuranPlayer(parts[1] ? parseInt(parts[1], 10) || 1 : 1);
  } else if (parts[0] === "favorites") {
    renderFavorites();
  } else if (parts[0] === "hadith-about" && parts[1] && parts[2]) {
    renderHadithAbout(decodeURIComponent(parts[1]), decodeURIComponent(parts[2]));
  } else if (parts[0] === "hadith-about" && parts[1]) {
    renderHadithAbout(decodeURIComponent(parts[1]));
  } else if (parts[0] === "hadith" && parts[1] && parts[2] && parts[3] === "h" && parts[4]) {
    renderHadithList(decodeURIComponent(parts[1]), parseInt(parts[2], 10), parseInt(parts[4], 10));
  } else if (parts[0] === "hadith" && parts[1] && parts[2]) {
    renderHadithList(decodeURIComponent(parts[1]), parseInt(parts[2], 10));
  } else if (parts[0] === "hadith" && parts[1]) {
    renderHadithChapters(decodeURIComponent(parts[1]));
  } else if (parts[0] === "hadith") {
    renderHadithBooks();
  } else if (parts[0] === "duas") {
    renderDuas(parts[1] !== undefined ? parseInt(parts[1], 10) : null);
  } else if (parts[0] === "quran-text" && parts[1] && parts[2] === "v" && parts[3] && parts[4]) {
    renderQuranText(parseInt(parts[1], 10) || 1, { s: parseInt(parts[3], 10), a: parseInt(parts[4], 10) });
  } else if (parts[0] === "quran-text" && parts[1]) {
    renderQuranText(parseInt(parts[1], 10) || 1);
  } else if (parts[0] === "book" && parts[1] && parts[2] === "part" && parts[3]) {
    const startPage = parts[4] === "page" && parts[5] ? parseInt(parts[5], 10) : 1;
    renderPart(decodeURIComponent(parts[1]), decodeURIComponent(parts[3]), startPage);
  } else if (parts[0] === "book" && parts[1]) {
    renderBook(decodeURIComponent(parts[1]));
  } else {
    renderHome();
  }
  window.scrollTo(0, 0);
}

// Navigate to a real path via the History API (no full page reload), then render it.
function navigate(path) {
  if (window.location.pathname !== path) {
    history.pushState(null, "", path);
  }
  route();
}

// Intercept clicks on same-site links so navigation stays client-side (SPA
// behavior) even though URLs are now real paths instead of "/..." hashes.
// Links with target="_blank", external URLs, mailto:, or plain "#" (disabled
// state) are left alone to behave normally.
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href === "#" || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) return;
  if (a.target === "_blank" || a.hasAttribute("download")) return;
  e.preventDefault();
  navigate(href);
});

window.addEventListener("popstate", route);
window.addEventListener("DOMContentLoaded", () => {
  updateFavoritesBadge();
  route();
});

/* =============================================================================
   QuranAW — app shell chrome (v3): sidebar active state, streak display,
   nav counts, reading-theme toggle (Paper/Sepia/Night), topbar search.
   Uses only existing helpers: BASE_PATH, HADITH_BOOKS, getFavorites,
   qawStreakInfo, qawTouchStreak, navigate. Safe no-ops if an element is
   missing (so this never breaks a page that doesn't have the shell).
   ========================================================================== */

/* --- Sidebar active nav ------------------------------------------------- */
function qawSetActiveNav(navKey) {
  document.querySelectorAll(".qaw-nav-item").forEach((a) => {
    a.classList.toggle("is-active", a.getAttribute("data-nav") === navKey);
  });
}

function qawNavKeyFromParts(parts) {
  const p0 = parts[0];
  if (!p0) return "home";
  if (p0 === "quran-text") return "quran";
  if (p0 === "book" && parts[1] === QURAN_TEXT_BOOK_SLUG) return "quran";
  if (p0 === "quran-play") return "listen";
  if (p0 === "hadith" || p0 === "hadith-about") return "hadith";
  if (p0 === "search") return "search";
  if (p0 === "duas") return "duas";
  if (p0 === "favorites") return "favorites";
  return "";
}

/* --- Sidebar streak + counts, refreshed on every route change ----------- */
function qawRefreshSidebarChrome() {
  qawTouchStreak();
  const { streak, week } = qawStreakInfo();

  const numEl = document.getElementById("qawSidebarStreakNum");
  if (numEl) numEl.textContent = String(streak);

  const weekEl = document.getElementById("qawSidebarStreakWeek");
  if (weekEl) {
    weekEl.innerHTML = "";
    week.forEach((on) => {
      const dot = document.createElement("span");
      dot.className = on ? "qaw-streak-dot is-on" : "qaw-streak-dot";
      weekEl.appendChild(dot);
    });
  }

  const hadithCountEl = document.getElementById("qawNavHadithCount");
  if (hadithCountEl) hadithCountEl.textContent = `${HADITH_BOOKS.length} books`;

  updateFavoritesBadge();
}

/* --- Reading theme: Paper (default) / Sepia / Night ---------------------- */
const QAW_THEME_KEY = "qaw:theme";

function qawApplyTheme(name) {
  if (name && name !== "paper") {
    document.documentElement.setAttribute("data-theme", name);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  document.querySelectorAll(".qaw-theme-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-theme-choice") === (name || "paper"));
  });
  try {
    localStorage.setItem(QAW_THEME_KEY, name || "paper");
  } catch (e) {
    /* storage unavailable */
  }
}

function qawInitThemeToggle() {
  let saved = "paper";
  try {
    saved = localStorage.getItem(QAW_THEME_KEY) || "paper";
  } catch (e) {
    /* storage unavailable */
  }
  qawApplyTheme(saved);

  document.querySelectorAll(".qaw-theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => qawApplyTheme(btn.getAttribute("data-theme-choice")));
  });
}

/* --- Topbar search: submits into the existing /search/<query> route ----- */
function qawInitTopSearch() {
  const form = document.getElementById("qawTopSearch");
  const input = document.getElementById("qawTopSearchInput");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) navigate(`${BASE_PATH}/search/${encodeURIComponent(q)}`);
  });
}

/* --- Mobile sidebar toggle ------------------------------------------------ */
function qawInitSidebarToggle() {
  const btn = document.getElementById("qawMenuBtn");
  const sidebar = document.getElementById("qawSidebar");
  const backdrop = document.getElementById("qawSidebarBackdrop");
  if (!btn || !sidebar || !backdrop) return;

  const close = () => {
    sidebar.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    sidebar.classList.add("is-open");
    backdrop.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  };

  btn.addEventListener("click", () => {
    sidebar.classList.contains("is-open") ? close() : open();
  });
  backdrop.addEventListener("click", close);
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* =============================================================================
   QuranAW — prayer times (v1): location-based namaz timings + Qibla direction.
   Uses the Aladhan API (aladhan.com — free, no key, CORS-open). Calculation
   method 1 = University of Islamic Sciences, Karachi, the common default
   across India/Pakistan. Falls back from GPS -> IP geolocation -> a plain
   "unavailable" message; caches one day's timings in localStorage so a
   repeat visit the same day doesn't re-fetch or re-prompt for location.
   ========================================================================== */

const QAW_PRAYER_CACHE_KEY = "qaw:prayerCache"; // { date, lat, lon, timings }
const QAW_PRAYER_METHOD = 1;
const QAW_KAABA_LAT = 21.4225;
const QAW_KAABA_LON = 39.8262;
const QAW_PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

let qawPrayerState = null; // { timings, lat, lon } for the current session, once loaded

function qawTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Great-circle bearing from (lat, lon) to the Kaaba, 0-360 degrees from north.
function qawQiblaBearing(lat, lon) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const phi1 = toRad(lat);
  const phi2 = toRad(QAW_KAABA_LAT);
  const dLon = toRad(QAW_KAABA_LON - lon);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return Math.round((toDeg(Math.atan2(y, x)) + 360) % 360);
}

function qawFormatTime12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function qawFormatCountdown(diffMin) {
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Finds the next of the 5 daily prayers relative to the current local time.
// Rolls over to tomorrow's Fajr if we're already past tonight's Isha.
function qawNextPrayer(timings) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const name of QAW_PRAYER_ORDER) {
    const [h, m] = timings[name].split(":").map(Number);
    const mins = h * 60 + m;
    if (mins > nowMin) return { name, time: timings[name], diffMin: mins - nowMin };
  }
  const [h, m] = timings.Fajr.split(":").map(Number);
  return { name: "Fajr", time: timings.Fajr, diffMin: 24 * 60 - nowMin + (h * 60 + m) };
}

async function qawFetchTimings(lat, lon) {
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${QAW_PRAYER_METHOD}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Prayer API error (${res.status})`);
  const json = await res.json();
  return json.data.timings;
}

function qawGetCachedTimings(lat, lon) {
  try {
    const raw = localStorage.getItem(QAW_PRAYER_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (cache.date !== qawTodayStr()) return null;
    // ~0.5deg tolerance (~55km) - avoid refetching for tiny GPS drift.
    if (Math.abs(cache.lat - lat) > 0.5 || Math.abs(cache.lon - lon) > 0.5) return null;
    return cache.timings;
  } catch (e) {
    return null;
  }
}

function qawSetCachedTimings(lat, lon, timings) {
  try {
    localStorage.setItem(QAW_PRAYER_CACHE_KEY, JSON.stringify({ date: qawTodayStr(), lat, lon, timings }));
  } catch (e) {
    /* storage unavailable */
  }
}

function qawSetPrayerLabel(text) {
  const labelEl = document.getElementById("qawPrayerLabel");
  if (labelEl) labelEl.textContent = text;
}

function qawSetPrayerTileSub(text) {
  const subEl = document.getElementById("qawPrayerTileSub");
  if (subEl) subEl.textContent = text;
}

// If a page render (e.g. navigating back Home) rebuilds the prayer tile
// after we already resolved timings this session, fill it in immediately
// instead of showing "Finding your location..." again.
function qawApplyPrayerLabelsIfCached() {
  if (!qawPrayerState) return;
  const next = qawNextPrayer(qawPrayerState.timings);
  const qibla = qawQiblaBearing(qawPrayerState.lat, qawPrayerState.lon);
  qawSetPrayerTileSub(`${next.name} ${qawFormatTime12(next.time)} \u00b7 Qibla ${qibla}\u00b0`);
}

function qawRenderPrayerUI(timings, lat, lon) {
  qawPrayerState = { timings, lat, lon };
  const next = qawNextPrayer(timings);
  qawSetPrayerLabel(`${next.name} ${qawFormatTime12(next.time)} \u00b7 ${qawFormatCountdown(next.diffMin)}`);
  qawApplyPrayerLabelsIfCached();
}

async function qawLoadPrayerTimes(lat, lon) {
  let timings = qawGetCachedTimings(lat, lon);
  if (!timings) {
    timings = await qawFetchTimings(lat, lon);
    qawSetCachedTimings(lat, lon, timings);
  }
  qawRenderPrayerUI(timings, lat, lon);
}

// Resolves the visitor's coordinates: GPS first, falling back to IP-based
// geolocation. Rejects only if both fail - callers decide how to degrade.
function qawResolveLocation() {
  return new Promise((resolve, reject) => {
    const ipFallback = () => {
      fetch("https://ipapi.co/json/")
        .then((res) => {
          if (!res.ok) throw new Error("IP lookup failed");
          return res.json();
        })
        .then((json) => {
          if (!json.latitude || !json.longitude) throw new Error("No coordinates from IP lookup");
          resolve({ lat: json.latitude, lon: json.longitude, city: json.city, region: json.region, country: json.country_name, source: "ip" });
        })
        .catch(reject);
    };

    if (!navigator.geolocation) {
      ipFallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: "gps" }),
      ipFallback,
      { timeout: 8000, maximumAge: 3600000 }
    );
  });
}

async function qawLoadPrayerTimesForChip() {
  try {
    const loc = await qawResolveLocation();
    await qawLoadPrayerTimes(loc.lat, loc.lon);
  } catch (e) {
    qawSetPrayerLabel("Prayer times unavailable");
    qawSetPrayerTileSub("Enable location to see namaz times");
  }
}

function qawInitPrayerTimes() {
  if (!document.getElementById("qawPrayerLabel")) return; // shell not present on this page
  qawSetPrayerLabel("Finding your location\u2026");
  qawLoadPrayerTimesForChip();
}

/* --- Full Prayer Times page ------------------------------------------------ */
const QAW_PRAYER_DISPLAY_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

async function qawReverseGeocode(lat, lon) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const json = await res.json();
  const a = json.address || {};
  const place = a.city || a.town || a.village || a.county || a.state_district;
  const region = a.state || a.country;
  return [place, region].filter(Boolean).join(", ") || json.display_name || null;
}

async function renderPrayerTimes() {
  setMeta({
    title: "Prayer Times",
    description: "Namaz timings and Qibla direction for your current location.",
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), " / Prayer Times"]);

  const locationLine = el("p", { class: "pt-location" }, "Finding your location\u2026");
  const card = el("div", { class: "pt-card" });
  renderLoading(card);

  const wrap = el("div", { class: "container text-container" }, [
    crumb,
    el("h1", { class: "page-title" }, "Prayer Times"),
    locationLine,
    card,
  ]);
  app.appendChild(el("main", {}, wrap));

  try {
    const loc = await qawResolveLocation();
    const timings = qawGetCachedTimings(loc.lat, loc.lon) || (await qawFetchTimings(loc.lat, loc.lon));
    qawSetCachedTimings(loc.lat, loc.lon, timings);
    qawRenderPrayerUI(timings, loc.lat, loc.lon); // keeps the topbar chip / home tile in sync too

    let placeName = [loc.city, loc.region].filter(Boolean).join(", ");
    if (!placeName) {
      try {
        placeName = await qawReverseGeocode(loc.lat, loc.lon);
      } catch (e) {
        placeName = null;
      }
    }
    locationLine.textContent = placeName
      ? `${placeName} \u00b7 ${loc.lat.toFixed(2)}\u00b0, ${loc.lon.toFixed(2)}\u00b0`
      : `${loc.lat.toFixed(2)}\u00b0, ${loc.lon.toFixed(2)}\u00b0`;

    const next = qawNextPrayer(timings);
    const qibla = qawQiblaBearing(loc.lat, loc.lon);

    card.innerHTML = "";
    card.appendChild(
      el("div", { class: "pt-next" }, [
        el("span", { class: "pt-next-kicker" }, "Next prayer"),
        el("span", { class: "pt-next-name" }, next.name),
        el("span", { class: "pt-next-time" }, `${qawFormatTime12(next.time)} \u00b7 in ${qawFormatCountdown(next.diffMin)}`),
      ])
    );

    const list = el("div", { class: "pt-list" });
    QAW_PRAYER_DISPLAY_ORDER.forEach((name) => {
      if (!timings[name]) return;
      const isNext = name === next.name;
      list.appendChild(
        el("div", { class: `pt-row${isNext ? " is-next" : ""}` }, [
          el("span", { class: "pt-row-name" }, name),
          el("span", { class: "pt-row-time" }, qawFormatTime12(timings[name])),
        ])
      );
    });
    card.appendChild(list);

    card.appendChild(
      el("div", { class: "pt-qibla" }, [
        el("span", { class: "pt-qibla-label" }, "Qibla direction"),
        el("span", { class: "pt-qibla-deg" }, `${qibla}\u00b0`),
        el("span", { class: "pt-qibla-sub" }, "from true North"),
      ])
    );

    card.appendChild(
      el(
        "p",
        { class: "pt-note" },
        "Calculation method: University of Islamic Sciences, Karachi. Times are approximate \u2014 please confirm with your local masjid for congregational (jama'at) timings."
      )
    );
  } catch (e) {
    locationLine.textContent = "Couldn't determine your location.";
    card.innerHTML = "";
    renderError(card, "Enable location access in your browser and reload this page to see prayer times.");
  }
}

/* --- Islamic (Hijri) calendar --------------------------------------------
   Converts today's date (in the visitor's own local timezone, so the day
   boundary matches where they actually are) to the Hijri calendar via the
   Aladhan API's gToH endpoint - free, no key, CORS-open. This is a
   calendar conversion (Umm al-Qura based), not a moon-sighting service, so
   it may occasionally differ by a day from local moon-sighting announcements
   in your region - worth confirming with your local masjid around Ramadan
   and Eid. */
async function qawFetchHijriDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${dd}-${mm}-${yyyy}`);
  if (!res.ok) throw new Error(`Calendar API error (${res.status})`);
  const json = await res.json();
  return json.data;
}

async function renderIslamicCalendar() {
  setMeta({
    title: "Islamic Calendar",
    description: "Today's Hijri (Islamic) calendar date, converted for your local day.",
  });
  app.innerHTML = "";
  const crumb = el("p", { class: "crumb" }, [el("a", { href: `${BASE_PATH}/` }, "Library"), " / Islamic Calendar"]);

  const card = el("div", { class: "pt-card ic-card" });
  renderLoading(card);

  const wrap = el("div", { class: "container text-container" }, [
    crumb,
    el("h1", { class: "page-title" }, "Islamic Calendar"),
    card,
  ]);
  app.appendChild(el("main", {}, wrap));

  try {
    const data = await qawFetchHijriDate(new Date());
    const h = data.hijri;
    const g = data.gregorian;

    card.innerHTML = "";
    card.appendChild(
      el("div", { class: "ic-hijri" }, [
        el("span", { class: "ic-hijri-day" }, h.day),
        el("div", { class: "ic-hijri-mid" }, [
          el("span", { class: "ic-hijri-month" }, `${h.month.en} ${h.year} AH`),
          el("span", { class: "ic-hijri-ar", dir: "rtl" }, `${h.weekday.ar} \u00b7 ${h.month.ar} ${h.year}`),
        ]),
      ])
    );

    card.appendChild(
      el("div", { class: "ic-gregorian" }, [
        el("span", { class: "ic-gregorian-label" }, "Gregorian" ),
        el("span", { class: "ic-gregorian-date" }, `${h.weekday.en}, ${g.day} ${g.month.en} ${g.year} CE`),
      ])
    );

    if (h.holidays && h.holidays.length) {
      card.appendChild(
        el("div", { class: "ic-holidays" }, [
          el("span", { class: "ic-holidays-label" }, "Today marks:"),
          ...h.holidays.map((name) => el("span", { class: "ic-holiday-chip" }, name)),
        ])
      );
    }

    card.appendChild(
      el(
        "p",
        { class: "pt-note" },
        "Based on your device's local date and the standard Hijri calendar calculation. Moon-sighting announcements in your area may differ by a day \u2014 please confirm with your local masjid, especially around Ramadan and Eid."
      )
    );
  } catch (e) {
    card.innerHTML = "";
    renderError(card, "Couldn't load today's Hijri date right now \u2014 try refreshing.");
  }
}

/* --- Continuous recitation player: plays a whole surah, ayah by ayah ------
   Separate from the study reader (/quran-text/*) - this is a simple,
   podcast-style "listen straight through" page: pick a surah, hit Play, and
   it recites every ayah in order (Arabic, then the Hinglish meaning spoken
   aloud), auto-advancing down the list and optionally rolling into the next
   surah when this one ends. */
const QAW_AUTOPLAY_KEY = "qaw:playerAutoNext";

function qawGetAutoNextPref() {
  try {
    return localStorage.getItem(QAW_AUTOPLAY_KEY) !== "off";
  } catch (e) {
    return true;
  }
}
function qawSetAutoNextPref(on) {
  try {
    localStorage.setItem(QAW_AUTOPLAY_KEY, on ? "on" : "off");
  } catch (e) {
    /* storage unavailable */
  }
}

async function renderQuranPlayer(surahNumber, opts) {
  surahNumber = Math.max(1, Math.min(surahNumber, 114));
  const autoplay = !!(opts && opts.autoplay);
  const meta = SURAH_META[surahNumber];
  const surahName = SURAH_NAMES[surahNumber] || `Surah ${surahNumber}`;

  setMeta({
    title: `Listen: ${surahName}`,
    description: `Listen to ${surahName} recited in full, ayah by ayah, with the Hinglish meaning read aloud.`,
  });

  if (!opts || !opts.internalNav) {
    app.innerHTML = "";
  }

  const crumb = el("p", { class: "crumb" }, [
    el("a", { href: `${BASE_PATH}/` }, "Library"),
    " / ",
    el("a", { href: `${BASE_PATH}/quran-text/${meta.juz}` }, "Qur'an"),
    " / Listen",
  ]);

  const prevLink = el(
    "a",
    { class: "pl-nav-btn", href: surahNumber > 1 ? `${BASE_PATH}/quran-play/${surahNumber - 1}` : "#", "aria-disabled": surahNumber <= 1 },
    "\u2039 Prev surah"
  );
  const nextLink = el(
    "a",
    { class: "pl-nav-btn", href: surahNumber < 114 ? `${BASE_PATH}/quran-play/${surahNumber + 1}` : "#", "aria-disabled": surahNumber >= 114 },
    "Next surah \u203a"
  );

  const header = el("div", { class: "pl-header" }, [
    prevLink,
    el("div", { class: "pl-header-mid" }, [
      el("span", { class: "pl-header-kicker" }, `SURAH ${surahNumber}`),
      el("h1", { class: "pl-header-title" }, surahName),
      el("span", { class: "pl-header-ar", dir: "rtl" }, meta.ar),
      el("p", { class: "pl-header-sub" }, `${meta.ayahs} ayat \u00b7 ${meta.type === "Meccan" ? "Makki" : "Madani"}`),
    ]),
    nextLink,
  ]);

  const playAllBtn = el("button", { class: "btn btn-primary pl-play-all", type: "button" }, "\u25b6 Play Surah");
  const autoNextRow = el("label", { class: "pl-autonext" }, [
    el("input", { type: "checkbox", id: "plAutoNext" }),
    " Auto-play next surah when this one ends",
  ]);
  const autoNextCheckbox = autoNextRow.querySelector("input");
  autoNextCheckbox.checked = qawGetAutoNextPref();
  autoNextCheckbox.addEventListener("change", () => qawSetAutoNextPref(autoNextCheckbox.checked));

  const controls = el("div", { class: "pl-controls" }, [playAllBtn, autoNextRow]);
  const list = el("div", { class: "pl-list" });
  renderLoading(list);

  const wrap = el("div", { class: "container text-container pl-container" }, [crumb, header, controls, list]);

  if (opts && opts.internalNav) {
    const oldWrap = app.querySelector(".pl-container");
    if (oldWrap) oldWrap.replaceWith(wrap);
    else app.appendChild(el("main", {}, wrap));
  } else {
    app.appendChild(el("main", {}, wrap));
  }

  try {
    const ayahs = await fetchSurahAyahs(surahNumber);
    list.innerHTML = "";

    const rows = ayahs.map((v, idx) =>
      el("div", { class: "pl-row", id: `pl-${idx}` }, [
        el("span", { class: "pl-row-num" }, String(v.a)),
        el("div", { class: "pl-row-text" }, [
          el("span", { class: "pl-row-ar", dir: "rtl" }, v.ar),
          el("span", { class: "pl-row-translit" }, v.t),
        ]),
      ])
    );
    rows.forEach((r) => list.appendChild(r));

    function setPlayingRow(idx) {
      rows.forEach((r, i) => r.classList.toggle("is-playing", i === idx));
      if (idx >= 0 && rows[idx]) rows[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function playFrom(idx) {
      if (idx >= ayahs.length) {
        setPlayingRow(-1);
        playAllBtn.textContent = "\u25b6 Play Surah";
        if (qawGetAutoNextPref() && surahNumber < 114) {
          const nextSurah = surahNumber + 1;
          history.replaceState(null, "", `${BASE_PATH}/quran-play/${nextSurah}`);
          renderQuranPlayer(nextSurah, { autoplay: true, internalNav: true });
        }
        return;
      }
      setPlayingRow(idx);
      const v = ayahs[idx];
      qawPlayAudioUrl(qawAyahAudioUrl(v.s, v.a), playAllBtn, "\u25b6 Play Surah", () => playFrom(idx + 1));
    }

    playAllBtn.addEventListener("click", () => {
      if (qawAudioActiveBtn === playAllBtn) {
        qawPlayAudioUrl(qawAudioActiveUrl, playAllBtn, "\u25b6 Play Surah"); // toggles pause/resume in place
        return;
      }
      playFrom(0);
    });

    if (autoplay) playFrom(0);
  } catch (e) {
    list.innerHTML = "";
    renderError(list, e.message);
  }
}


/* =============================================================================
   QuranAW — custom "Install app" banner (v1). Browsers that support the PWA
   install prompt (Chrome/Edge/Samsung Internet on Android, desktop Chrome)
   fire `beforeinstallprompt`; we suppress the browser's own popup and show
   our own banner instead, triggering the same native prompt on click. iOS
   Safari never fires that event and has no programmatic install API, so it
   gets a one-time manual "Add to Home Screen" instruction instead.
   ========================================================================== */
const QAW_INSTALL_DISMISS_KEY = "qaw:installDismissed";
let qawDeferredInstallPrompt = null;

function qawIsStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari's own flag
  );
}

function qawIsIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function qawWasInstallDismissed() {
  try {
    return localStorage.getItem(QAW_INSTALL_DISMISS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function qawShowInstallBanner(text) {
  const banner = document.getElementById("qawInstallBanner");
  const textEl = document.getElementById("qawInstallText");
  if (!banner) return;
  if (text && textEl) textEl.textContent = text;
  banner.style.display = "flex";
}

function qawHideInstallBanner() {
  const banner = document.getElementById("qawInstallBanner");
  if (banner) banner.style.display = "none";
}

function qawInitInstallPrompt() {
  if (qawIsStandalone() || qawWasInstallDismissed()) return; // already installed, or user dismissed before

  const installBtn = document.getElementById("qawInstallBtn");
  const closeBtn = document.getElementById("qawInstallClose");
  if (!installBtn || !closeBtn) return;

  closeBtn.addEventListener("click", () => {
    qawHideInstallBanner();
    try {
      localStorage.setItem(QAW_INSTALL_DISMISS_KEY, "1");
    } catch (e) {
      /* storage unavailable */
    }
  });

  // Android/desktop Chrome-family browsers: suppress their native popup and
  // show ours instead; clicking Install re-triggers the same real prompt.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    qawDeferredInstallPrompt = e;
    installBtn.textContent = "Install";
    qawShowInstallBanner("Install QuranAW for quick, offline-ready access");
  });

  installBtn.addEventListener("click", async () => {
    if (qawDeferredInstallPrompt) {
      qawDeferredInstallPrompt.prompt();
      try {
        await qawDeferredInstallPrompt.userChoice;
      } catch (e) {
        /* dismissed */
      }
      qawDeferredInstallPrompt = null;
      qawHideInstallBanner();
      return;
    }
    if (qawIsIos()) {
      qawShowInstallBanner('Tap the Share icon, then "Add to Home Screen"');
    }
  });

  window.addEventListener("appinstalled", () => {
    qawDeferredInstallPrompt = null;
    qawHideInstallBanner();
  });

  // iOS Safari never fires beforeinstallprompt - offer manual instructions
  // instead, once, unless already dismissed or already installed.
  if (qawIsIos() && !qawIsStandalone()) {
    qawShowInstallBanner("Add QuranAW to your Home Screen for quick access");
    installBtn.textContent = "How?";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  qawInitThemeToggle();
  qawInitTopSearch();
  qawInitSidebarToggle();
  qawRefreshSidebarChrome();
  qawInitPrayerTimes();
  qawInitInstallPrompt();
});
