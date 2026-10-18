# Session: archiving Location of I with Leaflet 2 - summary

**Dates:** 18–19 October 2026
**Repo:** `e-2-org/locationofi` (private, Pages not switched on). The project was on Bitbucket at the start of the session.
**Commits:** `f59a8ce` "Initial commit to GitHub" (the user's, amended in this session to remove a password). One later README edit isn't committed yet.

The transcript is in [transcript.md](transcript.md).

*Location of I* (Martin John Callanan, 2007–2009) published the artist's GPS location online as it happened. The original site worked like this:
- A cron job polled locatea.net and stored each location in MySQL, using PHP and ADOdb.
- `XMLdata.php` served the locations to a Google Maps API v2 front end.
- The pages were a live "current location" map, an archive with a calendar to pick a day, a full-screen gallery/kiosk page and a text snippet.
- The red route line was drawn as an image on the server by `overlay.php`.

This session built a static archive of the work in `docs/`, using Leaflet 2, with three ways of looking at the data over time.

## What the site does now

- **`docs/index.html`, "current location":**
  - It opens on the last location ever recorded (27 January 2009), as the live page looked when the feed stopped.
  - Play, or drag the timeline, to replay the whole project the way the live page showed it: the day's route so far, with the original marker on the latest position.
  - Speeds run from 1 minute to 1 day per second. While playing, long gaps are cut to about a second.
  - Behind the timeline is a chart of how many locations were recorded each day, with the years marked.
  - `#2007-05-14T15:00:00` opens the replay at that moment, and pausing writes that link into the address bar.
- **`docs/archive.html`, "archive":**
  - A calendar of the 601 days with data, shaded by how many locations each day has.
  - Choosing a day shows its route, with a popup on each point giving the date, time, latitude and longitude, as in the original archive.
  - Each day has "previous day", "next day" and "replay this day" links.
  - With no day chosen, it shows the whole project as one line across Europe. Clicking the line finds the nearest location and links to its day.
- **`docs/kiosk.html`:** the gallery version. It's full screen with no controls and replays the project in a loop on satellite imagery, with a caption.
- **`docs/data/locations.csv`:** every location (`id,utc,lat,lng`), linked from the archive page.
- **Look:** the original greyisgood style, with the grid background, Courier text, red serif title, dotted boxes and `[bracketed]` links. The original marker images are reused. On phones it becomes one column.
- **Base maps:** Hybrid (Esri World Imagery with Esri's transport and place-name overlays), Satellite and Map (OpenStreetMap), in place of Google's three map types.

## Main files

| File | Role |
| --- | --- |
| `docs/js/location.js` | Shared code: loads the CSV, makes the map and its base maps, the icons, the popup text and the `Track` class that draws a day's route |
| `docs/js/replay.js` | The replay for `index.html` and `kiosk.html`, including the timeline chart |
| `docs/js/archive.js` | Calendar, day view and whole-project view |
| `docs/css/style.css` | Based on the original greyisgood stylesheet |
| `docs/vendor/leaflet/` | Leaflet `2.0.0-alpha.1` (JS, CSS, layers icon, licence) |
| `tools/build-data.py` | Turns `dump.xml` into `docs/data/locations.csv` |
| `README.md` | What the project is, the site, the data and how it was tested |

## Data findings

- **`dump.xml`** (exported January 2009) is the complete set: 38,822 rows, 19 April 2007 to 27 January 2009. `includes/data/dump.xml` is the same data.
  - `location.sql` (March 2008, 36,448 rows) adds nothing that isn't in `dump.xml`.
  - `includes/dump_latest.xml` is cut off partway through.
- **Where:** mostly London and the West Midlands, with trips to Riga, Slovenia, Germany, Slovakia, Austria, Italy and Edinburgh.
- **How often:** before April 2008 there's a location every minute or two. After that they're much sparser.
- **Times (British Summer Time):**
  - The first server ran on UK time, so its timestamps for summer dates are an hour off. The server it moved to at the end of March 2008 ran on UTC.
  - The build script treats the recorded date and time strings as UTC, as the project spec asked, and ignores the stored timestamps.
  - Whether locatea sent UTC or UK clock time can't be proved. A test of when the artist started and stopped moving each day, in summer and winter, didn't settle it.
- **Duplicates:** six locations from 30 and 31 March 2008 were stored by both servers, an hour apart. The script keeps one copy of each, which gives 38,816 locations.
- **Short trips:** repeated jumps of about 9 km out and back are real trips into central London that were logged sparsely, not GPS faults, so they were left in.
- **Why it ends:** the artist's site says the work ran to July 2009, but the data stops on 27 January 2009. The user thinks the tracking service stopped working or was no longer paid for.
  - The live database no longer exists, and the old server now returns its PHP as plain text instead of running it.
  - So `dump.xml` is the last record of the data.

## Security clean-up

- **Exposed on the old server:** https://location.e-2.org/includes/config.php downloads as plain text with database passwords in it. The user was told, and was advised to take it down and change the passwords.
- **Removed from the repo** before it was recreated on GitHub without its old history:
  - `includes/config.php` (deleted)
  - `locationofi_webspec2.doc`, the project spec, which included FTP login details (deleted)
  - the credentials in `_old/2/read.php` (blanked, then folded into the initial commit and force-pushed with `--force-with-lease`)
- **Left in:** public contact addresses, author credits, and the old Google Maps v2 keys, which are restricted to specific domains and no longer work.

## Known gaps

- **Leaflet 2 is alpha.** In `2.0.0-alpha.1`, anything drawn on a canvas is wiped by an animated zoom and only comes back on the next full redraw. The site uses the SVG renderer, and the whole-project line has an invisible 14px-wide copy on top to make it easier to click. Check this again before upgrading.
- **Not carried over:** live updates, the coordinates snippet, the overview map control and marker clustering. Locations are drawn as small dots instead of pins.
- **Times:** the times may be an hour out in summer if locatea actually sent UK clock time (see above).
- **Testing:** done with headless Chrome through `puppeteer-core`, at 1100×900, 390×844 (phone) and 1280×720 (kiosk), served from `/location/`. It covered:
  - script errors and failed requests
  - playing, pausing, speed, the timeline and links to a moment
  - the calendar, previous and next day, popups and clicking the whole-project line
  - zooming in and out, with lines and dots still drawn afterwards
  - sideways scrolling on phones

  Nothing was tested in Safari or Firefox, or on a real phone.
- **Not published:** Pages isn't switched on and the repo is private. Making it public and switching Pages on (from `main`, `/docs`) is the user's decision.
