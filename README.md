# Location of I

*Location of I* by Martin John Callanan: his physical location, recorded by a GPS phone and published online as it happened, from April 2007 to January 2009. Commissioned by RIXC (Riga Centre for New Media Culture). The original site was built by Peter Edwards. More about the work: <https://greyisgood.eu/location/>.

This repo holds the original site and an archive version of it.

- **The repo root** is the original PHP and MySQL site, left as it was except that `includes/config.php` has been removed, because it held the database passwords. To run the original code again, it would need a new `includes/config.php` that sets `$config` (Google Maps key, database connection and table name). The site used Google Maps API v2.
- **`docs/`** is the archive version, a static site published with GitHub Pages. It uses [Leaflet 2](https://leafletjs.com/).

## The archive site

| Page | What it does |
| --- | --- |
| `index.html` | **current location**. It opens on the last location ever recorded, as the live page showed it when the feed stopped. Play, or drag the timeline, to replay the whole project as the live page would have shown it: that day's route so far, with the latest position marked. The timeline also charts how many locations were recorded each day. A link like `index.html#2007-05-14T15:00:00` opens the replay at that moment. |
| `archive.html` | **archive**. A calendar of the 601 days with recorded locations, shaded by how many there were. Choosing a day shows its route, and clicking a point shows its time and coordinates, as in the original archive. With no day chosen, it shows the whole project as one line, and clicking the line finds the day. A link like `archive.html#2007-05-14` opens that day. |
| `kiosk.html` | **gallery version**. A full-screen map with no controls that replays the project in a loop, for showing in a gallery. The original called this `gallery.html` and `kiosk.html`. |
| `data/locations.csv` | Every recorded location: `id` (from the original database), `utc`, `lat`, `lng`. |

- **Leaflet** `2.0.0-alpha.1` is copied into `docs/vendor/leaflet/`, so the site doesn't depend on a CDN. This was the newest Leaflet 2 release when the site was built.
  - Its canvas renderer leaves paths blank after an animated zoom, so the site uses the SVG renderer.
  - Check this again before upgrading.
- **Base maps:** satellite and hybrid use Esri World Imagery and Esri's reference overlays; the plain map is OpenStreetMap. These replace Google's hybrid, satellite and map types.
- **Markers:** the current-position marker and small red marker are the original images, in `docs/img/`.

### Not carried over

- **Live updates.** The feed came from locatea.net, which no longer exists. The replay stands in for them.
- **The snippet** (`snippet.html`, `js/snippet.js`), which showed the current coordinates as text for embedding in other pages.
- **The overview map control and marker clustering.** Locations are drawn as small dots instead of clustered pins.

## The data

`dump.xml` at the root is the last export of the database. `tools/build-data.py` turns it into `docs/data/locations.csv`:

```bash
python3 tools/build-data.py
```

- **Count:** 38,816 locations, from 19 April 2007 15:53 to 27 January 2009 08:41 (UTC).
  - The artist's site says the work ran until July 2009, but there is no data after January 2009 here. The feed probably stopped then, because the tracking service either stopped working or was no longer paid for.
  - `location.sql` is an earlier export, from March 2008, with nothing that isn't in `dump.xml`.
- **Times:** the date and time recorded with each location are taken to be UTC, as the project spec asked. The site was moved to a new server at the end of March 2008, and the two servers turned those times into timestamps differently:
  - The first server ran on UK time, so its timestamps for summer dates are an hour off (British Summer Time).
  - The second server ran on UTC.
  - The script ignores the stored timestamps and uses the recorded date and time.
  - The data can't show whether locatea sent UTC or UK clock time. If it was UK time, summer times on the archive are an hour later than UTC.
- **Duplicates:** six locations from 30 and 31 March 2008 were stored by both servers. The script keeps one copy of each.
- **Gaps:** most days before April 2008 have a location every minute or two. After that, locations are much sparser.

## Testing

Tested in headless Chrome at 1100×900 and 390×844, served from `/location/`. The tests covered:

- every page, with no script errors or failed requests
- playing, pausing, speed changes, the timeline and links to a moment
- the calendar, previous and next day, popups, and clicking the whole-project line
- zooming
- the phone layout

Not tested in Safari or Firefox, or on a real phone.
