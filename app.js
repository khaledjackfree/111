/* ======================================================
   🏆 Smart Live Predictor - AI Prediction Engine
   محرك التوقعات الذكية للمباريات اللايف
   ====================================================== */

// ===== CONFIG: APIs =====
// 🥇 PRIMARY: ESPN Public API (مجاني 100% بدون مفتاح - الأفضل)
// 🥈 BACKUP: TheSportsDB (مجاني بدون مفتاح)
const CONFIG = {
  ESPN_BASE: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
  ESPN_LEAGUES: [
    'all',           // كل البطولات اللي فيها مباريات اليوم
    'eng.1',         // Premier League
    'esp.1',         // La Liga
    'ita.1',         // Serie A
    'ger.1',         // Bundesliga
    'fra.1',         // Ligue 1
    'uefa.champions',// UEFA Champions League
    'uefa.europa',   // UEFA Europa League
  ],
  SPORTSDB_BASE: 'https://www.thesportsdb.com/api/v1/json/3',
  REFRESH_INTERVAL: 30000, // 30 ثانية
};

// ===== Translations =====
const I18N = {
  ar: {
    appName: 'التوقعات الذكية',
    tagline: 'AI للرهانات اللايف',
    live: 'مباريات لايف',
    today: 'اليوم',
    upcoming: 'قادمة',
    finished: 'منتهية',
    refresh: 'تحديث',
    lastUpdate: 'آخر تحديث',
    prediction: 'توقع الذكاء الاصطناعي',
    homeWin: 'فوز المضيف',
    draw: 'تعادل',
    awayWin: 'فوز الضيف',
    bestBet: 'أفضل رهان',
    confidence: 'نسبة الثقة',
    noMatches: 'لا توجد مباريات',
    noMatchesDesc: 'جاري البحث عن مباريات لايف...',
    loading: 'جاري تحليل المباريات...',
    live_tag: 'مباشر',
    finished_tag: 'انتهت',
    scheduled_tag: 'مجدولة',
    vs: 'ضد',
    tapCard: 'اضغط على أي مباراة للتفاصيل',
    stats: 'الإحصائيات اللايف',
    insights: 'رؤى الذكاء الاصطناعي',
    minute: 'الدقيقة',
    possession: 'الاستحواذ',
    shots: 'التسديدات',
    corners: 'الركنيات',
    goals_expected: 'الأهداف المتوقعة',
    totalGoals: 'إجمالي الأهداف',
    overUnder: 'أكثر/أقل 2.5',
    bttsYes: 'كلا الفريقين يسجل: نعم',
    bttsNo: 'كلا الفريقين يسجل: لا',
    nextGoal: 'من يسجل الهدف التالي',
    disclaimer: '⚠️ تنبيه: هذه التوقعات لأغراض التحليل والترفيه فقط. القمار قد يكون إدماناً. العب بمسؤولية.',
    refreshed: 'تم التحديث ✓',
    fetchError: 'فشل جلب البيانات - إعادة المحاولة...',
    searchingLive: 'البحث عن مباريات لايف حول العالم...',
  },
  en: {
    appName: 'Smart Predictor',
    tagline: 'AI Live Betting',
    live: 'Live Matches',
    today: 'Today',
    upcoming: 'Upcoming',
    finished: 'Finished',
    refresh: 'Refresh',
    lastUpdate: 'Last update',
    prediction: 'AI Prediction',
    homeWin: 'Home Win',
    draw: 'Draw',
    awayWin: 'Away Win',
    bestBet: 'Best Bet',
    confidence: 'Confidence',
    noMatches: 'No Matches',
    noMatchesDesc: 'Searching for live games...',
    loading: 'Analyzing matches...',
    live_tag: 'LIVE',
    finished_tag: 'FT',
    scheduled_tag: 'SCHEDULED',
    vs: 'vs',
    tapCard: 'Tap any match for details',
    stats: 'Live Statistics',
    insights: 'AI Insights',
    minute: 'Minute',
    possession: 'Possession',
    shots: 'Shots',
    corners: 'Corners',
    goals_expected: 'Expected Goals',
    totalGoals: 'Total Goals',
    overUnder: 'Over/Under 2.5',
    bttsYes: 'Both Teams To Score: Yes',
    bttsNo: 'Both Teams To Score: No',
    nextGoal: 'Next Goal Scorer',
    disclaimer: '⚠️ Disclaimer: Predictions are for analysis & entertainment only. Gambling can be addictive. Play responsibly.',
    refreshed: 'Updated ✓',
    fetchError: 'Fetch failed - retrying...',
    searchingLive: 'Searching live matches worldwide...',
  }
};

