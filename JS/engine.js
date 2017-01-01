// To be used with the core; responsible for characterizing a mario game specifically
var blocks = [], bs = 32, bl = 1000;
var background;

var SPRITES = {		// May be used to make and extend differentiated types of sprites
	
}, PARALLAX_LEVEL = 2;		// How much impact the parallax scrolling effect has on the background (1 is none, everything above is a stronger level)
							// (The parallax effect occurs when the background appears to move at a slower pace than the foreground due to 3D perspective)
var MAPS = {
	
};
var EFFECTS = {
	
}, buffered = [];
var PRE_EFFECTS = {
	
}, preBuffered = [];

function init()
{
	game.texturePacks.add(0, new TexturePack({ source:"Packs/main.png", callback:function(){
		call("doLoad");
	} }));
	
	game.ctx.imageSmoothingEnabled = false;
	game.camera.x = -game.mc.width / 2;
	game.camera.y = -game.mc.height / 2;
	
	game.spriteFunctions.push(function(sp){
		doBlockCollision(sp);
	});
	
	preUpdateFunctions.push(preDoEffects);
	updateFunctions.push(doEffects);
}

function addBuffer(f)
{
	buffered.push(f);
	game.running.push(false);
}
function addPreBuffer(f)
{
	preBuffered.push(f);
	game.running.push(false);
}

function preDoEffects()
{
	if (preBuffered.length > 0)
	{
		var b = preBuffered[0];
		var r = b();
		
		if (typeof b == "function" && r || typeof b == "function" && typeof r == "undefined")
		{
			preBuffered.splice(0, 1);
			game.running.splice(game.running.indexOf(false), 1);
		}
	}
}
function doEffects()
{
	if (buffered.length > 0)
	{
		var b = buffered[0];
		var r = b();
		
		if (typeof b == "function" && r || typeof b == "function" && typeof r == "undefined")
		{
			buffered.splice(0, 1);
			game.running.splice(game.running.indexOf(false), 1);
		}
	}
}

function setBackground(fn)
{
	game.running.push(false);
	background = new Texture({ type:"texture", texturePack:new TexturePack({ source:fn, callback:function(){
		game.running.splice(game.running.indexOf(false), 1);
	} }) });
}

function loadSfx(a, b)
{
	for (var i = 0; i < a.length; i++)
		game.sounds.add(a[i], new Sound({ source:b[i] }));
}

function loadTexturePacks(l, cb)
{
	var f = l[0];
	game.texturePacks.add(f, new TexturePack({ source:f, callback:function(){
		l.splice(0, 1);
		if (l.length == 0)
			if (typeof cb == "function")
				cb();
		else
			loadTexturePacks(l, cb);
	} }));
}

