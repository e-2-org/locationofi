# Session: archiving Location of I with Leaflet 2 - transcript

**Dates:** 18–19 October 2026
**Speakers:** **User** (Pete, who built the original site) and **Claude** (Claude Code)

The summary is in [summary.md](summary.md). Passwords, database hosts, usernames and FTP details that came up in the session are redacted here as `[redacted]`. Exact times weren't recorded.

---

## 1. The request

**User:** Can you take a look in `repos/location`? This was a project I did with an artist who recorded his geographic location, and the application showed it in real time. The data collected about his location is still there, along with the PHP scripts that were used to update the database. Ideally I would like to archive this project using Leaflet (version 2.0) and have some way of displaying the data historically.

**Claude** surveyed the repo:
- It had 363 files on `master`, and its remote was on Bitbucket, not the `e-2-org` GitHub organisation, so the GitHub Pages layout from the user's instructions didn't apply yet.
- It had uncommitted changes (`http` → `https` swaps, two deleted files, and a re-encoded `©`), which Claude left alone.
- `location.sql` was a phpMyAdmin dump from March 2008 of the `mclocations` table: `loc_id`, `loc_text`, `loc_lat`, `loc_lng`, `loc_date`, `loc_time` and `loc_timestamp`.
- `dump.xml` (January 2009) and `includes/data/dump.xml` both held 38,822 locations, from 19 April 2007 to 27 January 2009. None had a text note, every one had coordinates and the IDs were continuous. `includes/dump_latest.xml` was cut off partway through.
- `location.sql` had 36,448 rows.

Claude then read the original pages, `XMLdata.php`, `cron.php` and `includes/config.php`:
- A cron job called `XMLdata.php?update`, which polled locatea.net and stored new locations.
- The pages asked `XMLdata.php` for the latest day's locations, a given day's locations (for the archive calendar), or the list of days that had data.
- `config.php` held database credentials for three servers.

## 2. "Wait"

**User:** wait

**Claude** stopped. It reported:
- Nothing had been changed.
- The remote was on Bitbucket, so the Pages layout didn't apply.
- The uncommitted changes were there.
- `config.php` held database passwords, which were also in the committed history.
- What it had learned about the data and how the original site worked.

## 3. The repo moves to GitHub

**User:** OK, I've switched the remote and committed the changes so the GitHub Pages layout applies.

**Claude** confirmed the new state:
- The remote was now `e-2-org/location`, private, on `main`, with Pages not switched on.
- So the site would go in `docs/` and nothing would be published.

It read the rest of the original code:
- `js/location.js` used GMap, GMarker, time-based clustering beyond 100 markers, a slow zoom-in animation and updates every 20 seconds.
- `js/config.js` set hybrid and satellite map types for each page.
- `css/style.css` was the greyisgood stylesheet.
- `overlay.php` drew the red route line as an image on the server.
- The spec (`locationofi_webspec2.doc`, read with antiword) described:
  - three pages: index, archive and a full-screen gallery page
  - the red line and markers, clustering, and info windows with the date and time
  - the latitude and longitude of the pointer under the map
  - a calendar on the archive page
  - a snippet of text showing the current location

  It also contained FTP login details: `[redacted]`.

Claude checked npm. The newest Leaflet 2 release was `2.0.0-alpha.1` (16 August 2025), and the `latest` tag was still on 1.9.4. Claude decided to copy the alpha into the site rather than load it from a CDN.

## 4. Data analysis

Claude analysed `dump.xml`:
- **Where:** mostly London (around 51.5, 0) and Birmingham/Solihull (around 52.4, −1.8), plus trips to Riga, Slovenia, Germany, Slovakia, Austria, Italy and Edinburgh.
- **How often:** 601 days have data, with at most 685 locations a day. 34,788 of the gaps between locations are under 2 minutes.
- **Short trips:** there were 47 cases of a jump of more than 5 km out and straight back. They were at different places in central London, so Claude judged them to be real trips logged sparsely, not GPS faults.
- **Times:** the stored date and time strings didn't match London time for 1,993 locations, all after the end of March 2008. In those, the string was an hour behind.

