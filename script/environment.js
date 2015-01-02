document.observe("dom:loaded", function() {
    initializeWorld();
});


var canvas;
var ctx;
var collidableObjects = []; //array of other objects that could be collided with.
var objectSize = 50;
var objectColor = "FFFFFF";
var randomObjectColor = false;



collidableObject = function(e) {
    this.size = objectSize;
    this.position = {   x: Event.pointerX(e) - $('particleContainer').positionedOffset().left, 
                        y: Event.pointerY(e) - $('particleContainer').positionedOffset().top };
    this.id = "colObj" + collidableObjects.length;
    this.top = this.position.y;
    this.bottom = this.position.y + this.size;
    this.left = this.position.x;
    this.right = this.position.x + this.size;
    collidableObjects[collidableObjects.length] = this;
    this.collidableElement = createCollidableElement(this);
}

collidableObject.prototype = {
    update: function() {
        ctx.fillStyle = objectColor;
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);
    }

}

function createCollidableElement(obj) {
    var color = randomObjectColor ? randomColor() : objectColor;    
    var size = objectSize;
    collidableObjectEl = new Element('div', { 'class': 'collidableElement', 'id': "colObj" + (collidableObjects.length-1) });
    collidableObjectEl.setStyle({
        left: obj.position.x + "px",
        top: obj.position.y + "px",
        height: obj.size + "px",
        width: obj.size + "px",
        backgroundColor: '#' + color
    });
    collidableObjectEl.writeAttribute({ objectId: obj.id });
    collidableObjectEl.ondblclick = setAsParticleSource;
    $('particleContainer').insert({ bottom: collidableObjectEl });
    return collidableObjectEl;
}

function createCollidableObject(e) {
    if (e.target.id.indexOf('colObj') == -1) {
        var cObj = new collidableObject(e);
    }
}


function getCollidableObjectById(id) {
    for (var i = 0; i<collidableObjects.length; i++) {
        if (collidableObjects[i].id == id) {
            return collidableObjects[i];
        }
    }
    return false;
}


function initializeWorld() {
    $("particleContainer").setStyle({
    height: document.documentElement.clientHeight,
    width: document.documentElement.clientWidth
});
    canvas = $("particleContainer");
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    ctx = canvas.getContext("2d");

    top = 0;
    bottom = $('particleContainer').getHeight();
    left = 0;
    right = $('particleContainer').getWidth();

    $('gravityOptionText').value = gravity;
    $('gravityDirectionOptionCheckbox').checked = gravityDirection == -1;
    $('frictionOptionText').value = friction;
    $('particleToParticleCollisionOptionCheckbox').checked = collisionWithParticles;
    $('initialVelocityXOptionText').value = initialVelocityX;
    $('initialVelocityYOptionText').value = initialVelocityY;
    $('RandomVelocityOptionCheckbox').checked = randomVelocity;
    $('randomColorOptionCheckbox').checked = randomParticleColor;
    $('particleSizeOptionText').value = particleSize;
    $('startColorOptionText').value = startColor;
    $('endColorOptionText').value = endColor;
    $('particleDecay').value = decay;

    $('obstacleSizeOptionText').value = objectSize;
    $('obstacleColorOptionText').value = objectColor;
    $('obstacleRandomColorOptionCheckbox').checked = randomObjectColor;
}


function applyOptions() {
    top = 0;
    bottom = $('particleContainer').getHeight();
    left = 0;
    right = $('particleContainer').getWidth();

    gravity = $('gravityOptionText').value - 0;
    gravityDirection = $('gravityDirectionOptionCheckbox').checked ? -1 : 1;
    friction = $('frictionOptionText').value - 0;
    collisionWithParticles = $('particleToParticleCollisionOptionCheckbox').checked;
    initialVelocityX = $('initialVelocityXOptionText').value - 0;
    initialVelocityY = $('initialVelocityYOptionText').value - 0;
    randomVelocity = $('RandomVelocityOptionCheckbox').checked;
    randomParticleColor = $('randomColorOptionCheckbox').checked;
    particleSize = $('particleSizeOptionText').value - 0;
    startColor = $('startColorOptionText').value;
    endColor = $('endColorOptionText').value;
    decay = $('particleDecay').value - 0;

    objectSize = $('obstacleSizeOptionText').value - 0;
    objectColor = $('obstacleColorOptionText').value;
    randomObjectColor = $('obstacleRandomColorOptionCheckbox').checked;
}

function setAsParticleSource(e) {
    particleSources[particleSources.length] = getCollidableObjectById(e.target.id);
    Event.stop(e);
}