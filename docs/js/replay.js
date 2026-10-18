/**
 * replay.js
 * the "current location" page and the gallery (kiosk) page. The live site
 * showed the latest day's locations and the current position, updating as new
 * locations arrived. Here the same view is replayed from the archive: the
 * replay clock stands in for "now".
 */
import {loadLocations, makeMap, trackPointer, Track, indexAt, dayOf, latLng, formatLong, isoMinute} from './location.js';

/* data milliseconds per real millisecond */
const SPEEDS = {
    '1 minute': 60,
    '10 minutes': 600,
    '1 hour': 3600,
    '6 hours': 21600,
    '1 day': 86400
};
/* while playing, a wait for the next location longer than this (real ms) is cut short */
const MAX_WAIT = 1500;

export async function startReplay({kiosk = false} = {}) {
    const $ = id => document.getElementById(id);
    const map = makeMap($('div_map'), {base: kiosk ? 'Satellite' : 'Hybrid', controls: !kiosk});
    if (!kiosk) {
        trackPointer(map, $('latLngTrack'));
    }

    const data = await loadLocations();
    const t0 = data.t[0];
    const tEnd = data.t[data.n - 1];
    const track = new Track(map, data);

    const play = $('play');
    const slider = $('timeline');
    const speed = $('speed');
    const clockText = $('clock');

    let clock = tEnd;
    let shown = -1;
    let shownDay = null;
    let playing = false;
    let lastFrame = null;

    /* draw the map for the current clock */
    function render(follow) {
        const i = indexAt(data, clock);
        if (slider) {
            slider.value = Math.round((clock - t0) / 60000);
            slider.setAttribute('aria-valuetext', formatLong(clock));
        }
        if (clockText) {
            clockText.textContent = formatLong(clock).slice(0, -3);
        }
        if (i === shown) {
            return;
        }
        shown = i;
        const day = dayOf(data, i);
        const newDay = day !== shownDay;
        shownDay = day;
        track.show(day.start, i + 1);
        $('lastUpdateTrack').textContent = formatLong(data.t[i]);
        if (follow) {
            const here = latLng(data, i);
            if (!map.getBounds().pad(-0.15).contains(here)) {
                const far = map.distance(map.getCenter(), here) > 100000;
                map.setView(here, map.getZoom(), {animate: !far});
            }
        } else if (newDay || !map.getBounds().contains(latLng(data, i))) {
            fitDay();
        }
    }

    function fitDay() {
        map.fitBounds(track.bounds(), {padding: [30, 30], maxZoom: 16, animate: false});
    }

    function frame(now) {
        if (!playing) {
            return;
        }
        const step = SPEEDS[speed ? speed.value : '1 hour'];
        clock += (lastFrame === null ? 0 : Math.min(now - lastFrame, 100)) * step;
        lastFrame = now;
        const next = indexAt(data, clock) + 1;
        if (next >= data.n) {
            if (kiosk) {
                restart();
            } else {
                clock = tEnd;
                pause();
            }
        } else if ((data.t[next] - clock) / step > MAX_WAIT) {
            clock = data.t[next] - (MAX_WAIT / 3) * step;
        }
        render(true);
        requestAnimationFrame(frame);
    }

    function restart() {
        clock = t0;
        shownDay = null;
        render(false);
        map.setView(latLng(data, 0), 15, {animate: false});
    }

    function start() {
        if (clock >= tEnd) {
            restart();
        }
        playing = true;
        lastFrame = null;
        if (play) {
            play.textContent = 'pause';
            play.setAttribute('aria-pressed', 'true');
        }
        requestAnimationFrame(frame);
    }

    function pause() {
        playing = false;
        if (play) {
            play.textContent = 'play';
            play.setAttribute('aria-pressed', 'false');
        }
        saveHash();
    }

    function saveHash() {
        if (!kiosk) {
            history.replaceState(null, '', clock >= tEnd ? location.pathname : '#' + isoMinute(clock));
        }
    }

    /* #2007-05-14T12:00:00 opens the replay at that moment */
    function readHash() {
        const ms = Date.parse(location.hash.slice(1) + 'Z');
        clock = Number.isNaN(ms) ? tEnd : Math.min(Math.max(ms, t0), tEnd);
        shownDay = null;
        render(false);
    }

    if (slider) {
        slider.min = 0;
        slider.max = Math.ceil((tEnd - t0) / 60000);
        slider.addEventListener('input', () => {
            clock = t0 + slider.value * 60000;
            render(playing);
        });
        slider.addEventListener('change', () => {
            if (!playing) {
                saveHash();
            }
        });
        drawDensity($('density'), data);
        new ResizeObserver(() => drawDensity($('density'), data)).observe($('density'));
    }
    if (play) {
        play.disabled = false;
        play.addEventListener('click', () => (playing ? pause() : start()));
    }
    if (speed) {
        speed.innerHTML = Object.keys(SPEEDS).map(s => `<option${s === '1 hour' ? ' selected' : ''}>${s}</option>`).join('');
    }
    addEventListener('hashchange', readHash);

    if (kiosk) {
        restart();
        start();
    } else {
        readHash();
    }
}

/**
 * draws the number of locations recorded each day as a bar chart behind the
 * timeline slider, with the years marked
 */
function drawDensity(canvas, data) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const ratio = devicePixelRatio || 1;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    const t0 = data.t[0];
    const span = data.t[data.n - 1] - t0;
    const x = ms => ((ms - t0) / span) * w;
    const max = Math.max(...data.days.map(d => d.end - d.start));
    const barHeight = h - 14;
    ctx.fillStyle = '#ff0000';
    for (const day of data.days) {
        const left = x(Date.parse(day.key + 'T00:00:00Z'));
        const bar = Math.max(1, Math.sqrt((day.end - day.start) / max) * barHeight);
        ctx.fillRect(left, barHeight - bar, Math.max(1, x(t0 + 86400000) - x(t0)), bar);
    }
    ctx.fillStyle = '#333';
    ctx.font = '10px "Courier New", Courier, monospace';
    for (let year = 2008; year <= 2009; year++) {
        const left = Math.round(x(Date.UTC(year, 0, 1))) + 0.5;
        ctx.fillRect(left, 0, 1, h);
        const label = String(year);
        const fits = left + 3 + ctx.measureText(label).width <= w;
        ctx.fillText(label, fits ? left + 3 : left - 3 - ctx.measureText(label).width, h - 2);
    }
    ctx.fillText('2007', 2, h - 2);
}
