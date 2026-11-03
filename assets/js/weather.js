/* Live San Francisco weather for the side banner.
   Fetches current conditions from Open-Meteo (free, no key; only SF's
   fixed coordinates are sent) and maps them to:
   - fog thickness  <- fog code, visibility, humidity, cloud cover
   - fog drift speed <- wind speed
   - photo tint      <- golden hour / rain (day vs night follows the site theme)
   - a short live line: "San Francisco · 61°F · Foggy · 4:12 PM"
   Preview any look with ?wx=fog | clear | golden | rain.
   On any failure the banner keeps its default look. */
(function () {
  const side = document.querySelector('.side');
  if (!side) return;
  const line = document.querySelector('.side-foot');
  const fog = window.__fog = window.__fog || { density: 1, speed: 1, bright: 1 };
  const TZ = 'America/Los_Angeles';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const URL_ = 'https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194'
    + '&current=temperature_2m,relative_humidity_2m,cloud_cover,visibility,weather_code,is_day,wind_speed_10m'
    + '&daily=sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FLos_Angeles&forecast_days=1';

  function describe(c, foggy, day) {
    if (foggy) return 'Foggy';
    if (c === 0) return day ? 'Sunny' : 'Clear';
    if (c === 1) return day ? 'Mostly sunny' : 'Mostly clear';
    if (c === 2) return 'Partly cloudy';
    if (c === 3) return 'Overcast';
    if (c >= 51 && c <= 57) return 'Drizzle';
    if ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) return 'Rain';
    if (c >= 71 && c <= 77) return 'Snow';
    if (c >= 95) return 'Thunderstorms';
    return 'Cloudy';
  }

  function apply(w) {
    const cur = w.current;
    const code = cur.weather_code;
    const vis = cur.visibility ?? 20000;
    const hum = cur.relative_humidity_2m ?? 70;
    const cloud = cur.cloud_cover ?? 50;
    const foggy = code === 45 || code === 48 || vis < 4000 || (hum > 93 && cloud > 80);

    // fog thickness: 0.9 (clear) … 1.6 (socked in); the floor keeps the drift visible on clear days
    const score = foggy ? 1 : clamp(0.45 * (1 - vis / 24000) + 0.3 * clamp((hum - 55) / 40, 0, 1) + 0.25 * cloud / 100, 0, 1);
    fog.density = 0.9 + 0.7 * score;
    fog.speed = clamp(0.55 + (cur.wind_speed_10m ?? 6) / 12, 0.5, 2.2);

    // time of day in SF
    const now = new Date(cur.time);                       // local SF time string, parsed as local clock
    const rise = new Date(w.daily.sunrise[0]), set = new Date(w.daily.sunset[0]);
    const near = (a, b) => Math.abs(a - b) < 50 * 60 * 1000;
    const golden = near(now, rise) || near(now, set);
    const wet = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
    const html = document.documentElement;
    html.classList.remove('wx-night'); side.classList.remove('wx-night');   // the theme toggle owns day / night
    ['wx-golden', 'wx-wet'].forEach((c, i) => html.classList.toggle(c, [golden, wet][i]));
    try { localStorage.setItem('ht-wx', JSON.stringify({ t: Date.now(), golden, wet, density: fog.density, speed: fog.speed, bright: golden ? 0.98 : 1 })); } catch (e) {}
    side.classList.toggle('wx-golden', golden);
    side.classList.toggle('wx-wet', wet);
    fog.bright = golden ? 0.98 : 1;
    if (fog.redraw) fog.redraw();

    if (line) {
      const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
      line.textContent = `San Francisco · ${Math.round(cur.temperature_2m)}°F · ${describe(code, foggy, cur.is_day)} · ${time}`;
      line.title = 'Live conditions in San Francisco; the fog and light follow them.';
    }
  }

  // ?wx=… presets for previewing each look
  const PRESETS = {
    fog:    { temperature_2m: 57, relative_humidity_2m: 97, cloud_cover: 100, visibility: 900,   weather_code: 45, is_day: 1, wind_speed_10m: 12 },
    clear:  { temperature_2m: 72, relative_humidity_2m: 45, cloud_cover: 0,   visibility: 24000, weather_code: 0,  is_day: 1, wind_speed_10m: 4 },
    golden: { temperature_2m: 60, relative_humidity_2m: 75, cloud_cover: 30,  visibility: 18000, weather_code: 1,  is_day: 1, wind_speed_10m: 6, golden: true },
    rain:   { temperature_2m: 55, relative_humidity_2m: 92, cloud_cover: 100, visibility: 6000,  weather_code: 63, is_day: 1, wind_speed_10m: 15 },
  };
  const want = new URLSearchParams(location.search).get('wx');
  if (want && PRESETS[want]) {
    const p = PRESETS[want], base = new Date();
    const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    apply({ current: { ...p, time: iso(base) }, daily: { sunrise: [iso(new Date(base - (p.golden ? 10 : 400) * 60000))], sunset: [iso(new Date(+base + 400 * 60000))] } });
    return;
  }

  // transitions only after the first paint, so page changes don't flash
  setTimeout(() => document.documentElement.classList.add('wx-ready'), 600);
  fetch(URL_).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(apply).catch(() => {});
  // refresh every 15 minutes while the page is open
  setInterval(() => { if (!document.hidden) fetch(URL_).then(r => r.json()).then(apply).catch(() => {}); }, 15 * 60 * 1000);
})();