Around IDs 36443–36454, six locations from 30 and 31 March 2008 appeared twice, with the same strings and coordinates but timestamps exactly 3,600 seconds apart. Claude concluded:
- The first server read the strings as London time when it made the timestamps.
- The server it moved to read them as UTC.
- So the strings should be treated as UTC, as the spec asked, and the six duplicates dropped.

## 5. "British summer time?"

**User:** British summer time?

**Claude:** Yes. BST began at 01:00 on 30 March 2008, the weekend the duplicates appear.
- The old server ran on UK time, so in summer it subtracted an hour when it made a timestamp. The new server ran on UTC.
- In winter (GMT) the two agree, which is why only summer locations disagree.
- What's still unknown is whether locatea sent UTC or UK clock time.

Claude tested this by comparing the hours when the artist started and stopped moving each day in the UK, in winter and summer:
- Winter days ran from about 10:00 to 19:55.
- Summer days ran from about 12:00 to 17:10.

That's a change in habits, not a one-hour shift, so it settled nothing. Claude went with UTC, because the spec says UTC and GPS reports time in UTC, and recorded the uncertainty in the README.

Claude also checked Leaflet 2's API:
- It's ES modules only.
- `Map` is also exported as `LeafletMap`.
- Mouse events are pointer events, e.g. `pointermove`.
- Factory functions like `L.marker()` are replaced by constructors like `new Marker()`.

## 6. Checking the live sites

**Claude** checked the old addresses:
- greyisgood.eu/location/ was still up. It describes the work: "every minute of each day since the beginning of 2007 to July 2009", commissioned by RIXC, with a list of exhibitions.
- location.e-2.org was still up, but PHP no longer ran there, so `XMLdata.php` came back as source code and there was no database to query.
- https://location.e-2.org/includes/config.php downloaded as plain text and contained the database passwords. Claude didn't print it, only counted the password lines (3), and noted it to report to the user.

Claude also read `dump()` in `includes/XMLdb.php` before calling anything. It writes a file on the server, so Claude didn't call it.

## 7. Building the site

**Claude** created the branch `leaflet-port` and built the site:
- **`tools/build-data.py`:** reads `dump.xml`, treats the date and time strings as UTC, drops exact duplicates and writes `docs/data/locations.csv` (`id,utc,lat,lng`). The result was 38,816 locations, 1.8 MB, or about 450 KB gzipped.
- **Copied in:** Leaflet 2.0.0-alpha.1 to `docs/vendor/leaflet/`; `bkgrid.gif` from `_old/2/img/`; the original `marker.png`, `mm_20_red.png` and `mm_20_shadow.png`; `favicon.ico`; and `docs/.nojekyll`.
- **`docs/js/location.js`:** loads the CSV into typed arrays grouped into UTC days. It also has:
  - binary searches for the location at a given time and the day containing a location
  - `makeMap()`, with Hybrid, Satellite and Map base maps and a scale bar
  - the pointer's latitude and longitude readout
  - the original icons, and popup text in the original's style
  - a `Track` class that draws a red line with a dot for each location and a marker on the last one, adding new points as they come
- **`docs/js/replay.js`:** the replay clock, with speeds from 1 minute to 1 day per second and long waits cut short. It has the play and pause button, a timeline slider over a chart of locations per day, and links to a moment, and the map follows the current location.
- **`docs/js/archive.js`:** the calendar of months starting on Monday and shaded by count, the day view with previous, next and "replay this day" links, and the whole-project line with click-to-find-the-day.
- **Pages and style:** `docs/index.html`, `docs/archive.html` and `docs/kiosk.html`, plus `docs/css/style.css`, based on the original stylesheet.

## 8. Testing and fixes

**Claude** installed `puppeteer-core` in the scratchpad, drove the installed Chrome headless, and served the site from `/location/`. The first runs found five problems:

