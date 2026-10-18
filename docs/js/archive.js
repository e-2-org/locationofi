/**
 * archive.js
 * the archive page: a calendar of every day with recorded locations. Choosing
 * a day shows its route, as the original archive did; with no day chosen the
 * whole project is shown as one line.
 */
import {FeatureGroup, Polyline, Popup} from '../vendor/leaflet/leaflet.js';
import {loadLocations, makeMap, trackPointer, Track, icons, latLng, formatDay, formatTime, monthName, isoMinute, LINE_COLOUR} from './location.js';

const $ = id => document.getElementById(id);

const map = makeMap($('div_map'), {base: 'Hybrid'});
trackPointer(map, $('latLngTrack'));

const data = await loadLocations();
const track = new Track(map, data, {lastIcon: icons.small});
const allLatLngs = Array.from({length: data.n}, (_, i) => latLng(data, i));
/* the whole project as one line, with a wider invisible copy on top that's easier to click */
const everythingHit = new Polyline(allLatLngs, {weight: 14, opacity: 0});
const everything = new FeatureGroup([
    new Polyline(allLatLngs, {color: LINE_COLOUR, weight: 2, opacity: 0.8, interactive: false}),
    everythingHit
]);
const nearestPopup = new Popup();
buildCalendar();
addEventListener('hashchange', route);
route();

function route() {
    const key = location.hash.slice(1);
    const day = data.dayByKey.get(key);
    for (const a of $('calendar').querySelectorAll('[aria-current]')) {
        a.removeAttribute('aria-current');
    }
    map.closePopup();
    if (day) {
        showDay(day);
    } else {
        showAll();
    }
}

function showDay(day) {
    everything.remove();
    track.show(day.start, day.end);
    map.fitBounds(track.bounds(), {padding: [30, 30], maxZoom: 16});
    const index = data.days.indexOf(day);
    const prev = data.days[index - 1];
    const next = data.days[index + 1];
    const count = day.end - day.start;
    $('dayinfo').innerHTML = `<h3>${formatDay(day.key)}</h3>`
        + `<p>${count} location${count === 1 ? '' : 's'}, ${formatTime(data.t[day.start])} to ${formatTime(data.t[day.end - 1])} UTC</p>`
        + '<ul class="links">'
        + (prev ? `<li>[<a href="#${prev.key}">previous day</a>]</li>` : '')
        + (next ? `<li>[<a href="#${next.key}">next day</a>]</li>` : '')
        + `<li>[<a href="index.html#${isoMinute(data.t[day.start])}">replay this day</a>]</li>`
        + '<li>[<a href="#">all days</a>]</li>'
        + '</ul>';
    const link = $('calendar').querySelector(`a[href="#${day.key}"]`);
    link.setAttribute('aria-current', 'date');
    /* scroll the calendar (not the page) so the day is in view */
    const box = $('calendar').getBoundingClientRect();
    const cell = link.getBoundingClientRect();
    if (cell.top < box.top || cell.bottom > box.bottom) {
        $('calendar').scrollTop += cell.top - box.top - box.height / 2;
    }
    document.title = `${formatDay(day.key)} - Location of I, Martin John Callanan`;
}

function showAll() {
    track.clear();
    everything.addTo(map);
    map.fitBounds(everything.getBounds(), {padding: [20, 20]});
    $('dayinfo').innerHTML = `<h3>${formatDay(data.days[0].key)} to ${formatDay(data.days[data.days.length - 1].key)}</h3>`
        + `<p>${data.n.toLocaleString('en-GB')} locations on ${data.days.length} days. Choose a day from the calendar, or click the line to find the day it was recorded.</p>`;
    document.title = 'Archive - Location of I, Martin John Callanan';
}

/* clicking the whole-project line finds the nearest recorded location */
everythingHit.on('click', e => {
    const p = map.latLngToContainerPoint(e.latlng);
    let best = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < data.n; i++) {
        const q = map.latLngToContainerPoint(latLng(data, i));
        const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
        if (d < bestDistance) {
            best = i;
            bestDistance = d;
        }
    }
    const key = new Date(data.t[best]).toISOString().slice(0, 10);
    nearestPopup
        .setLatLng(latLng(data, best))
        .setContent(`<p>${formatDay(key)}<br />${formatTime(data.t[best])} UTC</p><p>[<a href="#${key}">show this day</a>]</p>`)
        .openOn(map);
});

/* one small month grid for each month from the first day to the last, Monday first */
function buildCalendar() {
    const max = Math.max(...data.days.map(d => d.end - d.start));
    const first = new Date(data.days[0].key + 'T00:00:00Z');
    const last = new Date(data.days[data.days.length - 1].key + 'T00:00:00Z');
    let html = '';
    for (let m = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1)); m <= last; m.setUTCMonth(m.getUTCMonth() + 1)) {
        const year = m.getUTCFullYear();
        const month = m.getUTCMonth();
        const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const blanks = (m.getUTCDay() + 6) % 7;
        html += `<section class="month"><h4>${monthName(month)} ${year}</h4><div class="days">`;
        html += ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<b aria-hidden="true">${d}</b>`).join('');
        html += '<span></span>'.repeat(blanks);
        for (let d = 1; d <= length; d++) {
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const day = data.dayByKey.get(key);
            if (day) {
                const count = day.end - day.start;
                const level = Math.min(4, Math.ceil(Math.sqrt(count / max) * 4));
                html += `<a href="#${key}" class="level${level}" title="${count} location${count === 1 ? '' : 's'}" aria-label="${formatDay(key)}, ${count} location${count === 1 ? '' : 's'}">${d}</a>`;
            } else {
                html += `<span>${d}</span>`;
            }
        }
        html += '</div></section>';
    }
    $('calendar').innerHTML = html;
}
