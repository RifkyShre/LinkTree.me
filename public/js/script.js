document.addEventListener('DOMContentLoaded', () => {
    // Error handling for better best practices
    window.addEventListener('error', (e) => {
        console.error('JavaScript Error:', e.error);
        // Don't show to user, just log for debugging
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled Promise Rejection:', e.reason);
        // Don't show to user, just log for debugging
    });

    // Use requestAnimationFrame for smooth animations
    const animateElements = (elements, animationFn) => {
        const animate = () => {
            elements.forEach((el, index) => animationFn(el, index));
        };
        requestAnimationFrame(animate);
    };

    // Apply custom colors to social icons with optimized animation
    const socialIcons = document.querySelectorAll('.social-icon');
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    animateElements(socialIcons, (icon, index) => {
        const color = isDarkMode && icon.dataset.colorDark
            ? icon.dataset.colorDark
            : icon.dataset.color;

        icon.querySelector('i').style.color = color;

        // Simplified stagger animation for better TBT
        icon.style.opacity = '0';
        icon.style.transform = 'scale(0.9)';

        setTimeout(() => {
            icon.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            icon.style.opacity = '1';
            icon.style.transform = 'scale(1)';
        }, 50 + (index * 20)); // Reduced delay
    });

    // Apply custom colors to link icons with optimized animation
    const linkCards = document.querySelectorAll('.link-card');

    animateElements(linkCards, (card, index) => {
        const color = card.dataset.color;
        const icon = card.querySelector('.link-icon');
        if (icon && color) {
            icon.style.color = color;
        }

        // Simplified stagger animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + (index * 30)); // Reduced delay
    });

    // Touch feedback for links (optimized)
    const interactiveElements = document.querySelectorAll('.link-card, .social-icon, .footer a');
    interactiveElements.forEach(el => {
        let touchTimeout;

        el.addEventListener('touchstart', function() {
            clearTimeout(touchTimeout);
            this.style.transform = this.style.transform ?
                this.style.transform.replace(/translateY\([^)]+\)/, 'translateY(-1px)') :
                'translateY(-1px)';
        }, { passive: true });

        el.addEventListener('touchend', function() {
            touchTimeout = setTimeout(() => {
                this.style.transform = this.style.transform.replace(/translateY\([^)]+\)/, '') || '';
            }, 100); // Reduced timeout
        }, { passive: true });
    });

    // Lazy load snow effect for better TBT
    function createSnowflakes() {
        const snowContainer = document.getElementById('snow-container');
        if (!snowContainer) return;

        // Reduce snowflakes on mobile for better performance
        const isMobile = window.innerWidth < 768;
        const snowflakeCount = isMobile ? 15 : 25; // Reduced counts

        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < snowflakeCount; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';

            // Random properties - simplified
            const size = (Math.random() * 2 + 2).toFixed(1);
            const left = Math.floor(Math.random() * 100);
            const duration = (Math.random() * 6 + 10).toFixed(1);
            const delay = (Math.random() * 10).toFixed(1);
            const opacity = (Math.random() * 0.3 + 0.2).toFixed(2);

            // Use CSS custom properties for better performance
            snowflake.style.setProperty('--size', `${size}px`);
            snowflake.style.setProperty('--left', `${left}%`);
            snowflake.style.setProperty('--duration', `${duration}s`);
            snowflake.style.setProperty('--delay', `${delay}s`);
            snowflake.style.setProperty('--opacity', opacity);

            fragment.appendChild(snowflake);
        }

        snowContainer.appendChild(fragment);
    }

    // Delay snow creation for better TBT
    if (window.innerWidth > 480) {
        setTimeout(createSnowflakes, 500); // Delay by 500ms
    }

    // Slider Captcha with Bot Protection
    class SliderCaptcha {
        constructor() {
            this.overlay = document.getElementById('captchaOverlay');
            this.track = document.getElementById('captchaTrack');
            this.ball = document.getElementById('captchaBall');
            this.target = document.getElementById('captchaTarget');
            this.status = document.getElementById('captchaStatus');
            this.resetBtn = document.getElementById('captchaReset');
            
            this.trackWidth = 320;
            this.ballSize = 48;
            this.targetWidth = 60;
            
            this.isDragging = false;
            this.ballX = 4;
            this.targetX = 150;
            this.isSolved = false;
            
            this.failedAttempts = 0;
            this.lastFailedTime = 0;
            this.minSolveTime = 800;
            this.startTime = 0;
            this.maxFailedPerMinute = 10;
            this.blockedUntil = 0;
            
            this.init();
        }
        
        init() {
            this.randomizeTarget();
            this.bindEvents();
            this.resetBtn.addEventListener('click', () => this.reset());
            
            const verifiedTime = localStorage.getItem('captchaVerifiedTime');
            const now = Date.now();
            const isVerified = localStorage.getItem('captchaVerified') === 'true';
            const isRecent = verifiedTime && (now - parseInt(verifiedTime)) < (24 * 60 * 60 * 1000);
            
            if (isVerified && isRecent) {
                this.hide();
            } else {
                this.show();
                if (now < this.blockedUntil) {
                    this.showBlockedMessage();
                }
            }
        }
        
        show() {
            this.overlay.classList.remove('hidden');
        }
        
        showBlockedMessage() {
            const remaining = Math.ceil((this.blockedUntil - Date.now()) / 1000);
            this.status.textContent = 'Terlalu banyak percobaan! Tunggu ' + remaining + ' detik.';
            this.status.className = 'captcha-status error';
            this.ball.style.pointerEvents = 'none';
        }
        
        randomizeTarget() {
            const maxPos = this.trackWidth - this.targetWidth - 10;
            const minDistance = 120; // Increased from 100 to 120 pixels minimum distance
            this.targetX = Math.floor(Math.random() * maxPos) + 10;
            
            // Ensure target is far enough from ball starting position (ball starts at 4px)
            while (Math.abs(this.targetX - 4) < minDistance) {
                this.targetX = Math.floor(Math.random() * maxPos) + 10;
            }
            
            this.target.style.left = this.targetX + 'px';
            this.target.style.display = 'block';
        }
        
        bindEvents() {
            var self = this;
            
            this.ball.addEventListener('mousedown', function(e) { self.startDrag(e); });
            this.ball.addEventListener('touchstart', function(e) { self.startDrag(e); }, {passive: false});
            
            document.addEventListener('mousemove', function(e) { self.drag(e); });
            document.addEventListener('touchmove', function(e) { self.drag(e); }, {passive: false});
            
            document.addEventListener('mouseup', function() { self.endDrag(); });
            document.addEventListener('touchend', function() { self.endDrag(); });
        }
        
        startDrag(e) {
            if (this.isSolved) return;
            if (Date.now() < this.blockedUntil) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            this.isDragging = true;
            this.dragStartX = this.getClientX(e);
            this.ballStartX = this.ballX;
            this.ball.style.transition = 'none';
            
            if (this.startTime === 0) {
                this.startTime = Date.now();
            }
        }
        
        drag(e) {
            if (!this.isDragging || this.isSolved) return;
            if (Date.now() < this.blockedUntil) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            var clientX = this.getClientX(e);
            var deltaX = clientX - this.dragStartX;
            var newX = this.ballStartX + deltaX;
            
            var maxX = this.trackWidth - this.ballSize - 4;
            if (newX < 4) newX = 4;
            if (newX > maxX) newX = maxX;
            
            this.ballX = newX;
            this.ball.style.left = newX + 'px';
            this.checkOverlap();
        }
        
        endDrag() {
            if (!this.isDragging) return;
            this.isDragging = false;
            
            var solveTime = Date.now() - this.startTime;
            this.startTime = 0;
            
            if (this.checkSuccess()) {
                this.success();
            } else {
                var now = Date.now();
                if (now - this.lastFailedTime < 1000) {
                    this.failedAttempts++;
                } else {
                    this.failedAttempts = 1;
                }
                this.lastFailedTime = now;
                
                if (this.failedAttempts > this.maxFailedPerMinute && solveTime < this.minSolveTime) {
                    this.blockedUntil = now + 30000;
                    this.showBlockedMessage();
                    return;
                }
                
                this.ball.style.transition = 'left 0.3s ease';
                this.ballX = 4;
                this.ball.style.left = '4px';
                this.target.classList.remove('highlight');
            }
        }
        
        getClientX(e) {
            if (e.touches && e.touches.length > 0) {
                return e.touches[0].clientX;
            }
            return e.clientX;
        }
        
        checkOverlap() {
            var ballCenter = this.ballX + this.ballSize / 2;
            var targetStart = this.targetX + 5;
            var targetEnd = this.targetX + this.targetWidth - 5;
            
            if (ballCenter >= targetStart && ballCenter <= targetEnd) {
                this.target.classList.add('highlight');
            } else {
                this.target.classList.remove('highlight');
            }
        }
        
        checkSuccess() {
            var ballCenter = this.ballX + this.ballSize / 2;
            var targetStart = this.targetX + 5;
            var targetEnd = this.targetX + this.targetWidth - 5;
            return ballCenter >= targetStart && ballCenter <= targetEnd;
        }
        
        success() {
            this.isSolved = true;
            this.ball.classList.add('success');
            this.ball.style.left = (this.targetX + (this.targetWidth - this.ballSize) / 2) + 'px';
            
            this.status.textContent = '✓ Captcha Berhasil!';
            this.status.className = 'captcha-status success';
            
            localStorage.setItem('captchaVerified', 'true');
            localStorage.setItem('captchaVerifiedTime', Date.now().toString());
            
            var self = this;
            setTimeout(function() { self.hide(); }, 1000);
        }
        
        hide() {
            this.overlay.classList.add('hidden');
        }
        
        reset() {
            this.isSolved = false;
            this.ballX = 4;
            this.ball.style.left = '4px';
            this.ball.classList.remove('success');
            this.ball.style.transition = 'left 0.3s ease';
            this.target.classList.remove('highlight');
            this.status.className = 'captcha-status';
            this.status.textContent = '';
            this.randomizeTarget();
            this.ball.style.pointerEvents = 'auto';
        }
    }
    
    new SliderCaptcha();

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        socialIcons.forEach(icon => {
            const color = e.matches && icon.dataset.colorDark 
                ? icon.dataset.colorDark 
                : icon.dataset.color;
            icon.querySelector('i').style.color = color;
        });
    });
});
