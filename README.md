# CellMate

A free AI phone helper for small businesses and busy people. Type a job ("get quotes from 3 plumbers today") and your town, and CellMate:

- finds real nearby businesses with phone numbers, addresses and hours from **OpenStreetMap** (keyless Overpass servers, with Photon geocoding);
- has **free AI** (keyless Pollinations) write the call script, the questions to ask and a ready-to-send text;
- gives you real **Call** (`tel:`) and **Text** (`sms:` with the message filled in) buttons that open your own phone, plus Google Maps links;
- keeps a **quote log** that highlights the lowest price, a **calendar** (add to Google Calendar or download an .ics), **contacts**, **notes** and camera **proof photos**;
- builds a **job report** you can copy or download.

Everything is saved only in your browser (localStorage). Nothing is sent without your tap. OpenStreetMap coverage of small businesses varies, so each job also links a Google Maps search.

**Not built yet:** a CellMate-owned phone number that places and answers calls hands-free. That needs a paid telephony and voice provider, so it's listed as "planned" on the page.

## Files
- `index.html`: page
- `src/main.js`, `src/style.css`: app logic and styles
- `ai-helper.js`: shared free-AI helper and Script writer chat

Plain static files, no build step (works on GitHub Pages).

Created by Walter Henderson Jr.
