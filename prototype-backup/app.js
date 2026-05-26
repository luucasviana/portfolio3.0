document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. SMOOTH SCROLL NAVIGATION & SECTION SWITCHING
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const navTriggers = document.querySelectorAll('.nav-trigger');

    /**
     * Smoothly scrolls to a target section
     * @param {string} sectionId - The ID of the target section (e.g., 'sobre')
     */
    function scrollToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            // Smoothly scroll to the target section
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Update URL hash without causing a page jump
            history.pushState(null, null, `#${sectionId}`);
        }
    }

    // Attach click listeners to sidebar nav items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = item.getAttribute('data-section');
            scrollToSection(targetSectionId);
        });
    });

    // Attach click listeners to custom trigger buttons (like "Ver Projetos" inside hero)
    navTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = trigger.getAttribute('data-section');
            scrollToSection(targetSectionId);
        });
    });

    // Handle Logo click to scroll Home
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToSection('home');
        });
    }

    // Handle deep linking / refresh with hash
    const initialHash = window.location.hash.substring(1);
    const validSections = Array.from(sections).map(s => s.id);
    
    if (initialHash && validSections.includes(initialHash)) {
        // Delay scroll slightly to ensure page assets are fully loaded/rendered
        setTimeout(() => {
            scrollToSection(initialHash);
        }, 100);
    }

    // ==========================================================================
    // 2. INTERSECTION OBSERVER (NAVIGATION SYNC & IN-VIEW ANIMATIONS)
    // ==========================================================================
    const observerOptions = {
        root: null, // viewport
        rootMargin: '-30% 0px -40% 0px', // Trigger slightly before full viewport center for optimal timing
        threshold: 0.1 // Trigger as soon as 10% of the section is visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 1. Add class for fade-in / slide-up animation
                entry.target.classList.add('in-view');

                // 2. Update active status on left sidebar
                const currentSectionId = entry.target.id;
                navItems.forEach(item => {
                    if (item.getAttribute('data-section') === currentSectionId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    // Observe all sections
    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // ==========================================================================
    // 3. DYNAMIC MOUSE RADIAL GLOW EFFECT
    // ==========================================================================
    const bgGlow = document.getElementById('bgGlow');

    if (bgGlow && window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            
            // Modern, performant background glow positioning
            bgGlow.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(0, 173, 181, 0.06), transparent 80%)`;
        });
    }

    // ==========================================================================
    // 4. FLUID NEON GLOWING CURSOR TRAIL (CANVAS)
    // ==========================================================================
    const canvas = document.getElementById('cursorTrail');
    
    if (canvas && window.matchMedia('(hover: hover)').matches) {
        const ctx = canvas.getContext('2d');
        let points = [];
        const maxPathLength = 150; // Max cumulative path length in pixels
        
        // Match canvas size to viewport
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Track points on mouse move
        window.addEventListener('mousemove', (e) => {
            points.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            });
            
            // Limit points array size to keep loop lightweight
            if (points.length > 40) {
                points.shift();
            }
        });

        // Animation drawing loop
        function drawTrail() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const now = Date.now();
            // Filter out old points (fade after 300ms)
            points = points.filter(p => now - p.time < 300);
            
            // Trim queue to guarantee cumulative length under 150px
            let cumulativeLength = 0;
            let trimmedPoints = [];
            
            for (let i = points.length - 1; i >= 0; i--) {
                trimmedPoints.unshift(points[i]);
                if (i < points.length - 1) {
                    const dx = points[i].x - points[i+1].x;
                    const dy = points[i].y - points[i+1].y;
                    cumulativeLength += Math.sqrt(dx*dx + dy*dy);
                    if (cumulativeLength > maxPathLength) {
                        break;
                    }
                }
            }
            points = trimmedPoints;

            // Draw fluid tapered line segments
            if (points.length > 1) {
                for (let i = 1; i < points.length; i++) {
                    const p1 = points[i - 1];
                    const p2 = points[i];
                    
                    // Taper width and opacity from tail (0) to head (1)
                    const progress = i / points.length;
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    
                    ctx.lineWidth = 1 + progress * 2.5; // from 1px to 3.5px
                    ctx.strokeStyle = `rgba(0, 173, 181, ${progress * 0.75})`;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    // Glow shadow effect tapers off
                    ctx.shadowBlur = progress * 10;
                    ctx.shadowColor = '#00adb5';
                    
                    ctx.stroke();
                }
            }
            
            requestAnimationFrame(drawTrail);
        }
        
        requestAnimationFrame(drawTrail);
    }
});
