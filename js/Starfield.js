import * as THREE from 'three';

export class Starfield {
    constructor() {
        this.stars = [];
        this.galaxies = [];
        this.starCount = 300;
        this.galaxyCount = 5;
        this.starSpeed = 20;
        this.shreds = [];
        this.starColors = [
            '#ffffff', // white
            '#ffe4b5', // moccasin
            '#87ceeb', // skyblue
            '#ffd700', // gold
            '#ff69b4', // hotpink
            '#00ff7f'  // springgreen
        ];
    }
    
    init(sceneManager) {
        this.sceneManager = sceneManager;
        this.createStars();
        this.createGalaxies();
    }
    
    createGalaxies() {
        this.galaxies = [];
        // Use the maximum dimension (width or height) for galaxy placement to ensure 
        // full coverage during rotation
        const maxDimension = Math.max(this.sceneManager.width, this.sceneManager.height);
        const centerX = this.sceneManager.centerX;
        const centerY = this.sceneManager.centerY;
        
        for (let i = 0; i < this.galaxyCount; i++) {
            // Generate galaxies within a circle with radius = maxDimension/2 * 1.2 (20% buffer)
            const distributionRadius = maxDimension * 0.6 * Math.sqrt(Math.random());
            const angle = Math.random() * Math.PI * 2;
            const galaxyCenterX = centerX + distributionRadius * Math.cos(angle);
            const galaxyCenterY = centerY + distributionRadius * Math.sin(angle);
            const galaxyRadius = Math.random() * 100 + 50;
            const galaxyRotation = Math.random() * Math.PI * 2;
            
            this.galaxies.push({
                x: galaxyCenterX,
                y: galaxyCenterY,
                radius: galaxyRadius,
                rotation: galaxyRotation,
                particles: Array(20).fill().map(() => ({
                    distance: Math.random() * galaxyRadius,
                    angle: Math.random() * Math.PI * 2,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.5,
                    color: this.starColors[Math.floor(Math.random() * this.starColors.length)]
                }))
            });
        }
    }
    
