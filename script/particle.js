var gravity = 1.04; //gravitational constant
var gravityDirection = 1; // -1 for fire and such, 1 for normal direction
var friction = .65; //coefficient of friction in the environment
var initialVelocityX = 0;
var initialVelocityY = 0;
var decay = .7; //particles will decay by this percentage each interval
var maxParticles = 500;
var interval = .055;  //interval to do update (in seconds);
var particleColor = "FFFFFF";
var particleSize = 5;
var randomVelocity = false; //indicates to generate a random velocity vector for each new particle.
var startColor = "FCFF59";
var endColor = "AA050D";
var randomParticleColor = false;
var collisionWithParticles = true;

var bottom; // will be set to the bottom of the container
var top; // top edge of container
var left; // left edge of container
var right; //right edge of container

var particles = []; //array of all particles in the environment
var particleSources = [];


var lastPosition = {};


//the periodical executer acts as the timing mechanism of the whole thing
new PeriodicalExecuter(function(pe) {
    updateParticles();
}, interval);


//the particle
Particle = function(obj) {
    this.size = obj.size;
    this.position = obj.position;
    this.velocity = obj.velocity  //unit based velocity object containing x and y velocity
    this.color = obj.color;
    this.id = obj.id;
    this.life = 100;
    this.midPointX = Math.round(this.position.x + particleSize / 2);
    this.midPointY = Math.round(this.position.y + particleSize / 2);
}

