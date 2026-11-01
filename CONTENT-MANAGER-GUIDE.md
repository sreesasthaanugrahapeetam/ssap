# Website Content Guide

For the content manager of Sree Sastha Anugraha Peetam. All text, photos and videos on the website are changed in **two Google Sheets**. You never edit the website code.

- **Content sheet** (page text, banner, photos): https://docs.google.com/spreadsheets/d/1mxb4kGg-ejyya9PrxxOnTXqN7LkUMUV6CA5wJ6ecClA/edit
- **Annadanam sheet** (who sponsors each meal): https://docs.google.com/spreadsheets/d/1Q_EkgF5QhDgx7ndO2-1nXOSLC8iuhlLJeEblwh8i-AI/edit

## Which sheet for what

| To change | Sheet | Tab |
|---|---|---|
| Scrolling announcement at the top | Content | `ticker` |
| Main title and mantra | Content | `hero` |
| Our Guru Swamy section | Content | `peetadhipati` |
| About the Peetam | Content | `about` |
| Upcoming events | Content | `events` |
| Darshan timings | Content | `timings` |
| Poojas and Sevas cards | Content | `poojas` |
| Rotating banner under the announcement (YouTube or Drive) | Content | `banner` |
| Annadanam intro text | Content | `annadanam` |
| Annadanam video or photos box (YouTube or Drive) | Content | `annadanam_media` |
| Divine Gallery photos | Content | `gallery` |
| UPI and donation details | Content | `donations` |
| Phone, email, address, hours | Content | `contact` |
| Social media links | Content | `social` |
| Names for Morning, Afternoon, Evening meals, day by day | Annadanam | first tab (the schedule) |
| Donor details in the popup (gothram, family, photo, Telugu and English) | Annadanam | `donors` |

## Annadanam: schedule tab or donors tab?

Use **both**, each for a different job.

1. **Schedule tab** (first tab): the main list. One row per date. Type a short name in the Morning, Afternoon or Evening cell. This is what shows in the three boxes. Phone numbers typed here are hidden on the website automatically.
2. **`donors` tab** (optional): the details popup. One row per donor, matched by `date` (DD-MM-YYYY) and `slot` (Morning, Afternoon or Evening). Several donors for one meal means several rows.
3. **Add donor form** (button on the website): the quick way to fill the `donors` tab. It adds the row for you and uploads the photo to Drive.

How the website decides what to show:

- Schedule cell has text: the box shows that text.
- Schedule cell empty but a `donors` row exists: the box shows the donor's name.
- Nothing in either: the box says "Open for sponsorship".
- Popup: shows the `donors` rows if there are any, otherwise the schedule text, then the Guru Swamy slide.
- To hide a donor without deleting the row, type `no` in the `show` column.

## Steps for any change

1. Open the right sheet (table above) and the right tab.
2. Edit the cell. Do not rename tabs or change the header row.
3. Wait a minute, then refresh the website (Ctrl+Shift+R) to see it.
4. Leave a tab with only its header row to go back to the built-in content (for `banner` and `annadanam_media` that means the banner is hidden or the built-in Annadanam video is shown).

## Rules that avoid problems

- Dates are written DD-MM-YYYY. Format date columns as Plain text.
- YouTube: paste the normal link (Shorts also work).
- Photos and videos from Drive: set sharing to "Anyone with the link, Viewer", then paste the share link. For a Drive **video** also type `video` in the `type` column.
- `banner` and `annadanam_media` columns: `link`, `caption` (optional), `url` (optional, opens when a photo is clicked), `type`.
- Family members are written `Wife: Name; Son: Name` (semicolon between people).

## If something does not show

- Hard refresh first (Ctrl+Shift+R).
- Check the tab name is exactly right and the header row is untouched.
- Check the Drive file is shared with "Anyone with the link".
- Check the date format and that the slot is spelled Morning, Afternoon or Evening.

## Ask the developer for

Changing the logo or Guru Swamy photo files, adding a new section, or changing the design.
