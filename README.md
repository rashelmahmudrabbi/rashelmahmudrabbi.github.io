# Portfolio Frontend

Static site built with **Bootstrap 5** (plain HTML/CSS/JS, no build step).
All content — profile info, education, publications, projects, gallery,
blog posts, etc. — is fetched at page-load time from the Django backend API,
so you can edit everything through Django's admin panel without touching
this code.

## Structure
- `index.html` – homepage (hero, education, publications preview, projects,
  certifications, awards, gallery, personal info, references)
- `projects/index.html`, `publications/index.html`, `teaching/index.html`,
  `blog/index.html`, `cv/index.html` – the other pages
- `assets/js/config.js` – **set this to your backend URL before deploying**
- `assets/js/api.js` – shared fetch helper
- `assets/js/site-*.js` – one render script per page
- `media/` – static images that shipped with the original site (profile
  photo, award photos, certificate images, gallery photos)

## 1. Point the frontend at your backend
Edit `assets/js/config.js`:
```js
const API_BASE = 'https://your-backend.vercel.app/api';
```
Replace with your deployed Django backend's URL (see the `backend/`
folder's README for how to deploy that first). For local testing against a
backend running on your machine (`python manage.py runserver`), use
`http://localhost:8000/api` instead.

## 2. Deploy to Vercel via GitHub
1. Push this `frontend/` folder to its own GitHub repository (e.g. `portfolio-frontend`).
2. Go to https://vercel.com → **Add New → Project** → import that repository.
3. Framework preset: **Other** (it's a static site, no build command needed).
4. Deploy. Vercel will give you a URL like `https://your-name.vercel.app` —
   this is your live portfolio.

No environment variables are needed here — everything talks to the backend
URL you set in `config.js`.

## Editing content
Go to `https://<your-backend>.vercel.app/admin`, log in with your Django
superuser account, and edit any section (profile, education, publications,
projects, gallery, blog, etc.). Changes show up on the live site as soon as
you reload the page — no redeploy needed.

> Note: if you deployed the backend to Vercel, see the caveat in the
> backend README about SQLite not persisting writes between cold starts.
> Editing locally and redeploying, or hosting the backend on Render/Railway,
> avoids that issue entirely.

## Adding new images
This frontend doesn't have an image upload feature (to keep the backend
simple). To add a new photo (e.g. a new gallery event or certificate):
1. Drop the image file into `media/...` in this repo (e.g.
   `media/gallery/MyEvent/photo1.jpg`) and push to GitHub — Vercel will
   redeploy automatically.
2. In Django admin, set the item's image field to that relative path, e.g.
   `media/gallery/MyEvent/photo1.jpg`.

Alternatively, paste any external image URL (e.g. from an image host) directly.