1. **The layers icon was missing,** and the site's link styles were overriding Leaflet's buttons. Two rules carried over from the original stylesheet were the cause: `#div_map a { background: transparent }` and the plain `a:link` colours. Claude narrowed the first to the map credits and wrapped the second in `:where()`.
2. **The "2009" label on the timeline was cut off** at the right edge. It now moves to the left of its line when it doesn't fit.
3. **The whole-project line wasn't drawn at all.** Claude probed it and made a minimal test page, which showed that in Leaflet 2.0.0-alpha.1 anything on a canvas is blank after an animated zoom, with any canvas setup. The day view had only looked fine because a jump to a new day is too big a zoom to animate. Claude switched to the SVG renderer and added an invisible 14px-wide copy of the whole-project line to make it easier to click. Tests then showed lines and dots surviving zooming in and out.
4. **On phones, choosing a day scrolled the page** down to the calendar, pushing the map off screen. Claude changed it to scroll only the calendar box.
5. **On phones, the calendar showed one month per row** and the map credits covered the scale bar. Claude made it two months per row and raised the scale bar.

The final run had no script errors or failed requests (ignoring tiles cancelled during zooms), and nothing scrolled sideways on a phone. It covered:
- playing, speed changes, pausing (which writes the link), and opening a link to a moment
- the calendar's 601 links, the day view and popups
- clicking the whole-project line, which opened a popup whose link went to the right day
- the kiosk page playing on its own

Claude wrote `README.md`. It also checked its claim that `location.sql` adds nothing: all 36,448 rows are in `dump.xml`, and the one row that didn't match at first was only written in scientific notation.

**Claude** reported the work and:
- the time-zone assumption and the Leaflet alpha
- the exposed `config.php` on location.e-2.org
- the passwords in the repo's history, and in the spec document's FTP details, which would matter if the repo became public
- the data ending in January 2009 while the artist's page says July 2009
- a leftover `master` branch on GitHub

## 9. Removing the credentials

**User:** Can you remove the config file and webspec doc? I'll delete the repo on GitHub and start a new one from scratch, without any history or master branch. I think the data ended early because the artist ran out of cash for the service, or maybe the service stopped working? I'll check the database on the server, but I'm pretty sure the SQL file in the repo is a full picture of the data.

**Claude** searched for other credentials. It found only `config.php`, which `includes/setup.php` reads from. It then:
- ran `git rm` on `includes/config.php` and `locationofi_webspec2.doc`
- added to the README that `config.php` was removed and the original code needs a new one to run, along with the user's explanation of why the data ends
- fixed two Markdown warnings in the README

It also pointed out that `location.sql` isn't the full picture: it stops in March 2008 with 36,448 rows, while `dump.xml` has 2,374 more, up to January 2009. Claude reminded the user that the live server still exposes `config.php` and that the passwords should be changed.

## 10. The new repo

**User:** I've reset the repo at `e-2-org/locationofi.git`. Everything is on main now.

**Claude** checked it: private, `main` only, one commit (`91ca327`), Pages off, and no `config.php` or spec document in the history. But a wider search found credentials it had missed earlier: `_old/2/read.php` had a database host, username and password (`[redacted]`), the same password as one in `config.php`. The first search had looked only for the word "password", so it missed `$pass`. Claude blanked the four values (`= ''; // removed`) and offered to fold the change into the initial commit and force-push.

**User:** Yes please

**Claude:**
- Amended the commit and pushed with `git push --force-with-lease origin main`. The new commit is `f59a8ce`.
- Tried to confirm GitHub's copy, but that check was blocked because it fetched from GitHub. Instead it confirmed that the local `main` and `origin/main` are the same commit and that none of the old passwords appear in it.
- Explained that the replaced commit can't be reached from any branch, but GitHub can still serve it by its full ID to people with access to the repo. Recreating the repo would remove it completely.

**User:** OK, I'll leave it as is. In the morning I'll download the data from the database and we'll see if we've got anything from later in 2008.

**Claude** pointed out that later 2008 is already there, since the data runs to 27 January 2009. So the thing to look for is anything after that date, or more than 38,822 rows in total. It suggested a query on `mjc_locations` and said any export format would do.

## 11. The database is gone

**User:** The database no longer exists on the server, so I think this is all the data we ever had.

**Claude** added to the README that the live database no longer exists, so `dump.xml` is the last record of the data. The site needed no changes, because it was already built from the full set. That README edit isn't committed yet.

**User:** `/log-session`

**Claude** wrote this summary and transcript in `_sessions/`.
