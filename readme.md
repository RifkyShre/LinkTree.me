# 🌐 simple-linktree

A minimal **Linktree-style** personal link page built using **Express.js** and **EJS** — perfect for sharing all your links in one place.
Customize your profile, social media, featured links, and even embed your Spotify playlist with ease.

---

## 🚀 Features

* 🧑‍💻 **Customizable Profile** — name, avatar, bio, verified badge
* 🔗 **Dynamic Link Sections** — group your links by category
* 🎨 **Social Media Icons** — full Font Awesome integration
* 🎵 **Spotify Playlist Embed** — show off your vibe
* 🌙 **Lightweight & Fast** — no database needed
* ⚙️ **Fully Configurable via `config.js`**

---

## 🛠️ Tech Stack

* **Node.js** — backend runtime
* **Express.js** — lightweight web framework
* **EJS** — template engine for rendering views
* **Font Awesome** — icons for socials and links

---

## 📦 Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/cabrata/simple-linktree.git
cd simple-linktree
npm install
```

---

## ▶️ Usage

Run the project locally:

```bash
npm start
```

Then open your browser and visit:

```
http://localhost:3000
```

---

## ⚙️ Configuration

All content is managed inside the `config.js` file.
You can edit profile details, social links, link sections, Spotify embeds, and footer content.

Example structure:

```js
module.exports = {
  profile: {
    name: "Caliph",
    username: "caliph",
    bio: "You can’t sit around envying other people’s worlds. You have to go out and change your own.",
    avatar: "https://github.com/cabrata.png",
    verified: true
  },
  socialMedia: [
    { name: "GitHub", icon: "fab fa-github", url: "https://github.com/cabrata" }
  ],
  linkSections: [
    {
      title: "Featured Links",
      links: [
        { title: "My Portfolio", url: "https://caliph.dev", icon: "fas fa-briefcase" }
      ]
    }
  ]
};
```

---

## 🧩 Folder Structure

```
simple-linktree/
├── public/           # Static assets (CSS, JS, images)
│   ├── css/
│   └── js/
├── views/            # EJS templates
│   └── index.ejs
├── config.js         # Configuration file
├── index.js          # Main Express server
└── package.json
```

---

## 💡 Customization Tips

* Modify `public/css/style.css` for your own theme
* Add or remove sections in `config.js`
* Change the favicon and meta tags in `views/index.ejs` for SEO

---

## 🐛 Issues

Found a bug or want to request a feature?
Open an issue [here](https://github.com/cabrata/simple-linktree/issues).

---

## 📜 License

This project is licensed under the **ISC License**.
Feel free to use, modify, and share!

---

## ✨ Author

**[cabrata](https://github.com/cabrata)**