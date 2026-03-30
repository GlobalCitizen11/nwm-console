# Inception Gate Lead Capture Setup

Use this to send deck-entry leads into the Google Sheet you shared:

`https://docs.google.com/spreadsheets/d/1Kfvr0Pr3-jlWWK-VpE7xBzbR4_EnsOHESPjJiJ6YqFY/edit`

## What The Deck Captures

- `first_name`
- `last_name`
- `company`
- `email`
- `source`
- `page_url`
- `user_agent`
- `timestamp`

## Google Apps Script Setup

1. Open the Google Sheet.
2. Go to `Extensions -> Apps Script`.
3. Replace the default script with the contents of:
   [inception-gate-google-sheets-webhook.gs](/Users/globalpoppasmurf/nwm-console/docs/inception-gate-google-sheets-webhook.gs)
4. Click `Deploy -> New deployment`.
5. Choose `Web app`.
6. Set:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Deploy and authorize the script.
8. Copy the `Web app URL`.

## Final Step In The Deck

Once you have the Apps Script `Web app URL`, put it into:

[inception-gate-deck.html](/Users/globalpoppasmurf/nwm-console/docs/inception-gate-deck.html)

Replace:

```js
const gateWebhookUrl = "";
```

with:

```js
const gateWebhookUrl = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

## Current Gate Behavior

- `localhost` stays open for internal review
- deployed viewers must enter:
  - first name
  - last name
  - company
  - email
- if the webhook URL is configured, the lead is posted to the Google Apps Script endpoint before the deck unlocks
- if the webhook URL is blank, the gate still works locally as a required-entry form without remote lead capture

## Important Note

This is a controlled entry gate, not full authentication. It is useful for lead capture and basic access friction, but not for hard security.