Particle.prototype = {

    //updates position with regard to time
    update: function(arrayPosition) {
        var old = { x: this.position.x, y: this.position.y };

        ctx.beginPath();
        ctx.fillStyle = getColor(this.color, endColor, this.life);
        ctx.arc(this.position.x, this.position.y, particleSize / 2, 0, 2 * Math.PI, false);
        ctx.fill();

        this.life -= decay;
        if (this.life >= 1) {
            if (collisionWithParticles) {
                this.checkForParticleCollision(arrayPosition);
            }
            this.checkForElementCollision();

            //apply gravity
            this.velocity.y += gravity * gravity * gravityDirection;

            //update positions based on velocity
            this.position.y = this.position.y + this.velocity.y;
            this.position.x = this.position.x + this.velocity.x;

            //keep particles in container
            //y
            if (this.position.y >= bottom - particleSize) { this.position.y = bottom - particleSize; }
            if (this.position.y <= top) { this.position.y = top; }
            //x
            if (this.position.x <= left) { this.position.x = left; }
            if (this.position.x >= right - particleSize) { this.position.x = right - particleSize; }

            this.checkForContainerCollision();

            //re-calculate mid-point
            this.midPointX = Math.round(this.position.x + (particleSize / 2));
            this.midPointY = Math.round(this.position.y + (particleSize / 2));

            gradient = ctx.createLinearGradient(old.x, old.y, this.position.x, this.position.y);
            gradient.addColorStop(0.0, "#000000");
            gradient.addColorStop(1.0, getColor(this.color, endColor, this.life));

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = particleSize;
            ctx.lineCap = "round";
            ctx.moveTo(old.x, old.y);
            ctx.lineTo(this.position.x, this.position.y);
            ctx.stroke();

            this.move(); //apply the new position in the document
        }
    },

    move: function() {
        ctx.beginPath();
        ctx.fillStyle = "#FFFFFF";
        ctx.arc(this.position.x, this.position.y, particleSize / 2, 0, 2 * Math.PI, false);
        ctx.fill();
        //    
        //        this.particleElement.setStyle({
        //            left: this.position.x + "px",
        //            top: this.position.y + "px",
        //            backgroundColor: getColor(this.color, endColor, this.life)
        //        });
        //this.particleElement.fire("particle:moved", this);
    },

    checkForParticleCollision: function(arrayPosition) {
        //this function will iterate through the arrays of particles in the x-buffer array and check for a matching y-value
        //for a mid-point collision.  if one is detected, it will update the trajectories of both particles accordingly

        for (var i = arrayPosition - 1; i > 0; i--) {
            if (this.collidesWith(particles[i])) { //collision!


                //get normal
                var normal = { x: particles[i].midPointX - this.midPointX,
                    y: particles[i].midPointY - this.midPointY
                };

                var t = Math.sqrt((normal.x * normal.x) + (normal.y * normal.y));

                //have to do this to make sure particles don't "stick" to each other
                if (t < 1) {
                    return;
                }



                //get unit vectors in relation to the collision
                var unitVectorNormal = { x: normal.x / t,
                    y: normal.y / t
                };

                var unitVectorTangent = { x: unitVectorNormal.y * -1,
                    y: unitVectorNormal.x
                };

                //get tangent and normal velocity vectors, post collision
                var v2n = unitVectorNormal.x * this.velocity.x + unitVectorNormal.y * this.velocity.y;
                var v1t = unitVectorTangent.x * this.velocity.x + unitVectorTangent.y * this.velocity.y;

                var v1n = unitVectorNormal.x * particles[i].velocity.x + unitVectorNormal.y * particles[i].velocity.y;
                var v2t = unitVectorTangent.x * particles[i].velocity.x + unitVectorTangent.y * particles[i].velocity.y;

                var finalNormalVelocityTHIS = { x: v1n * unitVectorNormal.x, y: v1n * unitVectorNormal.y };
                var finalTangentVelocityTHIS = { x: v1t * unitVectorTangent.x, y: v1t * unitVectorTangent.y };

                var finalNormalVelocityOTHER = { x: v2n * unitVectorNormal.x, y: v2n * unitVectorNormal.y };
                var finalTangentVelocityOTHER = { x: v2t * unitVectorTangent.x, y: v2t * unitVectorTangent.y };

                var finalVelocityTHIS = { x: finalNormalVelocityTHIS.x + finalTangentVelocityTHIS.x,
                    y: finalNormalVelocityTHIS.y + finalTangentVelocityTHIS.y
                };

                var finalVelocityOTHER = { x: finalNormalVelocityOTHER.x + finalTangentVelocityOTHER.x,
                    y: finalNormalVelocityOTHER.y + finalTangentVelocityOTHER.y
                };
                this.velocity = finalVelocityTHIS;
                particles[i].velocity = finalVelocityOTHER;
                return;
            }
        }
    },

    checkForElementCollision: function() {
        for (var i = 0; i < collidableObjects.length; i++) {
            //check for collision with top of object
            if (this.position.y < collidableObjects[i].top && this.position.y + this.velocity.y + particleSize >= collidableObjects[i].top) {
                if (this.position.x + particleSize >= collidableObjects[i].left && this.position.x <= collidableObjects[i].right) {
                    this.position.y = collidableObjects[i].top - particleSize;
                    this.velocity.y *= -1 * friction;
                    return;
                }
            }

            //check for collision with bottom of object
            if (this.position.y > collidableObjects[i].bottom && this.position.y + this.velocity.y <= collidableObjects[i].bottom) {
                if (this.position.x + particleSize >= collidableObjects[i].left && this.position.x <= collidableObjects[i].right) {
                    this.position.y = collidableObjects[i].bottom;
                    this.velocity.y *= -1 * friction;
                    return;
                }
            }

            //check for collision with left of object
            if (this.position.x < collidableObjects[i].left && this.position.x + this.velocity.x + particleSize >= collidableObjects[i].left) {
                if (this.position.y + particleSize >= collidableObjects[i].top && this.position.y <= collidableObjects[i].bottom) {
                    this.position.x = collidableObjects[i].left - particleSize;
                    this.velocity.x *= -1 * friction;
                    return;
                }
            }

            //check for collision with right of object
            if (this.position.x > collidableObjects[i].right && this.position.x + this.velocity.x <= collidableObjects[i].right) {
                if (this.position.y + particleSize >= collidableObjects[i].top && this.position.y <= collidableObjects[i].bottom) {
                    this.position.x = collidableObjects[i].right;
                    this.velocity.x *= -1 * friction;
                    return;
                }
            }
        }
    },

    checkForContainerCollision: function() {
        //check for collision in Y direction, reverses Y velocity, apply coefficient of friction from impact
        if (this.position.y == bottom - particleSize || this.position.y == top) {
            this.velocity.y *= -1 * friction;
        }

        //check for collision in X direction, reverses velocity, and apply coefficient of friction from impact
        if (this.position.x == left || this.position.x == right - particleSize) {
            this.velocity.x *= -1 * friction;
        }
    },

    collidesWith: function(otherParticle) {
        if (Math.abs(this.midPointX - otherParticle.midPointX) <= particleSize &&
            Math.abs(this.midPointY - otherParticle.midPointY) <= particleSize)
            return true;
        return false;
    }
};