function preDraw()
{
	if (background)
	{
		if (background.type == "color")
			game.mc.style.background = background.color;
		else if (background.type == "texture")
		{
			// Parallax Effect (Important that background is seamless)
			
			var cx = game.camera.x / PARALLAX_LEVEL * game.camera.scale.x;
			var cy = game.camera.y / PARALLAX_LEVEL * game.camera.scale.y;
			var p = background.texturePack;
			
			var img = p.image;
			if (img instanceof Image)
			{
				if (img && img.height > game.mc.height)
				{
					var ar = img.width / img.height;
					img.height = game.mc.height;
					img.width = img.height * ar;
				}
				var iw = img.width * game.camera.scale.x;
				var ih = img.height * game.camera.scale.y;
				
				if (img instanceof Image)
				{
					var mcx = cx < 0 ? cx - cx % iw - iw : cx - cx % iw;
					var mcy = cy < 0 ? cy - cy % ih - ih : cy - cy % ih;
					
					for (var x = mcx; x < mcx + game.mc.width + iw; x += iw)
						for (var y = mcy; y < mcy + game.mc.height + ih + game.mc.height ; y += ih)
							game.ctx.drawImage( img, Math.floor(x - cx), Math.floor(y - cy - game.mc.height), Math.floor(img.width * game.camera.scale.x) + 1, Math.floor(img.height * game.camera.scale.y) + 1 );
				}
			}
			
		}
	}
	
	var p = game.untransform({ x:0, y:0 });
	var wh = game.untransform({ x:game.mc.width, y:game.mc.height });
	wh.width = wh.x - p.x;
	wh.height = wh.y - p.y;
	
	var stx = mod(p.x);
	var sty = mod(p.y);
	
	if (camBounds)
	{
		if (stx < camBounds.x)
			stx = mod(camBounds.x);
		if (sty < camBounds.y)
			sty = mod(camBounds.y);
		
		if (stx + wh.width > camBounds.x + camBounds.width)
			wh.width = camBounds.x + camBounds.width - stx;
		if (sty + wh.height > camBounds.y + camBounds.height)
			wh.height = camBounds.y + camBounds.height - sty;
	}
	for (var x = stx; x < stx + wh.width + bs; x += bs)
	{
		for (var y = sty; y < sty + wh.height + bs; y += bs)
		{
			var b = bget(x / bs, y / bs);
			if (b instanceof Sprite)
				game.render(b);
		}
	}
}
function doBlockCollision(sp)
{
	if (!(sp.texture instanceof Texture) || typeof ALL_OVERRIDE != "undefined" && ALL_OVERRIDE)
		return;
	if (sp.ignoreCollision)
		return;
	
	if (typeof sp.collided == "function")
	{
		var b;
		
		b = bget(mod(sp.x + sp.width) / bs, mod(sp.y + sp.height) / bs);
		if (b)
			sp.collided( b );
		for (var x = mod(sp.x); x <= mod(sp.x + sp.width); x += bs)
		{
			b = bget(x / bs, mod(sp.y + sp.height) / bs);
			if (b)
				sp.collided( b );
		}
		for (var y = mod(sp.y); y <= mod(sp.y + sp.height); y += bs)
		{
			b = bget(mod(sp.x + sp.width) / bs, y / bs);
			if (b)
				sp.collided( b );
		}
		
		for (var x = mod(sp.x); x <= mod(sp.x + sp.width); x += bs)
			for (var y = mod(sp.y); y <= mod(sp.y + sp.height); y += bs)
			{
				b = bget(x / bs, y / bs);
				if (b)
					sp.collided( b );
			}
		
	}
}
function doPlayerCollision(sp)
{
	if (typeof ALL_OVERRIDE != "undefined" && ALL_OVERRIDE)
		return;
	var ram = 1;
	if (player)
	{
		if (player.ignoreCollision || sp.ignoreCollision)
			return;
		if (sp.x + sp.width - ram >= player.x && sp.x + ram <= player.x + player.width && sp.y + sp.height - ram >= player.y && sp.y + ram <= player.y + player.height)
			sp.collided(player, true);
	}
}
function doSpriteCollision(sp)
{
    if (typeof ALL_OVERRIDE != "undefined" && ALL_OVERRIDE)
        return;
    var ram = 1;
	for (var i in game.sprites.values)
	{
		var bsp = game.sprites.values[i];
		if (bsp != sp && !bsp.ignoreCollision)
		{
			if (sp.x + sp.width - ram >= bsp.x && sp.x + ram <= bsp.x + bsp.width && sp.y + sp.height - ram >= bsp.y && sp.y + ram <= bsp.y + bsp.height)
				sp.collided(bsp, true);
		}
	}
}
function getCollisionInfo(s, b, ov)
{
	var av = 8;
	if (!s.isBlock && !b.isBlock && !ov)
		av = 0;
	var lwx = av, lwy = av, ca = 15;
	var adam = 0;
	var ram = 2;
	s.x += ram; s.y += ram; s.width -= ram * 2; s.height -= ram * 2;
	
	var xp = s.x + s.width < b.x + lwx || s.x > b.x + b.width - lwx;
	var yp = s.y + s.height < b.y + lwy || s.y > b.y + b.height - lwy;
	
	var le = s.x + s.width - adam < b.x + ca && !yp && (s.vx > 0 || b.vx < 0);
	var ri = s.x + adam > b.x + b.width - ca && !yp && (s.vx < 0 || b.vx > 0);
	var to = s.y + s.height - adam < b.y + ca && !xp && (s.vy > 0 || b.vy < 0);
	var bo = s.y + adam > b.y + b.height - ca && !xp && (s.vy < 0 || b.vy > 0);
	
	s.x -= ram; s.y -= ram; s.width += ram * 2; s.height += ram * 2;
	
	return {
		left:le,
		right:ri,
		top:to && s.vy > 0,
		bottom:bo && s.vy < 0
	};
}
function getOnScreen(sp)
{
	var trans = game.transform(sp.x, sp.y);
	return trans.x + sp.width * game.camera.scale.x > 0 && trans.x < game.mc.width && trans.y + sp.height * game.camera.scale.y > 0 && trans.y < game.mc.height;
}
function underBounds(s)
{
	return s.y > camBounds.y + camBounds.height;
}