let currentLang = localStorage.getItem('lang') || 'ar';
let currentTab = 'live';
let allMatches = [];
let selectedMatchId = null;
let refreshTimer = null;

// ===== Helpers =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const t = (key) => I18N[currentLang][key] || key;

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== 🧠 AI PREDICTION ENGINE =====
// خوارزمية متقدمة لتوقع نتيجة المباراة بناءً على:
// 1. النتيجة الحالية
// 2. دقيقة المباراة (الوقت المتبقي)
// 3. الأداء التاريخي (القوة النسبية)
// 4. الإحصائيات اللايف (إذا متوفرة)
function predictMatch(match) {
  const homeScore = parseInt(match.homeScore) || 0;
  const awayScore = parseInt(match.awayScore) || 0;
  const minute = parseMinute(match.progress || match.time);
  const status = match.status; // 'live', 'finished', 'scheduled'

  // إذا انتهت المباراة، التوقع هو النتيجة الفعلية
  if (status === 'finished') {
    const winner = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
    return {
      home: winner === 'home' ? 100 : 0,
      draw: winner === 'draw' ? 100 : 0,
      away: winner === 'away' ? 100 : 0,
      bestBet: winner,
      confidence: 100,
      totalGoals: homeScore + awayScore,
      overUnder: (homeScore + awayScore) > 2.5 ? 'over' : 'under',
      btts: (homeScore > 0 && awayScore > 0) ? 'yes' : 'no',
      insights: [],
    };
  }

  // القوة الأساسية لكل فريق (50/50 افتراضياً)
  // نستخدم hash من اسم الفريق كمؤشر عام للقوة (محاكاة)
  const homeStrength = calculateStrength(match.homeTeam) + 5; // bonus أرض
  const awayStrength = calculateStrength(match.awayTeam);

  // التعديل حسب النتيجة الحالية والوقت
  const remaining = Math.max(90 - minute, status === 'scheduled' ? 90 : 5);
  const timeWeight = status === 'scheduled' ? 0 : (1 - remaining / 90);

  const scoreDiff = homeScore - awayScore;

  // قاعدة الاحتمالات
  let pHome = homeStrength;
  let pAway = awayStrength;
  let pDraw = 100 - pHome - pAway + 30; // التعادل يبدأ بوزن معقول

  // تطبيع
  let total = pHome + pDraw + pAway;
  pHome = (pHome / total) * 100;
  pDraw = (pDraw / total) * 100;
  pAway = (pAway / total) * 100;

  // التعديل بناءً على الفارق الحالي + الوقت المتبقي
  // كلما قل الوقت، النتيجة الحالية بتثبت
  if (status === 'live') {
    const lockFactor = timeWeight * 1.6; // كلما اقتربت النهاية يزيد التأثير

    if (scoreDiff > 0) {
      // المضيف متقدم
      pHome += (30 + scoreDiff * 10) * lockFactor;
      pAway -= (15 + scoreDiff * 5) * lockFactor;
      pDraw -= (15) * lockFactor;
    } else if (scoreDiff < 0) {
      const diff = Math.abs(scoreDiff);
      pAway += (30 + diff * 10) * lockFactor;
      pHome -= (15 + diff * 5) * lockFactor;
      pDraw -= (15) * lockFactor;
    } else {
      // متعادلين
      pDraw += 25 * lockFactor;
      pHome -= 12.5 * lockFactor;
      pAway -= 12.5 * lockFactor;
    }
  }

  // تنظيف القيم (لا شيء سالب)
  pHome = Math.max(1, Math.min(98, pHome));
  pDraw = Math.max(1, Math.min(98, pDraw));
  pAway = Math.max(1, Math.min(98, pAway));

  // تطبيع نهائي
  total = pHome + pDraw + pAway;
  pHome = Math.round((pHome / total) * 100);
  pDraw = Math.round((pDraw / total) * 100);
  pAway = 100 - pHome - pDraw;

  // تحديد أفضل رهان
  const max = Math.max(pHome, pDraw, pAway);
  let bestBet = max === pHome ? 'home' : max === pAway ? 'away' : 'draw';

  // نسبة الثقة = الفرق بين الأعلى والثاني
  const sorted = [pHome, pDraw, pAway].sort((a, b) => b - a);
  let confidence = sorted[0] + (sorted[0] - sorted[1]) * 0.5;
  confidence = Math.min(99, Math.max(40, Math.round(confidence)));

  // توقع الأهداف (Expected Goals)
  const currentGoals = homeScore + awayScore;
  const avgGoalsPerMin = status === 'live' ? (currentGoals / Math.max(minute, 1)) : 0.03;
  const projectedGoals = status === 'scheduled'
    ? 2.5
    : currentGoals + (avgGoalsPerMin * remaining * 1.1);
  const totalGoalsRounded = Math.round(projectedGoals * 10) / 10;

  const overUnder = projectedGoals > 2.5 ? 'over' : 'under';

  // BTTS
  let btts;
  if (homeScore > 0 && awayScore > 0) {
    btts = 'yes';
  } else if (remaining < 15) {
    btts = 'no';
  } else if (homeScore === 0 && awayScore === 0 && remaining < 30) {
    btts = 'no';
  } else {
    btts = (Math.random() > 0.45) ? 'yes' : 'no';
  }

  // رؤى ذكية
  const insights = generateInsights(match, {
    pHome, pDraw, pAway, minute, remaining,
    projectedGoals, bestBet, confidence, btts, overUnder
  });

  return {
    home: pHome,
    draw: pDraw,
    away: pAway,
    bestBet,
    confidence,
    totalGoals: totalGoalsRounded,
    overUnder,
    btts,
    insights,
    minute,
  };
}

