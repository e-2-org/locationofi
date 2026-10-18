/**
 * location.js
 * shared code for the Location of I archive: loads the recorded locations,
 * makes the map and draws a track of points on it.
 * Times are UTC throughout, as on the original site.
 */
import {LeafletMap, TileLayer, LayerGroup, Control, Icon, Marker, Polyline, CircleMarker} from '../vendor/leaflet/leaflet.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const LINE_COLOUR = '#ff0000';

const pad = n => String(n).padStart(2, '0');

/* "Thursday, April 19, 2007 15:53:05", the format the original site used for "location last updated" */
export function formatLong(ms) {
    const d = new Date(ms);
    return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${formatTime(ms)}`;
}
export function formatTime(ms) {
    const d = new Date(ms);
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
/* "Thursday 19 April 2007" from a day key ("2007-04-19") */
export function formatDay(key) {
    const d = new Date(key + 'T00:00:00Z');
    return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function monthName(m) {
    return MONTHS[m];
}
/* "2007-04-19T15:53:05", used in links to a moment in the replay */
export function isoMinute(ms) {
    return new Date(ms).toISOString().slice(0, 19);
}

/**
 * loads data/locations.csv (id,utc,lat,lng, sorted by time) into typed arrays,
 * and groups the points into UTC days
 */
export async function loadLocations(url = 'data/locations.csv') {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load ${url} (${response.status})`);
    }
    const lines = (await response.text()).trim().split('\n').slice(1);
    const n = lines.length;
    const data = {
        n,
        id: new Uint32Array(n),
        t: new Float64Array(n),
        lat: new Float64Array(n),
        lng: new Float64Array(n),
        /* [{key: "2007-04-19", start, end}], end is exclusive */
        days: []
    };
    for (let i = 0; i < n; i++) {
        const [id, utc, lat, lng] = lines[i].split(',');
        data.id[i] = +id;
        data.t[i] = Date.parse(utc);
        data.lat[i] = +lat;
        data.lng[i] = +lng;
        const key = utc.slice(0, 10);
        const last = data.days[data.days.length - 1];
        if (last && last.key === key) {
            last.end = i + 1;
        } else {
            data.days.push({key, start: i, end: i + 1});
        }
    }
    data.dayByKey = new Map(data.days.map(d => [d.key, d]));
    return data;
}

/* index of the last point recorded at or before ms (-1 if none) */
export function indexAt(data, ms) {
    let lo = 0, hi = data.n - 1, found = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (data.t[mid] <= ms) {
            found = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return found;
}

/* the day containing point i */
export function dayOf(data, i) {
    let lo = 0, hi = data.days.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (data.days[mid].start <= i) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    return data.days[lo];
}

export function latLng(data, i) {
    return [data.lat[i], data.lng[i]];
}

/**
 * makes the map. The original used Google's hybrid, satellite and map types;
 * these are the nearest freely available equivalents.
 */
export function makeMap(el, {base = 'Hybrid', controls = true} = {}) {
    const map = new LeafletMap(el, {
        zoomControl: controls,
        /* lines and dots are drawn as SVG: in Leaflet 2.0.0-alpha.1 the
           canvas renderer is left blank after an animated zoom */
        center: [50, 0],
        zoom: 3
    });
    const esri = path => new TileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${path}/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 19,
        maxNativeZoom: 18,
        attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics and the GIS User Community'
    });
    const bases = {
        Map: new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        Satellite: esri('World_Imagery'),
        Hybrid: new LayerGroup([
            esri('World_Imagery'),
            esri('Reference/World_Transportation'),
            esri('Reference/World_Boundaries_and_Places')
        ])
    };
    bases[base].addTo(map);
    if (controls) {
        new Control.Layers(bases, null, {position: 'topright'}).addTo(map);
    }
    new Control.Scale({maxWidth: 200}).addTo(map);
    return map;
}

/* writes the latitude and longitude under the pointer into el */
export function trackPointer(map, el) {
    map.on('pointermove', e => {
        el.textContent = `${e.latlng.lat.toFixed(6)} / ${e.latlng.lng.toFixed(6)}`;
    });
}

/* the original marker images */
export const icons = {
    current: new Icon({
        iconUrl: 'img/marker.png',
        iconSize: [20, 34],
        iconAnchor: [10, 33],
        shadowUrl: 'img/mm_20_shadow.png',
        shadowSize: [37, 34],
        popupAnchor: [0, -30],
        tooltipAnchor: [8, -20]
    }),
    small: new Icon({
        iconUrl: 'img/mm_20_red.png',
        iconSize: [12, 20],
        iconAnchor: [6, 19],
        shadowUrl: 'img/mm_20_shadow.png',
        shadowSize: [22, 20],
        popupAnchor: [0, -17],
        tooltipAnchor: [5, -12]
    })
};

/* the info window text, as on the original site, plus the date */
export function pointHTML(data, i) {
    return `<p><span class="label">date:</span> ${formatDay(new Date(data.t[i]).toISOString().slice(0, 10))}</p>`
        + `<p><span class="label">time:</span> ${formatTime(data.t[i])} UTC</p>`
        + `<p><span class="label">lat:</span> ${data.lat[i]}</p>`
        + `<p><span class="label">lng:</span> ${data.lng[i]}</p>`;
}

/**
 * Track
 * draws points from..to-1 as a red line with a dot for each point, and a
 * marker on the last one. show() can be called repeatedly; when the range only
 * grows at the end, just the new points are added.
 */
export class Track {
    constructor(map, data, {lastIcon = icons.current} = {}) {
        this.map = map;
        this.data = data;
        this.group = new LayerGroup().addTo(map);
        this.line = new Polyline([], {color: LINE_COLOUR, weight: 3, opacity: 0.8, interactive: false}).addTo(this.group);
        this.dots = new LayerGroup().addTo(this.group);
        this.last = new Marker([0, 0], {icon: lastIcon, zIndexOffset: 1000});
        this.last.bindPopup(() => pointHTML(data, this.to - 1));
        this.last.bindTooltip(() => formatTime(data.t[this.to - 1]));
        this.from = 0;
        this.to = 0;
    }
    show(from, to) {
        const data = this.data;
        if (from !== this.from || to < this.to) {
            this.dots.clearLayers();
            this.line.setLatLngs([]);
            this.from = this.to = from;
        }
        for (let i = this.to; i < to; i++) {
            const dot = new CircleMarker(latLng(data, i), {
                radius: 3,
                color: '#7a0000',
                weight: 1,
                fillColor: LINE_COLOUR,
                fillOpacity: 1
            });
            dot.bindPopup(() => pointHTML(data, i));
            dot.bindTooltip(formatTime(data.t[i]));
            this.dots.addLayer(dot);
            this.line.addLatLng(latLng(data, i));
        }
        this.to = to;
        if (to > from) {
            this.last.setLatLng(latLng(data, to - 1));
            if (!this.group.hasLayer(this.last)) {
                this.group.addLayer(this.last);
            }
            if (this.last.isPopupOpen()) {
                this.last.setPopupContent(pointHTML(data, to - 1));
            }
        } else {
            this.group.removeLayer(this.last);
        }
    }
    bounds() {
        return this.line.getBounds();
    }
    clear() {
        this.show(0, 0);
    }
}