    createStars() {
        this.stars = [];
        // Use the maximum dimension (width or height) to ensure stars fill all rotational space
        const maxDimension = Math.max(this.sceneManager.width, this.sceneManager.height);
        const centerX = this.sceneManager.centerX;
        const centerY = this.sceneManager.centerY;
        
        for (let i = 0; i < this.starCount; i++) {
            // Generate stars within a circle with radius = maxDimension/2 * 1.2 (20% buffer)
            // to ensure full coverage during rotation
            const radius = maxDimension * 0.6 * Math.sqrt(Math.random()); // Using sqrt for uniform distribution
            const angle = Math.random() * Math.PI * 2;
            
            this.stars.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                radius: Math.random() * 2 + 0.5,
                speed: Math.random() * this.starSpeed + 10,
                brightness: Math.random() * 0.8 + 0.2,
                color: this.starColors[Math.floor(Math.random() * this.starColors.length)],
                twinkleSpeed: Math.random() * 5 + 2,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    createShredEffect(x, y) {
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            this.shreds.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (Math.random() * 2 + 2),
                vy: Math.sin(angle) * (Math.random() * 2 + 2),
                life: 1.0,
                color: this.starColors[Math.floor(Math.random() * this.starColors.length)]
            });
        }
    }
    
    update(deltaTime) {
        const ctx = this.sceneManager.ctx;
        const blackHoleCenterX = this.sceneManager.blackHole ? this.sceneManager.blackHole.x : this.sceneManager.centerX;
        const blackHoleCenterY = this.sceneManager.blackHole ? this.sceneManager.blackHole.y : this.sceneManager.centerY;
        const blackHoleRadius = this.sceneManager.blackHole ? this.sceneManager.blackHole.radius : 50;
        
        // Update and draw galaxies
        for (const galaxy of this.galaxies) {
            const dx = blackHoleCenterX - galaxy.x;
            const dy = blackHoleCenterY - galaxy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < blackHoleRadius) {
                // Create shredding effect and reset galaxy using max dimension
                this.createShredEffect(galaxy.x, galaxy.y);
                // Reset galaxy position using the same distribution logic as createGalaxies()
                const maxDimension = Math.max(this.sceneManager.width, this.sceneManager.height);
                const distributionRadius = maxDimension * 0.6 * Math.sqrt(Math.random());
                const angle = Math.random() * Math.PI * 2;
                galaxy.x = this.sceneManager.centerX + distributionRadius * Math.cos(angle);
                galaxy.y = this.sceneManager.centerY + distributionRadius * Math.sin(angle);
            } else {
                // Move galaxy toward black hole
                const angle = Math.atan2(dy, dx);
                const pullFactor = Math.min(30 / distance, 0.5);
                galaxy.x += Math.cos(angle) * pullFactor * deltaTime * 50;
                galaxy.y += Math.sin(angle) * pullFactor * deltaTime * 50;
                
                // Apply universe rotation
                const relX = galaxy.x - this.sceneManager.centerX;
                const relY = galaxy.y - this.sceneManager.centerY;
                const rotationSpeed = this.sceneManager.universeRotationSpeed;
                
                // Calculate rotation-induced velocity
                const rotationVelocityX = -relY * rotationSpeed;
                const rotationVelocityY = relX * rotationSpeed;
                
                // Apply rotation to galaxy position
                galaxy.x += rotationVelocityX * 60 * deltaTime;
                galaxy.y += rotationVelocityY * 60 * deltaTime;
                
                // Apply extra rotation to galaxy's own rotation
                galaxy.rotation += deltaTime * 0.2 + rotationSpeed * deltaTime;
                
                // Draw galaxy with its rotated particles
                for (const particle of galaxy.particles) {
                    const particleX = galaxy.x + Math.cos(particle.angle + galaxy.rotation) * particle.distance;
                    const particleY = galaxy.y + Math.sin(particle.angle + galaxy.rotation) * particle.distance;
                    
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particle.size, 0, Math.PI * 2);
                    ctx.fillStyle = particle.color.replace(')', `,${particle.opacity})`);
                    ctx.fill();
                }
            }
        }
        
        // Update and draw stars
        for (const star of this.stars) {
            const dx = blackHoleCenterX - star.x;
            const dy = blackHoleCenterY - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < blackHoleRadius) {
                // Create shredding effect and reset star using max dimension
                this.createShredEffect(star.x, star.y);
                // Reset star position using the same distribution logic as createStars()
                const maxDimension = Math.max(this.sceneManager.width, this.sceneManager.height);
                const radius = maxDimension * 0.6 * Math.sqrt(Math.random()); // Using sqrt for uniform distribution
                const angle = Math.random() * Math.PI * 2;
                star.x = this.sceneManager.centerX + radius * Math.cos(angle);
                star.y = this.sceneManager.centerY + radius * Math.sin(angle);
            } else {
                // Move star toward black hole
                const angle = Math.atan2(dy, dx);
                const pullFactor = Math.min(50 / distance, 1);
                
                star.x += Math.cos(angle) * star.speed * deltaTime * pullFactor;
                star.y += Math.sin(angle) * star.speed * deltaTime * pullFactor;
                
                // Apply universe rotation to stars
                const relX = star.x - this.sceneManager.centerX;
                const relY = star.y - this.sceneManager.centerY;
                const rotationSpeed = this.sceneManager.universeRotationSpeed;
                
                // Calculate rotation-induced velocity
                const rotationVelocityX = -relY * rotationSpeed;
                const rotationVelocityY = relX * rotationSpeed;
                
                // Apply rotation to star position
                star.x += rotationVelocityX * 60 * deltaTime;
                star.y += rotationVelocityY * 60 * deltaTime;
                
                // Twinkle effect
                star.twinklePhase += star.twinkleSpeed * deltaTime;
                const twinkleFactor = 0.3 * Math.sin(star.twinklePhase) + 0.7;
                
                // Draw star with glow
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.radius * 2
                );
                gradient.addColorStop(0, star.color.replace(')', `,${star.brightness * twinkleFactor})`));
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradient;
                ctx.arc(star.x, star.y, star.radius * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw star core
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = star.color.replace(')', `,${star.brightness * twinkleFactor})`);
                ctx.fill();
            }
        }
        
        // Update and draw shreds
        for (let i = this.shreds.length - 1; i >= 0; i--) {
            const shred = this.shreds[i];
            shred.x += shred.vx;
            shred.y += shred.vy;
            shred.life -= deltaTime;
            
            // Apply universe rotation to shreds
            const relX = shred.x - this.sceneManager.centerX;
            const relY = shred.y - this.sceneManager.centerY;
            const rotationSpeed = this.sceneManager.universeRotationSpeed;
            
            // Calculate rotation-induced velocity
            const rotationVelocityX = -relY * rotationSpeed;
            const rotationVelocityY = relX * rotationSpeed;
            
            // Apply rotation to shred position
            shred.x += rotationVelocityX * 60 * deltaTime;
            shred.y += rotationVelocityY * 60 * deltaTime;
            
            if (shred.life <= 0) {
                this.shreds.splice(i, 1);
                continue;
            }
            
            ctx.beginPath();
            ctx.arc(shred.x, shred.y, 1, 0, Math.PI * 2);
            ctx.fillStyle = shred.color.replace(')', `,${shred.life})`);
            ctx.fill();
        }
    }
}
