# Samin Yasar | Personal Website

This is the source code for Samin Yasar's personal website, showcasing his work as a developer, photographer, and adventurer. The site features a clean, responsive design with accessibility options and dynamic content loading.

## Features

* **Vibrant Animated Background:** An interactive canvas background with particles for a modern and dynamic feel.
* **Accessibility Options:** A dedicated panel allows users to customize their Browse experience with features like:
    * Font size adjustment (increase, decrease, reset)
    * Monochrome filter
    * Color inversion
    * Big cursor
    * Link highlighting
    * Reading guide
* **Dynamic Content Loading:** Projects, certifications, and social links are injected into the HTML using JavaScript, making them easy to manage and update.
* **Responsive Navigation:** A sticky header with smooth scrolling navigation and a mobile-friendly hamburger menu.
* **Interactive Project Cards:** Project cards feature a subtle glow effect on hover and link to external project pages.
* **GitHub Stats Integration:** Displays a dynamically generated GitHub activity graph.
* **Accordion Certifications:** Certifications are presented in an expandable accordion format for easy Browse.
* **Contact Form:** A functional contact form powered by Formsubmit.co.
* **Smooth Scroll & Fade-in Animations:** Enhances user experience with subtle animations on scroll.

## Technologies Used

* **HTML5:** For the core structure of the website.
* **CSS3:** For styling, including responsive design, animations, and custom variables.
* **JavaScript (ES6+):** For dynamic content loading, animated background, accessibility features, and interactive elements.
* **Font Awesome:** For various icons used across the site (e.g., GitHub, LinkedIn, Email, accessibility icons).
* **SVG (Inline):** Used for some social media icons (e.g., Gravatar, Bluesky, Mastodon, X).
* **Google Fonts (Inter):** For a clean and modern typography.
* **GitHub Readme Stats:** Used to embed GitHub activity statistics.
* **Formsubmit.co:** A free service used for handling contact form submissions.

## Setup and Usage

This website is a static HTML, CSS, and JavaScript site, making it incredibly easy to deploy.

### To view the website locally:

1.  **Clone the repository (or download `real.html`):**
    If this is part of a Git repository, you would clone it:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
    Otherwise, simply ensure you have the `real.html` file (and any associated image/asset folders if they existed separately) on your local machine.

2.  **Open `real.html`:**
    Simply double-click the `real.html` file in your file explorer. It will open directly in your default web browser.

### To deploy the website:

You can host this website on any static site hosting service. Popular free options include:

* **GitHub Pages:** Ideal for personal projects, as you can host directly from your GitHub repository.
* **Vercel:** Offers fast deployment and a generous free tier.
* **Netlify:** Similar to Vercel, with great build and deployment features.

Just upload the `real.html` file (and any other asset files like images, if they were external) to your chosen hosting service.

## Customization

### Content (JavaScript)

* **Projects:** Modify the `projectsData` array in the JavaScript section to add, remove, or update your projects.
    ```javascript
    const projectsData = [
        { icon: '🛡️', title: 'StarryCrypt', desc: '...', url: '...' },
        // Add or remove objects here
    ];
    ```
* **Certifications:** Update the `certificationsData` array for your awards and certifications.
    ```javascript
    const certificationsData = [
        { title: "Prompt Engineering for ChatGPT", issuer: "...", date: "...", url: "..." },
        // Add or remove objects here
    ];
    ```
* **Social Links:** The social links are also injected via JavaScript. Edit the `document.querySelector('.social-links').innerHTML` string to change, add, or remove social media profiles. Remember to include the correct SVG paths or Font Awesome `<i>` tags.
* **Contact Form:** The `document.querySelector('.contact-form').innerHTML` string contains the form. Update the `action` attribute to your desired Formsubmit.co endpoint or other form handling service. You can also customize the `_autoresponse` and `_blacklist` values.

### Styling (CSS)

* **Color Variables:** The `:root` section in the `<style>` block defines CSS variables for colors. Adjust these to change the site's color scheme.
    ```css
    :root {
        --primary: #4f46e5;
        --secondary: #0ea5e9;
        /* ... other colors ... */
    }
    ```
* **Font Size:** The base font size can be adjusted using `--font-size` variable.
* **Sections:** Modify the styles for `.hero`, `.about`, `.projects`, `.certifications`, `.contact`, and `footer` to customize layout, padding, and backgrounds.

### Images

* **Hero Avatar:** Update the `src` attribute of the `hero-avatar` image in the HTML.
* **GitHub Stats:** Change the `username` in the `github-readme-stats.vercel.app` URL to display your own GitHub stats.

## License
Copyright (c) 2022-2025 Samin Yasar
This project is licensed under the MIT License - see the LICENSE.md file for details.