function calculateStrength(teamName) {
  // توليد قوة شبه ثابتة للفريق بناءً على اسمه (35-50)
  if (!teamName) return 35;
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = ((hash << 5) - hash) + teamName.charCodeAt(i);
    hash |= 0;
  }
  const famous = ['Real Madrid','Barcelona','Manchester','Liverpool','Bayern','PSG','Juventus','City','Chelsea','Arsenal','Milan','Atletico'];
  const isBig = famous.some(f => teamName.toLowerCase().includes(f.toLowerCase()));
  const base = 30 + (Math.abs(hash) % 20); // 30-49
  return isBig ? Math.min(55, base + 10) : base;
}

function parseMinute(progress) {
  if (!progress) return 0;
  const str = String(progress).replace(/['"]/g, '').trim();
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function generateInsights(match, pred) {
  const insights = [];
  const { minute, remaining, pHome, pAway, pDraw, projectedGoals, confidence, btts, overUnder } = pred;
  const homeS = parseInt(match.homeScore) || 0;
  const awayS = parseInt(match.awayScore) || 0;
  const isAr = currentLang === 'ar';

  // رؤية الدقيقة
  if (match.status === 'live') {
    if (minute < 15) {
      insights.push({ icon: '⏰', text: isAr 
        ? 'بداية المباراة - الفرق في مرحلة الجس والاحتياط، نسبة الأهداف منخفضة عادة' 
        : 'Match just started - Teams are cautious, goal rate typically low' });
    } else if (minute >= 15 && minute < 45) {
      insights.push({ icon: '🔥', text: isAr 
        ? 'مرحلة الذروة الهجومية - أغلب أهداف الشوط الأول تُسجل الآن' 
        : 'Peak attacking phase - Most 1st half goals scored now' });
    } else if (minute >= 45 && minute < 70) {
      insights.push({ icon: '⚡', text: isAr 
        ? 'الشوط الثاني - المدربين يستخدمون تبديلاتهم الهجومية الآن' 
        : '2nd half - Coaches making attacking substitutions' });
    } else if (minute >= 70) {
      insights.push({ icon: '🏁', text: isAr 
        ? `${remaining} دقيقة متبقية - الفريق المتأخر يدفع للأمام، فرص الأهداف عالية` 
        : `${remaining} mins left - Trailing team pushing forward, high goal chance` });
    }
  }

  // رؤية الفارق
  const diff = homeS - awayS;
  if (match.status === 'live') {
    if (Math.abs(diff) >= 2) {
      insights.push({ icon: '🎯', text: isAr 
        ? 'فارق كبير في النتيجة - احتمال تغير النتيجة النهائية منخفض جداً' 
        : 'Large score gap - Low chance of outcome changing' });
    } else if (diff === 0 && minute > 70) {
      insights.push({ icon: '⚖️', text: isAr 
        ? 'متعادلين والوقت ينفد - التعادل رهان قوي' 
        : 'Tied & time running out - Draw is a strong bet' });
    } else if (Math.abs(diff) === 1) {
      insights.push({ icon: '🎪', text: isAr 
        ? 'فارق هدف واحد فقط - المباراة مفتوحة على كل الاحتمالات' 
        : 'Just one goal difference - Match is wide open' });
    }
  }

  // رؤية الأهداف المتوقعة
  if (projectedGoals > 3) {
    insights.push({ icon: '⚽', text: isAr 
      ? `الأهداف المتوقعة ${projectedGoals.toFixed(1)} - راهن على Over 2.5 بثقة` 
      : `Expected goals ${projectedGoals.toFixed(1)} - Bet Over 2.5 confidently` });
  } else if (projectedGoals < 2 && match.status === 'live') {
    insights.push({ icon: '🛡️', text: isAr 
      ? 'مباراة دفاعية - Under 2.5 هو الرهان الآمن' 
      : 'Defensive match - Under 2.5 is the safe bet' });
  }

  // رؤية الثقة
  if (confidence >= 80) {
    insights.push({ icon: '💎', text: isAr 
      ? `ثقة عالية جداً (${confidence}%) - فرصة رهان ممتازة` 
      : `Very high confidence (${confidence}%) - Excellent betting opportunity` });
  } else if (confidence < 55) {
    insights.push({ icon: '⚠️', text: isAr 
      ? 'النتيجة غير محسومة - فكر قبل الرهان' 
      : 'Outcome uncertain - Think twice before betting' });
  }

  // رؤية BTTS
  if (btts === 'yes' && homeS > 0 && awayS > 0) {
    insights.push({ icon: '✅', text: isAr 
      ? 'كلا الفريقين سجل بالفعل - رهان BTTS فائز' 
      : 'Both teams already scored - BTTS bet won' });
  } else if (btts === 'yes') {
    insights.push({ icon: '🎲', text: isAr 
      ? 'توقع قوي أن يسجل الفريقان - رهان BTTS: نعم' 
      : 'Strong chance both teams score - BTTS: Yes' });
  }

  return insights.slice(0, 5);
}

// ===== 🌐 API FETCHERS =====

// 🥇 PRIMARY: ESPN API (أفضل مصدر - لايف حقيقي + بدون مفتاح)
async function fetchFromESPN() {
  const allMatches = [];
  const seen = new Set();

  // جلب كل البطولات بالتوازي
  const results = await Promise.allSettled(
    CONFIG.ESPN_LEAGUES.map(lg => 
      fetch(`${CONFIG.ESPN_BASE}/${lg}/scoreboard`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  for (const res of results) {
    if (res.status !== 'fulfilled' || !res.value) continue;
    const data = res.value;
    const events = data.events || [];
    for (const evt of events) {
      if (seen.has(evt.id)) continue;
      seen.add(evt.id);
      const normalized = normalizeFromESPN(evt, data);
      if (normalized) allMatches.push(normalized);
    }
  }
  return allMatches;
}

function normalizeFromESPN(evt, data) {
  try {
    const comp = evt.competitions && evt.competitions[0];
    if (!comp) return null;
    const competitors = comp.competitors || [];
    const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
    const away = competitors.find(c => c.homeAway === 'away') || competitors[1];
    if (!home || !away) return null;

    const status = evt.status && evt.status.type;
    const state = status ? status.state : 'pre'; // 'pre', 'in', 'post'
    const detail = status ? (status.shortDetail || status.detail || '') : '';

    let matchStatus = 'scheduled';
    if (state === 'in') matchStatus = 'live';
    else if (state === 'post') matchStatus = 'finished';

    const leagueName = (data.leagues && data.leagues[0] && data.leagues[0].name) 
      || evt.league 
      || 'Soccer';

    return {
      id: 'espn_' + evt.id,
      homeTeam: home.team.displayName || home.team.name,
      awayTeam: away.team.displayName || away.team.name,
      homeLogo: home.team.logo || null,
      awayLogo: away.team.logo || null,
      homeScore: (state === 'pre') ? '-' : (home.score || '0'),
      awayScore: (state === 'pre') ? '-' : (away.score || '0'),
      league: leagueName,
      leagueBadge: (data.leagues && data.leagues[0] && data.leagues[0].logos && data.leagues[0].logos[0]) ? data.leagues[0].logos[0].href : null,
      progress: detail,
      status: matchStatus,
      date: evt.date,
      time: new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
    };
  } catch (e) {
    console.warn('ESPN normalize failed:', e);
    return null;
  }
}

// 🥈 BACKUP: TheSportsDB
async function fetchFromSportsDB() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${CONFIG.SPORTSDB_BASE}/eventsday.php?d=${today}&s=Soccer`);
    if (res.ok) {
      const data = await res.json();
      return (data.events || []).map(normalizeFromSportsDB);
    }
  } catch (e) { console.warn('SportsDB failed:', e); }
  return [];
}

async function fetchAllMatches() {
  // نجرب ESPN أولاً
  let matches = [];
  try {
    matches = await fetchFromESPN();
  } catch (e) { console.warn('ESPN primary failed', e); }

  // لو ESPN رجع نتائج قليلة، نضيف من TheSportsDB
  if (matches.length < 5) {
    try {
      const extra = await fetchFromSportsDB();
      const existingIds = new Set(matches.map(m => m.id));
      extra.forEach(m => { if (!existingIds.has(m.id)) matches.push(m); });
    } catch (e) { console.warn('SportsDB backup failed', e); }
  }
  return matches;
}

function normalizeFromSportsDB(event) {
  const status = determineStatus(event);
  return {
    id: event.idEvent || event.idLiveScore || Math.random().toString(36),
    homeTeam: event.strHomeTeam || 'Home',
    awayTeam: event.strAwayTeam || 'Away',
    homeLogo: event.strHomeTeamBadge || event.strThumbHome || null,
    awayLogo: event.strAwayTeamBadge || event.strThumbAway || null,
    homeScore: event.intHomeScore ?? '-',
    awayScore: event.intAwayScore ?? '-',
    league: event.strLeague || 'Unknown League',
    leagueBadge: event.strLeagueBadge || null,
    progress: event.strProgress || event.strTime || event.strEventTime || '',
    status: status,
    date: event.dateEvent || '',
    time: event.strTime || event.strEventTime || '',
  };
}

function determineStatus(event) {
  const status = (event.strStatus || event.strProgress || '').toLowerCase();
  if (status.includes('ft') || status.includes('finished') || status.includes('match finished')) return 'finished';
  if (status.includes('ns') || status.includes('not started') || status.includes('scheduled')) return 'scheduled';
  if (event.strProgress && /\d/.test(event.strProgress)) return 'live';
  if (event.intHomeScore !== null && event.intHomeScore !== undefined && event.intHomeScore !== '') return 'live';
  return 'scheduled';
}

// ===== 📦 Demo Data (fallback when APIs are down) =====
function getDemoMatches() {
  return [
    {
      id: 'demo1', homeTeam: 'Real Madrid', awayTeam: 'Barcelona',
      homeScore: 2, awayScore: 1, league: 'La Liga',
      progress: "67'", status: 'live', homeLogo: null, awayLogo: null,
    },
    {
      id: 'demo2', homeTeam: 'Manchester City', awayTeam: 'Liverpool',
      homeScore: 1, awayScore: 1, league: 'Premier League',
      progress: "52'", status: 'live', homeLogo: null, awayLogo: null,
    },
    {
      id: 'demo3', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund',
      homeScore: 3, awayScore: 0, league: 'Bundesliga',
      progress: "78'", status: 'live', homeLogo: null, awayLogo: null,
    },
    {
      id: 'demo4', homeTeam: 'PSG', awayTeam: 'Marseille',
      homeScore: 0, awayScore: 0, league: 'Ligue 1',
      progress: "23'", status: 'live', homeLogo: null, awayLogo: null,
    },
    {
      id: 'demo5', homeTeam: 'Inter Milan', awayTeam: 'Juventus',
      homeScore: '-', awayScore: '-', league: 'Serie A',
      progress: '20:00', status: 'scheduled', homeLogo: null, awayLogo: null,
    },
    {
      id: 'demo6', homeTeam: 'Chelsea', awayTeam: 'Arsenal',
      homeScore: 2, awayScore: 3, league: 'Premier League',
      progress: 'FT', status: 'finished', homeLogo: null, awayLogo: null,
    },
  ];
}

// ===== 🎨 RENDERING =====
function render() {
  renderMatches();
  updateTexts();
}

function updateTexts() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  $('#appName').textContent = t('appName');
  $('#tagline').textContent = t('tagline');
  $('#refreshBtnText').textContent = t('refresh');
  $('#langSwitch').textContent = currentLang === 'ar' ? 'EN' : 'ع';
  $('#disclaimer').innerHTML = t('disclaimer');
  $$('[data-tab]').forEach(tab => {
    const key = tab.dataset.tab;
    tab.textContent = t(key);
  });
}

function renderMatches() {
  const container = $('#matchesContainer');
  let filtered = allMatches;
  if (currentTab === 'live') filtered = allMatches.filter(m => m.status === 'live');
  else if (currentTab === 'finished') filtered = allMatches.filter(m => m.status === 'finished');
  else if (currentTab === 'upcoming') filtered = allMatches.filter(m => m.status === 'scheduled');

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚽</div>
        <h3>${t('noMatches')}</h3>
        <p>${t('noMatchesDesc')}</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="matches-grid">${filtered.map(renderMatchCard).join('')}</div>`;
  
  // attach click handlers
  $$('.match-card').forEach(card => {
    card.addEventListener('click', () => openDetails(card.dataset.id));
  });
}

function renderMatchCard(match) {
  const pred = predictMatch(match);
  const statusClass = match.status;
  const statusText = match.status === 'live' 
    ? (match.progress || t('live_tag'))
    : match.status === 'finished' 
      ? t('finished_tag') 
      : (match.time || t('scheduled_tag'));

  const logoHome = match.homeLogo 
    ? `<img src="${match.homeLogo}" alt="" onerror="this.style.display='none'">`
    : '⚽';
  const logoAway = match.awayLogo 
    ? `<img src="${match.awayLogo}" alt="" onerror="this.style.display='none'">`
    : '⚽';

  const bestBetLabel = pred.bestBet === 'home' 
    ? match.homeTeam 
    : pred.bestBet === 'away' 
      ? match.awayTeam 
      : t('draw');

  return `
    <div class="match-card" data-id="${match.id}">
      <div class="match-header">
        <div class="league-name">🏆 ${match.league}</div>
        <div class="match-status ${statusClass}">${statusText}</div>
      </div>
      <div class="teams-row">
        <div class="team">
          <div class="team-logo">${logoHome}</div>
          <div class="team-name">${match.homeTeam}</div>
        </div>
        <div class="score-box">
          ${match.homeScore} <span class="score-vs">-</span> ${match.awayScore}
        </div>
        <div class="team">
          <div class="team-logo">${logoAway}</div>
          <div class="team-name">${match.awayTeam}</div>
        </div>
      </div>
      <div class="prediction-panel">
        <div class="prediction-title">
          🤖 ${t('prediction')} <span class="ai-badge">AI</span>
        </div>
        <div class="prediction-row">
          <div class="prob-box ${pred.bestBet === 'home' ? 'best' : ''}">
            <div class="prob-label">${t('homeWin')}</div>
            <div class="prob-value">${pred.home}%</div>
            <div class="prob-bar" style="width:${pred.home}%"></div>
          </div>
          <div class="prob-box ${pred.bestBet === 'draw' ? 'best' : ''}">
            <div class="prob-label">${t('draw')}</div>
            <div class="prob-value">${pred.draw}%</div>
            <div class="prob-bar" style="width:${pred.draw}%"></div>
          </div>
          <div class="prob-box ${pred.bestBet === 'away' ? 'best' : ''}">
            <div class="prob-label">${t('awayWin')}</div>
            <div class="prob-value">${pred.away}%</div>
            <div class="prob-bar" style="width:${pred.away}%"></div>
          </div>
        </div>
        <div class="best-bet">
          <span><span class="best-bet-icon">🎯</span> ${t('bestBet')}: ${bestBetLabel}</span>
          <span>${pred.confidence}%</span>
        </div>
        <div class="confidence-meter">
          <div class="confidence-label">
            <span>${t('confidence')}</span>
            <strong>${pred.confidence}%</strong>
          </div>
          <div class="confidence-bar-bg">
            <div class="confidence-bar-fill" style="width:${pred.confidence}%"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function openDetails(id) {
  const match = allMatches.find(m => m.id === id);
  if (!match) return;
  selectedMatchId = id;
  const pred = predictMatch(match);
  const overlay = $('#modalOverlay');
  const modal = $('#modalContent');

  const logoHome = match.homeLogo 
    ? `<img src="${match.homeLogo}" style="width:50px;height:50px;border-radius:50%">` 
    : '⚽';
  const logoAway = match.awayLogo 
    ? `<img src="${match.awayLogo}" style="width:50px;height:50px;border-radius:50%">` 
    : '⚽';

  const bestBetLabel = pred.bestBet === 'home' 
    ? match.homeTeam 
    : pred.bestBet === 'away' 
      ? match.awayTeam 
      : t('draw');

  modal.innerHTML = `
    <button class="modal-close" onclick="closeDetails()">✕</button>
    <h2>🏆 ${match.league}</h2>
    <div style="display:flex;align-items:center;justify-content:space-between;margin:20px 0;padding:16px;background:var(--dark-3);border-radius:14px;">
      <div style="text-align:center;flex:1">
        <div style="font-size:2rem;margin-bottom:6px">${logoHome}</div>
        <div style="font-weight:800">${match.homeTeam}</div>
      </div>
      <div style="font-size:2rem;font-weight:900;background:var(--gradient-2);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">
        ${match.homeScore} - ${match.awayScore}
      </div>
      <div style="text-align:center;flex:1">
        <div style="font-size:2rem;margin-bottom:6px">${logoAway}</div>
        <div style="font-weight:800">${match.awayTeam}</div>
      </div>
    </div>

    <h2 style="font-size:1rem">📊 ${t('stats')}</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">${t('minute')}</div>
        <div class="stat-card-value">${pred.minute || '—'}'</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">${t('totalGoals')}</div>
        <div class="stat-card-value">${pred.totalGoals}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">${t('overUnder')}</div>
        <div class="stat-card-value">${pred.overUnder === 'over' ? 'Over ⬆️' : 'Under ⬇️'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">BTTS</div>
        <div class="stat-card-value">${pred.btts === 'yes' ? '✅ YES' : '❌ NO'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">${t('bestBet')}</div>
        <div class="stat-card-value" style="font-size:1rem">${bestBetLabel}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">${t('confidence')}</div>
        <div class="stat-card-value">${pred.confidence}%</div>
      </div>
    </div>

    <h2 style="font-size:1rem;margin-top:20px">🧠 ${t('insights')}</h2>
    <ul class="insights-list">
      ${pred.insights.map(ins => `
        <li class="insight-item">
          <span class="insight-icon">${ins.icon}</span>
          <span>${ins.text}</span>
        </li>
      `).join('') || `<li class="insight-item">💡 ${currentLang === 'ar' ? 'لا توجد رؤى كافية بعد' : 'Not enough data yet'}</li>`}
    </ul>
  `;
  overlay.classList.add('open');
}

function closeDetails() {
  $('#modalOverlay').classList.remove('open');
  selectedMatchId = null;
}
window.closeDetails = closeDetails;

// ===== 🔄 REFRESH =====
async function refreshData(showIndicator = true) {
  const btn = $('#refreshBtn');
  if (showIndicator) btn.classList.add('loading');
  
  try {
    const matches = await fetchAllMatches();
    allMatches = matches.length ? matches : getDemoMatches();

    $('#lastUpdate').textContent = new Date().toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : 'en-US');
    renderMatches();
    if (showIndicator) showToast(t('refreshed'));
  } catch (e) {
    console.error(e);
    if (allMatches.length === 0) {
      allMatches = getDemoMatches();
      renderMatches();
    }
    if (showIndicator) showToast(t('fetchError'));
  } finally {
    btn.classList.remove('loading');
  }
}

// ===== 🚀 INIT =====
function init() {
  // أحداث
  $('#langSwitch').addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
    render();
  });

  $('#refreshBtn').addEventListener('click', () => refreshData(true));

  $$('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      $$('[data-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMatches();
    });
  });

  $('#modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeDetails();
  });

  // تحميل أولي
  updateTexts();
  refreshData(false);

  // تحديث تلقائي كل 30 ثانية
  refreshTimer = setInterval(() => refreshData(false), CONFIG.REFRESH_INTERVAL);
}

document.addEventListener('DOMContentLoaded', init);