function startCreatingParticles(e) {
    lastPosition = {x: Event.pointerX(e), y: Event.pointerY(e)};
    Event.observe($('particleContainer'), 'mousemove', createParticle);
}

function stopCreatingParticles() {
    Event.stopObserving($('particleContainer'), 'mousemove');
}

function createParticle(e) {
//    ctx.beginpath();
//    ctx.strokestyle = "#ffffff";
//    ctx.linewidth = particlesize;
//    ctx.linecap = "round";
//    ctx.linejoin = "round";
//    ctx.moveto(lastposition.x, lastposition.y);
//    ctx.lineto(event.pointerx(e), event.pointery(e));
//    ctx.stroke();
//    lastposition = { x: event.pointerx(e), y: event.pointery(e) };
//    return;
    if (particles.length < maxParticles) {
        if (e.id){ //create particle from source 
            particles[particles.length] = new Particle({
                size: particleSize,
                position: { x: e.left + Math.floor(Math.random() * (e.size + 1)),
                    y: gravityDirection == 1 ? e.bottom : e.top
                },
                velocity: getNewParticleVelocity(),
                color: startColor,
                id: "p" + particles.length
            });
        }
        else {
            for (var i = 0; i < 1; i++) {
                particles[particles.length] = new Particle({
                    size: particleSize,
                    position: { x: Event.pointerX(e),
                        y: Event.pointerY(e)
                    },
                    velocity: getNewParticleVelocity(),
                    color: startColor,
                    id: "p" + particles.length
                });
            }
        }
    }
}


//this function loops through all particles and calls their update method.
function updateParticles() {
    canvas.width = canvas.width;
    var i;
    for (i = 0; i < collidableObjects.length; i++) {
        collidableObjects[i].update();
    }
    
    for (i = 0; i < particles.length; i++) {
        if (particles[i].life < 1) {
            //particles[i].particleElement.remove();
            particles[i] = null;
            particles = particles.compact();
        }
        else {
            particles[i].update(i);
        }
    }
    if (particleSources.length) {
        for (i = 0; i < particleSources.length; i++) {            
            createParticle(particleSources[i]);
        }
    }
}

function getNewParticleVelocity() {
    var Xamount = 0;
    var Yamount = 0;

    if (randomVelocity) {
        var direction = Math.floor(Math.random() * 2) == 0 ? -1 : 1; //generate random positive or negative direction
        Xamount = Math.floor(Math.random() * 11) * direction;

        direction = Math.floor(Math.random() * 2) == 0 ? -1 : 1; //generate random positive or negative direction
        Yamount = Math.floor(Math.random() * 11) * direction;
    }
    else {
        Xamount = initialVelocityX;
        Yamount = initialVelocityY;
    }
    return { x: Xamount, y: Yamount };
}

function randomColor() {
    var color = "";
    var value;
    var values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
    for (var i = 0; i < 6; i++) {
        color += values[Math.floor(Math.random() * 16)];
    }
    return color;
}


/***********************************************
*
* Function : getColor
*
* Parameters : start - the start color (in the form "RRGGBB" e.g. "FF00AC")
* end - the end color (in the form "RRGGBB" e.g. "FF00AC")
* percent - the percent (0-100) of the fade between start & end
*
* returns : color in the form "#RRGGBB" e.g. "#FA13CE"
*
* Description : This is a utility function. Given a start and end color and
* a percentage fade it returns a color in between the 2 colors
*
* Author : Open Source
*
*************************************************/
function getColor(end, start, percent) {
    if (randomParticleColor) {
        start = randomColor();
        end = randomColor();
    }
    function hex2dec(hex) { return (parseInt(hex, 16)); }
    function dec2hex(dec) { return (dec < 16 ? "0" : "") + dec.toString(16); }

    var r1 = hex2dec(start.slice(0, 2));
    var g1 = hex2dec(start.slice(2, 4));
    var b1 = hex2dec(start.slice(4, 6));

    var r2 = hex2dec(end.slice(0, 2));
    var g2 = hex2dec(end.slice(2, 4));
    var b2 = hex2dec(end.slice(4, 6));

    var pc = percent / 100;

    var r = Math.floor(r1 + (pc * (r2 - r1)) + .5);
    var g = Math.floor(g1 + (pc * (g2 - g1)) + .5);
    var b = Math.floor(b1 + (pc * (b2 - b1)) + .5);

    return ("#" + dec2hex(r) + dec2hex(g) + dec2hex(b));
}






