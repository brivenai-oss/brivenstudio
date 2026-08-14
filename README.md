# Briven AI Studio — website

Static site, no build step. 3 pages + shared CSS/JS.

```
index.html        Home
services.html     Services (all 4 services fully detailed: chatbot, reviews, automation, dashboards)
about.html        About & Contact (contact form lives here, id="contact")
privacy.html      Privacy Policy
terms.html        Terms of Use
css/styles.css    Design system (colors, type, components)
js/script.js      Nav toggle, scroll reveal, chat demo animation, contact form
assets/           Logo files, favicons, and brand graphics (assets/brand/)
```

## Deploy to Cloudflare Pages

1. Push this folder to a GitHub/GitLab repo (or use Cloudflare's direct upload).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo (or "Upload assets" for direct upload).
3. Build settings: none needed — framework preset "None," build command blank, output directory `/` (the repo root, since these are already static files).
4. Add `brivenstudio.com` as a custom domain once the first deploy is live (Pages project → Custom domains).

That's it — no server, no environment variables required for the site itself.

## Contact form

The form on `about.html` (`#contact-form`) is wired up and live, using [formsubmit.co](https://formsubmit.co):

```html
<form id="contact-form" action="https://formsubmit.co/hello@brivenstudio.com" method="POST">
```

The JS in `script.js` intercepts the submit, sends it to formsubmit.co's `/ajax/` endpoint (needed for a fetch-based submit instead of a full page redirect), and shows an inline success or error message. If the request ever fails, the person sees a message pointing them to your email directly instead of a silent failure.

**One-time setup step:** formsubmit.co requires activating the destination email the first time it's used. Submit the form once yourself after deploying, then check `hello@brivenstudio.com` for an activation email from formsubmit.co and confirm it. Submissions before that confirmation won't arrive.

A few hidden fields are already included to keep the inbox clean:
- `_subject` — sets a fixed email subject line
- `_template=table` — formats the email as a readable table instead of raw form data
- `_honey` — a hidden honeypot field for basic spam/bot filtering (real visitors never see or fill it in)

If you'd rather switch providers later (e.g. a Cloudflare Pages Function), just swap the `action` URL — the JS already falls back gracefully for any endpoint that isn't a placeholder.

## Official brand assets

`assets/icon_mark.png` is now your official transparent logo mark, used in the nav and footer on every page, with the favicon set (`favicon.ico`, `favicon-16/32/48/180/192/512.png`) regenerated from it too.

`assets/brand/` also has extra assets from your brand board: `logo-lockup-light.png` / `logo-lockup-dark.png` (full lockups for light/dark backgrounds), four `icon-*.png` icon variants, and `about-what-we-do.jpg` (used on the About page). The footer's decorative wave pattern is no longer an image — it's a crisp inline SVG defined directly in `css/styles.css`, so it stays sharp at any screen size instead of showing JPEG compression artifacts.

## Adding pricing

Pricing is intentionally left off (`services.html`, all twelve `.plan-card` blocks across the four services say "Ask about pricing"). When you're ready to publish numbers, edit the plan name/note/bullet list in each card and change the button text/link to whatever you want (a real price shown inline, or a link straight to checkout).

## Privacy Policy & Terms of Use — please review before launch

I drafted `privacy.html` and `terms.html` based on how the site and services actually work (contact form fields, no cookies/analytics currently, how chatbot conversation data is handled for clients, etc.). Two things need your input before these go live:

1. **Governing law** — `terms.html` has a placeholder: `[Governing Jurisdiction]`. Fill in the country/state your business is registered or operating in.
2. **I'm not a lawyer** — these are solid, standard-form drafts, not legal advice. If you'll be handling EU/UK or California client data at any real volume, it's worth a short review with an actual lawyer for GDPR/CCPA specifics — there's a note left in `privacy.html` flagging this for you.

Both pages are linked in the footer on every page.

## Notes on the chat demo animation

The looping chat exchange in the hero and on the services page is decorative (`data-chat-demo` attribute, JSON array of `{role, text}` pairs, handled in `script.js`). It's not connected to any live chatbot — it's just showing what the product looks like. To change the example conversation, edit the JSON in the `data-chat-demo` attribute directly in the HTML.

## Accessibility / robustness notes

- All content is visible by default even if JavaScript fails to load — animations are additive, not load-bearing.
- `prefers-reduced-motion` is respected (scroll-reveal and the chat typing animation both skip straight to their end state).
- Keyboard focus is visible on all interactive elements.
