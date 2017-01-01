/*
    Default effects pack
    For custom effects:
        return true to resume gameplay, and false to keep effect code running
        Any effects relating to overdrawing should be appended to EFFECTS, and any involving any temporary involvement in gameplay mechanics
            should be added to PRE_EFFECTS.  These establishments must be followed in order for your effect to work properly
*/

var freezeInterval = 20;

var lerpValue = 0;
var lerpIncrease = 1;
var lerpDistance = 5;
var lTemp = 0;
var lerpUpdate;

(function()
{

var first = true;

var freezeTimer = 0;
var freezeLen = 30;
var freezeInt = 4;
var br = false;

var fTimer = 0;

var rcam = { x:0, y:0 };
var tcam = { x:0, y:0 };
var icam = 10;

var shakeLen = 20;
var shakeInt = 4;
var shakeExt = 10;
var shakeTimer = 0;

var galpha = 0;
var aincrate = .05;

PRE_EFFECTS.lerp = function()
{
    if (lTemp < lerpDistance)
    {
        lTemp += lerpIncrease;
        lerpValue += lerpIncrease;
    }
    
    if (lTemp >= lerpDistance)
    {
        lerpValue -= (lTemp - lerpDistance);
        lTemp = 0;
        return true;
    }
    if (typeof lerpUpdate == "function")
        lerpUpdate(lerpValue);
    
    return false;
}
EFFECTS.slowDown = function()
{
    FRAME_RATE = 20;
    fr = Math.floor( 60 / FRAME_RATE );
}
EFFECTS.speedUp = function()
{
    FRAME_RATE = 60;
    fr = 1;
}
EFFECTS.freeze = function(fint)
{
    fTimer++;
    if (fTimer >= freezeInterval)
    {
        fTimer = 0;
        return true;
    }
    return false;
}
EFFECTS.playerFlux = function()
{
    if (!player)
        return;
    if (first)
    {
        first = false;
        br = player.isBig;
        player.enableInput = false;
    }
    freezeTimer++;
    if ((freezeTimer - freezeTimer % freezeInt) % (freezeInt * 2) == 0)
        player.isBig = true;
    else
        player.isBig = false;
    if (freezeTimer >= freezeLen)
    {
        player.isBig = br;
        freezeTimer = 0;
        player.enableInput = true;
        return true;
    }
    
    return false;
}
PRE_EFFECTS.cameraPanH = function()
{
    if (!camBounds)
        return true;
    if (first)
    {
        first = false;
        rcam.x = game.camera.x;
        rcam.y = game.camera.y;
        tcam.x = game.camera.x;
        tcam.y = game.camera.y;
    }
    tcam.x += icam;
    
    game.camera.x = tcam.x;
    game.camera.y = tcam.y;
    if (tcam.x + game.mc.width >= camBounds.x + camBounds.width)
    {
        addBuffer(EFFECTS.fadeOut);
        addBuffer(function(){
            game.camera.x = rcam.x;
            game.camera.y = rcam.y;
        });
        addBuffer(EFFECTS.fadeIn);
        first = true;
        return true;
    }
    
    return false;
}
PRE_EFFECTS.cameraPanV = function()
{
    if (!camBounds)
        return true;
    if (first)
    {
        first = false;
        rcam.x = game.camera.x;
        rcam.y = game.camera.y;
        tcam.x = game.camera.x;
        tcam.y = game.camera.y;
    }
    tcam.y += icam;
    
    game.camera.x = tcam.x;
    game.camera.y = tcam.y;
    if (tcam.y + game.mc.height >= camBounds.y + camBounds.height)
    {
        addBuffer(EFFECTS.fadeOut);
        addBuffer(function(){
            game.camera.x = rcam.x;
            game.camera.y = rcam.y;
        });
        addBuffer(EFFECTS.fadeIn);
        return true;
    }
    
    return false;
}
PRE_EFFECTS.shake = function()
{
    shakeTimer++;
    if (shakeTimer >= shakeLen)
    {
        shakeTimer = 0;
        return true;
    }
    if ((shakeTimer - shakeTimer % shakeInt) % (shakeInt * 2) == 0)
    {
        game.camera.x += shakeExt;
        game.camera.y -= shakeExt;
    }
    else
    {
        game.camera.x -= shakeExt;
        game.camera.y += shakeExt;
    }
    return false;
}
PRE_EFFECTS.shakeV = function()
{
    shakeTimer++;
    if (shakeTimer >= shakeLen)
    {
        shakeTimer = 0;
        return true;
    }
    if ((shakeTimer - shakeTimer % shakeInt) % (shakeInt * 2) == 0)
        game.camera.y -= shakeExt;
    else
        game.camera.y += shakeExt;
    
    return false;
}
PRE_EFFECTS.shakeH = function()
{
    shakeTimer++;
    if (shakeTimer >= shakeLen)
    {
        shakeTimer = 0;
        return true;
    }
    if ((shakeTimer - shakeTimer % shakeInt) % (shakeInt * 2) == 0)
        game.camera.x -= shakeExt;
    else
        game.camera.x += shakeExt;
    
    return false;
}
EFFECTS.immediateBlack = function()
{
    galpha = 1;
    game.ctx.fillStyle = "rgba(0, 0, 0, " + galpha + ")";
    game.ctx.fillRect(0, 0, game.mc.width, game.mc.height);
}
EFFECTS.fadeOut = function()
{
    if (first)
    {
        first = false;
        galpha = 0;
    }
    galpha += aincrate;
    if (galpha >= 1)
    {
        galpha = 1;
        first = true;
        return true;
    }
    game.ctx.fillStyle = "rgba(0, 0, 0, " + galpha + ")";
    game.ctx.fillRect(0, 0, game.mc.width, game.mc.height);
    return false;
}
EFFECTS.fadeIn = function()
{
    if (first)
    {
        first = false;
        galpha = 1;
    }
    galpha -= aincrate;
    
    if (galpha <= 0)
    {
        galpha = 0;
        first = true;
        return true;
    }
    else
    {
        game.update(true);
        
        game.ctx.fillStyle = "rgba(0, 0, 0, " + galpha + ")";
        game.ctx.fillRect(0, 0, game.mc.width, game.mc.height);
    }
    
    return false;
}

}).call(window);