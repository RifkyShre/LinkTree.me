module.exports = {
  // ============================================
  // PROFILE INFORMATION
  // Edit your basic profile details here
  // ============================================
  profile: {
    name: "RifkyShre",
    username: "RifkyShre",
    bio: "Mau Jadi Full Stack developer ternyata lebih asik jadi vibe coder",
    avatar: "https://raw.githubusercontent.com/AkihikoDevMODE/uploader/main/akihiko/file_cd0d9728_1176d9d6eedf.jpg",
    verified: true
  },

  // ============================================
  // SOCIAL MEDIA LINKS
  // Add your social media profiles here
  // Format: { name, icon, url, color, colorDark? }
  // Icons: Use FontAwesome classes (fab fa-instagram, fab fa-twitter, etc.)
  // Colors: Hex color codes for light/dark themes
  // ============================================
  socialMedia: [
    {
      name: "Instagram",
      icon: "fab fa-instagram",
      url: "https://www.instagram.com/aditya_rifky_25?igsh=a3V6M2k1MmtjZjU4",
      color: "#E4405F"
    },
    {
      name: "GitHub",
      icon: "fab fa-github",
      url: "https://github.com/RifkyShre",
      color: "#333",
      colorDark: "#fff"  // Optional: different color for dark theme
    },
    {
      name: "YouTube",
      icon: "fab fa-youtube",
      url: "https://www.youtube.com/@CallMyKyy",
      color: "#FF0000"
    }

    // 🆕 HOW TO ADD NEW SOCIAL MEDIA:
    // Copy this template and paste below:
    /*
    {
      name: "Twitter",                    // Display name
      icon: "fab fa-twitter",            // FontAwesome icon class
      url: "https://twitter.com/username", // Your profile URL
      color: "#1DA1F2"                    // Brand color (hex code)
    },
    */
    // Popular social media icons:
    // - Twitter: "fab fa-twitter" (#1DA1F2)
    // - Facebook: "fab fa-facebook" (#1877F2)
    // - LinkedIn: "fab fa-linkedin" (#0077B5)
    // - TikTok: "fab fa-tiktok" (#000000)
    // - Discord: "fab fa-discord" (#5865F2)
    // - Twitch: "fab fa-twitch" (#9146FF)
  ],

  // ============================================
  // LINK SECTIONS
  // Group your links into themed sections
  // Each section has a title and array of links
  // ============================================
  linkSections: [
    {
      title: "Connect with Me",
      links: [
        {
          title: "RifkyShre WhatsApp Channel",
          subtitle: "my project information",
          icon: "fab fa-whatsapp",
          url: "https://whatsapp.com/channel/0029VaiPyagHrDZhX6hmUs3Q",
          color: "#25D366"
        }

        // 🆕 HOW TO ADD MORE LINKS TO THIS SECTION:
        // Copy this template and paste below:
        /*
        {
          title: "My Portfolio",           // Link title
          subtitle: "View my work",        // Description
          icon: "fas fa-briefcase",       // FontAwesome icon
          url: "https://yourportfolio.com", // Link URL
          color: "#8b5cf6"                 // Accent color
        },
        */
      ]
    },

    // 🆕 HOW TO ADD A NEW SECTION:
    // Copy this template and paste below:
    /*
    {
      title: "My Projects",               // Section title
      links: [
        {
          title: "Project 1",
          subtitle: "Description of project 1",
          icon: "fas fa-code",
          url: "https://github.com/username/project1",
          color: "#10b981"
        },
        {
          title: "Project 2",
          subtitle: "Description of project 2",
          icon: "fas fa-rocket",
          url: "https://project2.com",
          color: "#f59e0b"
        }
      ]
    },
    */

    {
      title: "Programming Languages",
      links: [
        {
          title: "JavaScript",
          subtitle: "Node.js official website",
          icon: "fab fa-js",
          url: "https://nodejs.org/en",
          color: "#F7DF1E"
        },
        {
          title: "Go",
          subtitle: "Go programming language",
          icon: "fab fa-google",
          url: "https://go.dev/",
          color: "#00ADD8"
        },
        {
          title: "Python",
          subtitle: "Python official website",
          icon: "fab fa-python",
          url: "https://www.python.org/",
          color: "#3776AB"
        }
      ]
    },
    {
      title: "Featured Links",
      links: [
        {
          title: "My Artikel",
          subtitle: "Check out my work & projects",
          icon: "fas fa-briefcase",
          url: "https://www.rifkyshre.biz.id/2025/10/rifkyshre-pengembang-bot-whatsapp-muda_28.html?m=1",
          color: "#8b5cf6"
        },
        {
          title: "QRIS",
          subtitle: "Support me via QRIS",
          icon: "fas fa-heart",
          url: "https://raw.githubusercontent.com/AkihikoDevMODE/uploader/main/akihiko/file_4acf3d29_a8605a6dcf52.jpg",
          color: "#ff6b6b"
        }
      ]
    }
  ],

  // ============================================
  // SPOTIFY CONFIGURATION
  // Enable/disable Spotify embed and customize
  // ============================================
  spotify: {
    enabled: true,                                    // Set to false to hide
    title: "My Playlist",                             // Display title
    playlistUrl: "https://open.spotify.com/embed/playlist/4N7XisTlgHyWB1CqAWKJJS?theme=0"  // Spotify embed URL
  },

  // ============================================
  // FOOTER
  // Customize footer text and link
  // ============================================
  footer: {
    text: " 2025 RifkyShre.",                        // Footer text
    link: "https://vionyx.id"                         // Footer link URL
  },

  // ============================================
  // SEO & META TAGS
  // Search engine optimization settings
  // ============================================
  seo: {
    title: "RifkyShre",                               // Page title
    description: "You can't sit around envying other people's worlds. You have to go out and change your own.",
    keywords: "RifkyShre, links, social media, portfolio",
    ogImage: "https://raw.githubusercontent.com/AkihikoDevMODE/uploader/main/akihiko/file_cd0d9728_1176d9d6eedf.jpg"
  }
};
