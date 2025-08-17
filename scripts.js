document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img:not([loading])').forEach(img => {
        img.setAttribute('loading', 'lazy');
    });

    // ===================================
    // VIBRANT CANVAS BACKGROUND
    // ===================================
    const canvas = document.getElementById('canvas-background');
    const ctx = canvas.getContext('2d');
    let particles = [];

    // --- MOUSE TRACKING ---
    let mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });


    function resizeCanvas() {
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.baseSize = this.size; // Store original size
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
        }
        update() {
            // --- INTERACTION LOGIC ---
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // If mouse is close, move particle towards it
            if (distance < mouse.radius) {
                // The closer the particle, the faster it moves
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                this.x += forceDirectionX * force * 5;
                this.y += forceDirectionY * force * 5;
            } else {
                // Otherwise, continue its normal path
                this.x += this.speedX;
                this.y += this.speedY;

                // Bounce off the screen edges
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // CORRECTED: Moved Quadtree class definition before it is used.
    class Quadtree {
        constructor(boundary, capacity) {
            this.boundary = boundary; // { x, y, width, height }
            this.capacity = capacity; // Maximum particles per node
            this.particles = [];
            this.divided = false;
        }

        subdivide() {
            const { x, y, width, height } = this.boundary;
            const halfWidth = width / 2;
            const halfHeight = height / 2;

            this.northeast = new Quadtree({ x: x + halfWidth, y: y, width: halfWidth, height: halfHeight }, this.capacity);
            this.northwest = new Quadtree({ x, y, width: halfWidth, height: halfHeight }, this.capacity);
            this.southeast = new Quadtree({ x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight }, this.capacity);
            this.southwest = new Quadtree({ x, y: y + halfHeight, width: halfWidth, height: halfHeight }, this.capacity);

            this.divided = true;
        }

        insert(particle) {
            const { x, y, width, height } = this.boundary;
            if (particle.x < x || particle.x > x + width || particle.y < y || particle.y > y + height) {
                return false;
            }

            if (this.particles.length < this.capacity) {
                this.particles.push(particle);
                return true;
            }

            if (!this.divided) {
                this.subdivide();
            }

            return (
                this.northeast.insert(particle) ||
                this.northwest.insert(particle) ||
                this.southeast.insert(particle) ||
                this.southwest.insert(particle)
            );
        }

        query(range, found = []) {
            const { x, y, width, height } = this.boundary;
            if (
                range.x > x + width ||
                range.x + range.width < x ||
                range.y > y + height ||
                range.y + range.height < y
            ) {
                return found;
            }

            for (const particle of this.particles) {
                if (
                    particle.x >= range.x &&
                    particle.x <= range.x + range.width &&
                    particle.y >= range.y &&
                    particle.y <= range.y + range.height
                ) {
                    found.push(particle);
                }
            }

            if (this.divided) {
                this.northeast.query(range, found);
                this.northwest.query(range, found);
                this.southeast.query(range, found);
                this.southwest.query(range, found);
            }

            return found;
        }
    }

    function initParticles() {
        particles = [];
        let numberOfParticles = (canvas.width * canvas.height) / 9000;
        if (window.innerWidth < 768) numberOfParticles = (canvas.width * canvas.height) / 15000; // Comparatively fewer on mobile
        for (let i = 0; i < numberOfParticles; i++) particles.push(new Particle());
    }

    function connectParticles() {
        const quadtree = new Quadtree({ x: 0, y: 0, width: canvas.width, height: canvas.height }, 4);

        particles.forEach(particle => quadtree.insert(particle));

        particles.forEach(particle => {
            const range = { x: particle.x - 100, y: particle.y - 100, width: 200, height: 200 };
            const nearbyParticles = quadtree.query(range);

            nearbyParticles.forEach(other => {
                if (particle !== other) {
                    const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
                    if (distance < 100) {
                        const opacityValue = 1 - distance / 100;
                        ctx.strokeStyle = `rgba(14, 165, 233, ${opacityValue})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                }
            });
        });
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connectParticles();
        requestAnimationFrame(animateParticles);
    }

    // Initialize and start the animation
    initParticles();
    animateParticles();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            initParticles();
        }, 200); // Adjust the delay as needed
    });

    // ===================================
    // BACKGROUND MUSIC TOGGLE - PRODUCTION VERSION
    // ===================================
    const musicPlayer = document.getElementById('background-music');
    const musicToggleButton = document.getElementById('music-toggle-btn');

    if (musicPlayer && musicToggleButton) {
        let isAttemptingPlayback = false;
        let userHasInteracted = false;
        let autoplayFailed = false;

        // Check if audio is ready to play
        const isAudioReady = () => {
            return musicPlayer.readyState >= 3;
        };

        // Wait for audio to be ready
        const waitForAudioReady = () => {
            return new Promise((resolve) => {
                if (isAudioReady()) {
                    resolve();
                } else {
                    const checkReady = () => {
                        if (isAudioReady()) {
                            musicPlayer.removeEventListener('canplay', checkReady);
                            musicPlayer.removeEventListener('canplaythrough', checkReady);
                            resolve();
                        }
                    };
                    musicPlayer.addEventListener('canplay', checkReady);
                    musicPlayer.addEventListener('canplaythrough', checkReady);
                }
            });
        };

        // Main toggle function
        const toggleMusic = async () => {
            if (isAttemptingPlayback) return;

            if (musicPlayer.paused) {
                isAttemptingPlayback = true;

                try {
                    await waitForAudioReady();

                    if (musicPlayer.currentTime > 0 && musicPlayer.ended) {
                        musicPlayer.currentTime = 0;
                    }

                    await musicPlayer.play();
                    localStorage.setItem('musicPreference', 'on');
                    musicToggleButton.classList.add('active');

                } catch (error) {
                    localStorage.setItem('musicPreference', 'off');
                    musicToggleButton.classList.remove('active');
                } finally {
                    isAttemptingPlayback = false;
                }
            } else {
                musicPlayer.pause();
                localStorage.setItem('musicPreference', 'off');
                musicToggleButton.classList.remove('active');
            }
        };

        // Handle user interaction
        const handleUserInteraction = (event) => {
            if (userHasInteracted) return;

            userHasInteracted = true;

            // Remove listeners immediately
            document.removeEventListener('click', handleUserInteraction, true);
            document.removeEventListener('touchstart', handleUserInteraction, true);
            document.removeEventListener('mousedown', handleUserInteraction, true);
            document.removeEventListener('keydown', handleUserInteraction, true);

            // Auto-enable music if conditions are met
            const musicPreference = localStorage.getItem('musicPreference');
            if (autoplayFailed && musicPreference !== 'off' && musicPlayer.paused) {
                toggleMusic();
            }
        };

        // Initialize music
        const initializeMusic = () => {
            const musicPreference = localStorage.getItem('musicPreference');

            if (musicPreference === 'off') {
                musicToggleButton.classList.remove('active');
                return;
            }

            waitForAudioReady().then(() => {
                isAttemptingPlayback = true;
                musicPlayer.play().then(() => {
                    musicToggleButton.classList.add('active');
                    localStorage.setItem('musicPreference', 'on');
                    userHasInteracted = true;
                }).catch(error => {
                    autoplayFailed = true;
                    musicToggleButton.classList.remove('active');

                    document.addEventListener('click', handleUserInteraction, { capture: true });
                    document.addEventListener('touchstart', handleUserInteraction, { capture: true });
                    document.addEventListener('mousedown', handleUserInteraction, { capture: true });
                    document.addEventListener('keydown', handleUserInteraction, { capture: true });
                }).finally(() => {
                    isAttemptingPlayback = false;
                });
            }).catch(error => {
                musicToggleButton.classList.remove('active');
            });
        };

        // Button click handler
        musicToggleButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            userHasInteracted = true;

            // Clean up any remaining listeners
            document.removeEventListener('click', handleUserInteraction, true);
            document.removeEventListener('touchstart', handleUserInteraction, true);
            document.removeEventListener('mousedown', handleUserInteraction, true);
            document.removeEventListener('keydown', handleUserInteraction, true);

            toggleMusic();
        });

        // Preload the audio
        musicPlayer.load();

        // Initialize
        setTimeout(initializeMusic, 100);
    }

    // ===================================
    // DYNAMIC CONTENT DATA
    // ===================================
    const projectsData = [
        { icon: '🛡️', title: 'StarryCrypt', desc: 'End-to-end text encryption tool using browser-only architecture to protect your privacy.', url: 'https://samin-yasar.github.io/StarryCrypt/' },
        { icon: '🌙', title: 'Lunr', desc: 'A free online period tracking web app designed to help users monitor their menstrual cycles.', url: 'https://samin-yasar.github.io/Lunr/' },
        { icon: '🔑', title: 'Starpass', desc: 'Generate strong, secure, and private passwords or passphrase right in your browser.', url: 'https://samin-yasar.github.io/Starpass/' },
        { icon: '💬', title: 'StarConnect', desc: 'A peer-to-peer chat app with end-to-end encryption and real-time messaging.', url: 'https://samin-yasar.github.io/StarConnect' },
        { icon: '🔎', title: 'OriginScan', desc: 'Scans EAN-13 barcodes to detect the country of origin and highlight mismatches.', url: 'https://samin-yasar.github.io/OriginScan' },
        { icon: '🔄', title: 'Bangla Converter', desc: 'A simple, offline, and privacy-focused tool to convert between different Bengali numerical systems.', url: 'https://samin-yasar.github.io/Bangla-Converter' }
    ];

    const certificationsData = [
        { title: "Prompt Engineering for ChatGPT", issuer: "Vanderbilt University", date: "Nov 2024", url: "https://coursera.org/verify/JX2HO91W37QA", logo: "assets/vectors/Vanderbilt_logo.svg" },
        { title: "HTML, CSS, and JavaScript for Web Developers", issuer: "Johns Hopkins University", date: "Nov 2024", url: "https://coursera.org/verify/CT64714MQNJ7", logo: "assets/vectors/Johns_Hopkins_University_Shield_Blue.svg" },
        { title: "Responsive Web Design", issuer: "freeCodeCamp", date: "Sep 2023", url: "https://freecodecamp.org/certification/samin_yasar23/responsive-web-design", logo: "assets/vectors/freecodecamp.svg" },
        { title: "Ethical Hacker", issuer: "Cisco", date: "Oct 2024", url: "https://www.credly.com/badges/4e0cff81-a500-403c-8590-3ed7f4200637", logo: "assets/vectors/cisco.svg" },
        { title: "Code in Place", issuer: "Stanford University", date: "Jun 2024", url: "https://codeinplace.stanford.edu/cip4/certificate/q2enwj", logo: "assets/vectors/Seal_of_Leland_Stanford_Junior_University.svg" },
        { title: "Microsoft 365 Fundamentals Specialization", issuer: "Microsoft", date: "Nov 2024", url: "https://www.coursera.org/verify/specialization/RP0FVBSWQJJ5", logo: "assets/vectors/Microsoft_logo.svg" },
        { title: "Work Smarter with Microsoft Word (with Honor)", issuer: "Microsoft", date: "Apr 2024", url: "https://www.coursera.org/verify/X5ZSJ6L5NM8L", logo: "assets/vectors/Microsoft_logo.svg" },
        { title: "English for Media Literacy", issuer: "University of Pennsylvania", date: "Apr 2024", url: "https://www.coursera.org/verify/H6FCNWXPAPFQ", logo: "assets/vectors/Shield_of_the_University_of_Pennsylvania.svg" },
        { title: "Bronze Award", issuer: "The iDEA Award", date: "Oct 2024", url: "https://idea.org.uk/roa/PA5USO6JZX", logo: "assets/vectors/idea-blue.svg" },
        { title: "Disaster Preparedness", issuer: "University of Pittsburgh", date: "Nov 2024", url: "https://www.coursera.org/verify/YY6RWMHJ8AWA", logo: "assets/vectors/University_of_Pittsburgh_seal.svg" },
        { title: "Intellectual Property Law Specialization", issuer: "University of Pennsylvania", date: "Nov 2024", url: "https://www.coursera.org/verify/specialization/HA87JBJSHE83", logo: "assets/vectors/Shield_of_the_University_of_Pennsylvania.svg" },
        { title: "English for Journalism", issuer: "University of Pennsylvania", date: "Sep 2024", url: "https://badgr.com/public/assertions/VZCoV2XqSNWF2aAQCmEzHw", logo: "assets/vectors/Shield_of_the_University_of_Pennsylvania.svg" }
    ];

    const educationData = [
        { level: "11th to 12th Grade", institution: "Ongoing...", status: "in-progress" },
        { level: "6th to 10th Grade", institution: "Rajuk Uttara Model College", status: "completed" },
        { level: "Nursery to 5th Grade", institution: "Rajendrapur Cantonment Public School and College", status: "completed" },
    ];

    // ===================================
    // DYNAMIC CONTENT INJECTION
    // ===================================
    // Projects
    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {
        projectsData.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card fade-in-up';
            card.innerHTML = `<div class="glow"></div><div class="project-icon">${p.icon}</div><h3>${p.title}</h3><p>${p.desc}</p>`;
            card.addEventListener('click', () => window.open(p.url, '_blank'));
            projectsGrid.appendChild(card);
        });

        projectsGrid.querySelectorAll('.project-card').forEach(card => {
            const glow = card.querySelector('.glow');
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                glow.style.left = `${e.clientX - rect.left - glow.offsetWidth / 2}px`;
                glow.style.top = `${e.clientY - rect.top - glow.offsetHeight / 2}px`;
            });
        });
    }

    // Certifications
    const certificationsGrid = document.querySelector('.certifications-grid');
    if (certificationsGrid) {
        certificationsGrid.innerHTML = ''; // Clear any fallback content
        certificationsData.forEach(c => {
            const card = document.createElement('div');
            card.className = 'certification-card fade-in-up';
            card.innerHTML = `
                <div class="cert-header">
                    <img src="${c.logo}" alt="${c.issuer} Logo" class="cert-logo" loading="lazy">
                    <span class="cert-issuer">${c.issuer}</span>
                </div>
                <h3 class="cert-title">${c.title}</h3>
                <p class="cert-date">Issued: ${c.date}</p>
                <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="cert-verify-btn">
                    Verify Credential <i class="fas fa-external-link-alt"></i>
                </a>
            `;
            certificationsGrid.appendChild(card);
        });
    }

    // Education
    const educationContainer = document.querySelector('.education-container');
    if (educationContainer) {
        educationData.forEach(edu => {
            const item = document.createElement('div');
            item.className = 'education-item';
            let dots = '';
            if (edu.status === 'completed') {
                dots = '<span class="dot ticked">';
            } else if (edu.status === 'in-progress') {
                dots = '<span class="dot dimming"></span>';
            }
            item.innerHTML = `<div class="education-progress">${dots}</div><div class="education-info"><div class="education-level">${edu.level}</div><div class="education-institution">${edu.institution}</div></div>`;
            educationContainer.appendChild(item);
        });
    }

    // Contact Form and Social Links
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.innerHTML = `<input type="hidden" name="_next" value="https://samin-yasar.github.io/thanks.html"><input type="hidden" name="_captcha" value="true"><input type="hidden" name="_template" value="table"><input type="hidden" name="_autoresponse" value="Thank you for reaching out! 💙 I've received your message and will get back to you as soon as possible, inshaAllah! 😊"><input type="hidden" name="_blacklist" value="fuck,shit,asshole,spam,hack,scam,viagra"> <div class="form-group"><input type="text" name="name" required placeholder="Full Name"></div><div class="form-group"><input type="email" name="email" required placeholder="Email Address"></div><div class="form-group"><textarea name="message" rows="5" required placeholder="Leave a paw-sitive message... 🐈"></textarea></div><div class="consent-group"><input type="checkbox" id="consent" required><label for="consent">I agree to the terms.</label></div><button type="submit" class="btn btn-primary">Meow Me! <i class="fas fa-paw"></i></button>`;
    }

    const socialLinks = document.querySelector('.social-links');
    if (socialLinks) {
        socialLinks.innerHTML = `<a href="https://gravatar.com/saminyasar23" target="_blank" aria-label="Gravatar" title="Gravatar"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-1.326 0-2.4 1.074-2.4 2.4v8.4c0 1.324 1.074 2.398 2.4 2.398s2.4-1.074 2.4-2.398V5.21c2.795.99 4.799 3.654 4.799 6.789 0 3.975-3.225 7.199-7.199 7.199S4.801 15.975 4.801 12c0-1.989.805-3.789 2.108-5.091.938-.938.938-2.458 0-3.396s-2.458-.938-3.396 0C1.344 5.686 0 8.686 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0" /></svg></a><a href="https://bsky.app/profile/samin-yasar.github.io" target="_blank" aria-label="Bluesky" title="Bluesky"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3.268 64 68.414"><path d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64-9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805zm36.254 0C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745z" /></svg></a><a rel="me" href="https://fosstodon.org/@Samin" target="_blank" aria-label="Mastodon" title="Mastodon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" /></svg></a><a href="https://x.com/SaminYasar23" target="_blank" aria-label="X" title="X"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg></a><a href="https://github.com/samin-yasar" target="_blank" aria-label="GitHub"><i class="fab fa-github"></i></a><a href="https://www.linkedin.com/in/samin-yasar23" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a><a href="mailto:samin.rash525@silomails.com" aria-label="Email"><i class="fas fa-envelope"></i></a>`;
    }

    const moreLink = document.getElementById('more-link');
    const moreSubmenu = document.getElementById('more-submenu');

    if (moreLink && moreSubmenu) {
        moreLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            // Toggle the 'active' class on the submenu
            moreSubmenu.classList.toggle('active');

            // Optional: Close submenu if clicked outside
            event.stopPropagation(); // Stop propagation to prevent immediate closing from document click
        });

        // Close the submenu if a click occurs anywhere else on the document
        document.addEventListener('click', (event) => {
            if (moreSubmenu.classList.contains('active') && !moreSubmenu.contains(event.target) && event.target !== moreLink) {
                moreSubmenu.classList.remove('active');
            }
        });

        // Optional: Close submenu if an item inside it is clicked
        moreSubmenu.querySelectorAll('a').forEach(item => {
            item.addEventListener('click', () => {
                moreSubmenu.classList.remove('active');
            });
        });
    }

    // ===================================
    // SEARCH LOGIC
    // ===================================
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchContainer = document.querySelector('.search-container');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const searchBox = document.getElementById('search-box');
    const searchResults = document.getElementById('search-results');

    if (searchToggleBtn) {
        const searchableData = [
            { title: 'Home', description: 'Main landing page', type: 'Section', url: '#home' },
            { title: 'About Me', description: 'Information about who I am, my passions, and interests.', type: 'Section', url: '#about' },
            { title: 'Privacy Tools & Projects', description: 'A collection of my open-source projects.', type: 'Section', url: '#projects' },
            { title: 'GitHub Activity', description: 'My GitHub contribution stats.', type: 'Section', url: '#stats' },
            { title: 'Awards & Certifications', description: 'My professional awards and certifications.', type: 'Section', url: '#certifications' },
            { title: 'Letter of Appreciation', description: 'Feedback and letters from collaborators.', type: 'Section', url: '#appreciation' },
            { title: 'Education', description: 'My educational background from NCTB curriculum.', type: 'Section', url: '#education' },
            { title: 'Contact Me', description: 'Get in touch or work together.', type: 'Section', url: '#contact' },
            ...projectsData.map(p => ({ title: p.title, description: p.desc, type: 'Project', url: p.url })),
            ...certificationsData.map(c => ({ title: c.title, description: `Issued by ${c.issuer}`, type: 'Certification', url: c.url })),
            ...educationData.map(e => ({ title: e.level, description: 'NCTB Curriculum', type: 'Education', url: '#education' }))
        ];

        function openSearch() {
            searchContainer.classList.add('active');
            searchBox.focus();
        }

        function closeSearch() {
            searchContainer.classList.remove('active');
            searchBox.value = '';
            searchResults.innerHTML = '';
        }

        searchToggleBtn.addEventListener('click', openSearch);
        searchCloseBtn.addEventListener('click', closeSearch);

        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            const results = searchableData.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
            displayResults(results);
        });

        function displayResults(results) {
            if (!results.length) {
                searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
                return;
            }
            const html = results.map(item => `
                <a href="${item.url}" class="search-result-item" target="${item.type === 'Project' || item.type === 'Certification' ? '_blank' : '_self'}" onclick="closeSearch()">
                    ${item.title}
                    <small>${item.type}: ${item.description}</small>
                </a>
            `).join('');
            searchResults.innerHTML = html;
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchContainer.classList.contains('active')) {
                closeSearch();
            }
        });
    }

    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // ===================================
    // MOBILE NAVIGATION
    // ===================================
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
            mobileNav.classList.toggle('open');
        });
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
                mobileNav.classList.remove('open');
            });
        });
    }

    // ===================================
    // SCROLL & INTERACTION EFFECTS
    // ===================================
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 50); });
    }
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // ===================================
    // ACCESSIBILITY PANEL LOGIC
    // ===================================
    const settingsBtn = document.getElementById('accessibility-settings-btn');
    const panel = document.getElementById('accessibility-panel');
    const body = document.body;
    const html = document.documentElement;

    if (settingsBtn) {
        const settings = {
            fontSize: 16, invert: false, bigCursor: false,
            starCursor: false, highlightLinks: false, readingGuide: false
        };

        function applySettings() {
            localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
            html.style.setProperty('--font-size', `${settings.fontSize}px`);
            body.classList.toggle('accessibility-invert', settings.invert);
            body.classList.toggle('accessibility-big-cursor', settings.bigCursor);
            body.classList.toggle('accessibility-star-cursor', settings.starCursor);
            body.classList.toggle('accessibility-highlight-links', settings.highlightLinks);
            body.classList.toggle('accessibility-reading-guide', settings.readingGuide);
            updatePanelUI();
        }

        function updatePanelUI() {
            document.querySelectorAll('[data-access-action]').forEach(el => {
                const action = el.dataset.accessAction;
                if (action.startsWith('toggle-')) {
                    const key = action.replace('toggle-', '').replace(/-(\w)/g, (m, p1) => p1.toUpperCase());
                    el.classList.toggle('active', settings[key]);
                }
            });
        }

        function loadSettings() {
            const saved = localStorage.getItem('accessibilitySettings');
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                if (typeof loadedSettings.starCursor === 'undefined') {
                    loadedSettings.starCursor = false;
                }
                Object.assign(settings, loadedSettings);
            }
            applySettings();
        }

        settingsBtn.addEventListener('click', () => { panel.classList.toggle('visible'); });

        // Possible values for `data-access-action`:
        // - "increase-font": Increases the font size.
        // - "decrease-font": Decreases the font size.
        // - "reset-font": Resets the font size to default.
        // - "toggle-invert": Toggles inverted colors.
        // - "toggle-big-cursor": Toggles a larger cursor.
        // - "toggle-star-cursor": Toggles a star-shaped cursor.
        // - "toggle-highlight-links": Highlights all links.
        // - "toggle-reading-guide": Toggles a reading guide line.
        // - "reset-all": Resets all accessibility settings to default.
        panel.addEventListener('click', (e) => {
            const target = e.target.closest('[data-access-action]');
            if (!target) return;
            const action = target.dataset.accessAction;

            switch (action) {
                case 'increase-font': settings.fontSize = Math.min(24, settings.fontSize + 2); break;
                case 'decrease-font': settings.fontSize = Math.max(12, settings.fontSize - 2); break;
                case 'reset-font': settings.fontSize = 16; break;
                case 'toggle-invert': settings.invert = !settings.invert; break;
                case 'toggle-big-cursor': settings.bigCursor = !settings.bigCursor; break;
                case 'toggle-star-cursor': settings.starCursor = !settings.starCursor; break;
                case 'toggle-highlight-links': settings.highlightLinks = !settings.highlightLinks; break;
                case 'toggle-reading-guide': settings.readingGuide = !settings.readingGuide; break;
                case 'reset-all':
                    Object.assign(settings, {
                        fontSize: 16, invert: false, bigCursor: false,
                        starCursor: false, highlightLinks: false, readingGuide: false
                    });
                    break;
            }
            applySettings();
        });

        const readingGuide = document.getElementById('reading-guide');
        window.addEventListener('mousemove', (e) => {
            if (settings.readingGuide) readingGuide.style.top = `${e.clientY}px`;
        });

        loadSettings();
    }

    // ===================================
    // LETTER OF APPRECIATION SLIDESHOW
    // ===================================
    const testimonialsData = [
        {
            text: "বড় হও, আলো ছড়াও ।",
            name: "Assaduzzaman Noor",
            title: "Cultural Icon",
            type: "none",
            mediaUrl: ""
        },
        {
            text: "সামিন (তোমাকে) শুভেচ্ছা ।",
            name: "Ahsan Habib",
            title: "Cartoonist, Writer, and Editor",
            type: "none",
            mediaUrl: ""
        },
        {
            text: "Samin attended the SSC/Dakhil/SSC (Vocational) Examination in 2025 and achieved a remarkable GPA of 5. We wish him success.",
            name: "Prothom Alo-Shikho Team",
            title: "",
            type: "none",
            mediaUrl: ""
        }
    ];

    const slideshowWrapper = document.querySelector('.testimonial-slides-wrapper');
    const dotsContainer = document.querySelector('.testimonial-dots');

    if (slideshowWrapper && testimonialsData.length > 0) {
        slideshowWrapper.innerHTML = '';
        dotsContainer.innerHTML = '';

        testimonialsData.forEach((testimonial, index) => {
            const slide = document.createElement('div');
            slide.className = 'testimonial-slide';
            if (index === 0) slide.classList.add('active');

            let mediaHtml = '';
            if (testimonial.type === 'image' && testimonial.mediaUrl) {
                mediaHtml = `<div class="testimonial-media"><img src="${testimonial.mediaUrl}" alt="Letter of appreciation from ${testimonial.name}"></div>`;
            } else if (testimonial.type === 'pdf' && testimonial.mediaUrl) {
                mediaHtml = `<div class="testimonial-media"><a href="${testimonial.mediaUrl}" class="testimonial-doc-link" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf"></i> View Letter (PDF)</a></div>`;
            }

            slide.innerHTML = `
                ${mediaHtml}
                <blockquote>“${testimonial.text}”</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-author-info">
                        <div class="name">${testimonial.name}</div>
                        <div class="title">${testimonial.title}</div>
                    </div>
                </div>
            `;
            slideshowWrapper.appendChild(slide);

            const dot = document.createElement('button');
            dot.className = 'testimonial-dot';
            if (index === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dot.addEventListener('click', () => showSlide(index));
            dotsContainer.appendChild(dot);
        });

        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.testimonial-dot');
        const prevBtn = document.querySelector('.testimonial-nav-btn.prev');
        const nextBtn = document.querySelector('.testimonial-nav-btn.next');
        let currentSlide = 0;

        function showSlide(n) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            currentSlide = (n + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
        nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    }
});