function addBlock(op)
{
	var b = new Sprite({ x:op.x * 32 || 0, y:op.y * 32 || 0, width:32, height:32, geometry:new Geometry({ type:"rectangle", x:0, y:0, width:32, height:32 }), texture:op.texture, type:op.type || "generic" });
	bset(op.x, op.y, b);
	return b;
}

function attachTextureSource(op)
{
	game.running.push(false);
	var tp = getTexturePack(op.source);
	var s = op.s || op.sprite;
	var nint = 6;
	if (op.interval)
		nint = op.interval;
	
	if (tp)
	{
		s.texture = new Texture({ type:"texture", texturePack:tp, animation:[], frame:{ current:0, counter:0, interval:nint } });
		game.running.splice(game.running.indexOf(false), 1);
		if (typeof op.callback == "function")
			op.callback();
	}
	else
	{
		tp = game.texturePacks.add(new TexturePack({ source:op.source, callback:function(){
			s.texture = new Texture({ type:"texture", texturePack:tp, animation:[], frame:{ current:0, counter:0, interval:nint } });
			game.running.splice(game.running.indexOf(false), 1);
			if (typeof op.callback == "function")
				op.callback();
		} }));
	}
}

function doCollisionInteraction(s, b, op, ov)
{
	op = op || {};
	op.top = typeof op.top == "boolean" ? op.top : true;
	op.bottom = typeof op.bottom == "boolean" ? op.bottom : true;
	op.left = typeof op.left == "boolean" ? op.left : true;
	op.right = typeof op.right == "boolean" ? op.right : true;
	
	var inf = getCollisionInfo(s, b, ov);
	if (inf.top && op.top)
	{
		s.vy = s.fallSpeed || .4;
		s.onGround = true;
		s.y = b.y - s.height;
	}
	if (inf.bottom && op.bottom)
	{
		s.vy = s.fallSpeed || .4;
		s.y = b.y + b.height + .01;
	}
	if (inf.left && op.left)
		s.x = b.x - s.width - .1;
	if (inf.right && op.right)
		s.x = b.x + b.width + .1;
	
	return inf;
}
function getCollisionBounds(b)
{
	if (typeof b != "string")
		b = b.type;
	
	var op = { left:true, right:true, top:true, bottom:true };
	switch (b)
	{
		case "blank":
		case "vine":
			op = { left:false, right:false, top:false, bottom:false };
			break;
		case "ledge":
			op = { left:false, right:false, top:true, bottom:false };
			break;
	}
	return op;
}

// Helper
function mod(v)
{
	return v < 0 ? v - v % bs - bs : v - v % bs;
}
function bget(x, y)
{
	x += bl;
	y += bl;
	return blocks[y * bl + x];
}
function bset(x, y, b)
{
	x += bl;
	y += bl;
	blocks[y * bl + x] = b;
}

function get(tp, anim)
{
	return new Texture({ texturePack:tp, animation:anim, offset:32 });
}