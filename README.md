# Rashel Mahmud Rabbi – Academic Portfolio

Static portfolio website hosted on GitHub Pages.

## 🌐 Live Site
**https://rashelmahmudrabbi.github.io**

---

## 🚀 How to Deploy (One-time setup)

### Step 1 — Create GitHub Repository
1. Go to [github.com](https://github.com) → Sign in → Click **"New repository"**
2. Repository name: `rashelmahmudrabbi.github.io`  
   *(must be exactly: your-username.github.io)*
3. Set to **Public**
4. Click **"Create repository"**

### Step 2 — Upload Files
**Option A — Upload via browser (easiest):**
1. Open your new repository
2. Click **"uploading an existing file"**
3. Drag and drop the entire contents of this folder
4. Click **"Commit changes"**

**Option B — Using Git:**
```bash
git init
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/rashelmahmudrabbi/rashelmahmudrabbi.github.io.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to your repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → folder: **/ (root)**
4. Click **Save**
5. Wait ~2 minutes → your site is live!

---

## 📁 File Structure
```
rashelmahmudrabbi.github.io/
│
├── index.html                  ← Main portfolio (edit this to update content)
├── README.md
│
└── media/
    ├── profile/
    │   └── Prof._Passport_size_image.jpg
    ├── awards/
    │   ├── Idea_with_Poster_Presentation.jpg
    │   └── Research_Olympiad.jpg
    ├── certifications/
    │   ├── images/
    │   └── pdfs/
    └── gallery/
        └── covers/
```

---

## ✏️ How to Update Content

All content is in `index.html`. Open it in any text editor (VS Code recommended).

**To add a new gallery photo:**
Find the `galleryEvents` array in the JavaScript section and add to the photos list:
```javascript
const galleryEvents = [
  {
    title: "IEEE ProCon App Idea Competition",
    photos: [
      { src: "media/gallery/covers/20251122_185713.jpg", caption: "..." },
      { src: "media/gallery/photos/new_photo.jpg", caption: "New caption" }  // add here
    ]
  }
];
```
Then upload the new image to the `media/gallery/photos/` folder.

---

## 📧 Contact
raselmahud6757@gmail.com
