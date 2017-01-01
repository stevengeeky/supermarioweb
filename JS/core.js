/*
	Generic Game Engine
	Made by Steven Geeky
*/

// Globals
var game,
	CREATION_OPTIONS = {};
var updateFunctions = [],
	preUpdateFunctions = [];
var FRAME_RATE = 60;		// Slow Down or Speed Up The Game

// Input (Keyboard)
var keydowns = [], lastkeys = [];
window.onkeydown = function(e)
{
	if (!e.ctrlKey && document.activeElement == document.body)
		e.preventDefault();
	if (keydowns.indexOf(e.keyCode) == -1)
		keydowns.push(e.keyCode);
}
window.onkeyup = function(e)
{
	if (keydowns.indexOf(e.keyCode) != -1)
		keydowns.splice(keydowns.indexOf(e.keyCode), 1);
}
function isKeyDown(kc)
{
	return keydowns.indexOf(kc) != -1;
}
function getKeyDown(kc)
{
	return keydowns.indexOf(kc) != -1 && lastkeys.indexOf(kc) == -1;
}
function getKeyUp(kc)
{
	return keydowns.indexOf(kc) == -1 && lastkeys.indexOf(kc) != -1;
}
// Input (Mouse)
var mouse = { x:-1, y:-1, isDown:false, lastDown:false, last:{ x:-1, y:-1 }, pressed:{ x:-1, y:-1, which:1 }, released:{ x:-1, y:-1, which:1 } };
window.onmousedown = function(e)
{
	mouse.pressed = {
		x:e.pageX - game.mc.offsetLeft,
		y:e.pageY - game.mc.offsetTop,
		which:e.which
	}
	mouse.isDown = true;
}
window.onmousemove = function(e)
{
	mouse.x = e.pageX - game.mc.offsetLeft;
	mouse.y = e.pageY - game.mc.offsetTop;
}
window.onmouseup = function(e)
{
	mouse.released = {
		x:e.pageX - game.mc.offsetLeft,
		y:e.pageY - game.mc.offsetTop,
		which:e.which
	}
	mouse.isDown = false;
}
window.oncontextmenu = function(e)
{
	e.preventDefault();
}
function getMouseDown(w)
{
	if (typeof w == "number")
		return mouse.isDown && !mouse.lastDown && mouse.pressed.which == w;
	return mouse.isDown && !mouse.lastDown;
}
function getMouseUp(w)
{
	if (typeof w == "number")
		return !mouse.isDown && mouse.lastDown && mouse.released.which == w;
	return !mouse.isDown && mouse.lastDown;
}

// Load/Initializing
var fr, tcount = 0;
window.onload = function()
{
	document.body.style["user-select"] = "none";
	document.body.style["-webkit-touch-callout"] = "none";
	document.body.style["-webkit-user-select"] = "none";
	document.body.style["-moz-user-select"] = "none";
	document.body.style["-o-user-select"] = "none";
	
	window.onblur = function()
	{
		game.pauseMusic();
	}
	window.onfocus = function()
	{
		game.resumeMusic();
	}
	
	fr = Math.floor( 60 / FRAME_RATE );
	
	game = new Game();
	game.create(CREATION_OPTIONS);
	
	call("init");
	_loop();
}

// Loop
function _loop()
{
	requestAnimationFrame(_loop);
	tcount++;
	
	if (tcount % fr == 0)
	{
		mainUserUpdate();
		for (var i in preUpdateFunctions)
			preUpdateFunctions[i]();
		mainUpdate();
		for (var i in updateFunctions)
			updateFunctions[i]();
		
		lastkeys = keydowns.slice(0);
		mouse.lastDown = mouse.isDown;
		mouse.last.x = mouse.x;
		mouse.last.y = mouse.y;
	}
}

function mainUserUpdate()
{
	if (game.running.indexOf(false) == -1 || preBuffered.length > 0)
		call("update");
}
function mainUpdate(ov)
{
	if (game.running.indexOf(false) == -1 || preBuffered.length > 0/* || game.running.length == 1 && game.running[0] == false && buffered.length > 0*/)
	{
		game.update(ov);
		call("drawn");
	}
	else if (game.running.length == 1 && game.running[0] == false && buffered.length > 0)
	{
		game.update(true);
	}
}

function clearGame()
{
	//game.stopMusic();
	//game.stopSound();
	
	game.textures.clear();
	game.sprites.clear();
	//game.music.clear();
	game.timers.clear();
	game.counter = 0;
}

// Main Game related
function Game()
{
	this.mc;
	this.ctx;
	this.counter = 0;
	
	this.camera = { x:0, y:0, scale:{ x:1, y:1 } };
	this.texturePacks = new Dictionary();
	this.textures = new Dictionary();
	this.sprites = new Dictionary();
	
	this.music;
	this.sounds = new Dictionary();
	this.running = [];
	
	this.timers = new Dictionary();
	this.muteSounds = false;
	
	this.spriteFunctions = [];
	
	this.create = function(op)
	{
		this.mc = document.createElement("canvas");
		this.mc.style.background = op.background || "black";
		this.ctx = this.mc.getContext("2d");
		
		var self = this;
		
		if (op.fullscreen)
		{
			this.mc.style.position = "fixed";
			this.mc.style.left = "0";
			this.mc.style.top = "0";
			function resized()
			{
				this.mc.width = window.innerWidth;
				this.mc.height = window.innerHeight;
			}
			window.onresize = function(){
				resized.call(self);
			}
			resized.call(this);
		}
		else if (op.cancel)
		{
			var width = op.width || 640;
			var height = op.height || 480;
			this.mc.width = width;
			this.mc.height = height;
		}
		else
		{
			var width = op.width || 640;
			var height = op.height || 480;
			this.mc.style.position = "fixed";
			this.mc.width = width;
			this.mc.height = height;
			
			function resized()
			{
				var w, h, ar = 640 / 480;
				if (window.innerWidth - this.mc.width >= window.innerHeight - this.mc.height)
				{
					h = window.innerHeight;
					w = h * ar;
				}
				else
				{
					w = window.innerWidth;
					h = w / ar;
				}
				
				this.mc.style.width = w + "px";
				this.mc.style.height = h + "px";
				this.mc.style.left = (window.innerWidth - w) / 2 + "px";
				this.mc.style.top = (window.innerHeight - h) / 2 + "px";
			}
			window.onresize = function(){
				resized.call(self);
			}
			resized.call(this);
		}
		
		(op.parent || document.body).appendChild(this.mc);
	}
	this.addSprite = function(s)
	{
		if (typeof s.priority != "undefined" && s.priority == "first")
			this.sprites.addBefore(s);
		else
			this.sprites.add(s);
	}
	this.update = function(ov)
	{
		this.mc.width = this.mc.width;
		this.counter++;
		call("preDraw");
		
		for (var i = 0; i < this.sprites.values.length; i++)
		{
			var sp = this.sprites.values[i];
			if (sp.isRemoved)
			{
				this.sprites.values.splice(i, 1);
				i--;
				continue;
			}
			
			if (typeof ALL_OVERRIDE == "undefined" && !ov)
			{
				sp.x += sp.vx;
				if (typeof sp.updatedX == "function")
					sp.updatedX();
				sp.y += sp.vy;
				if (typeof sp.updatedY == "function")
					sp.updatedY();
			}
			if (typeof ALL_OVERRIDE != "undefined" && sp.texture.type != "color" && sp.texture.animation.length == 0 || typeof ALL_OVERRIDE == "undefined")
				if (sp.texture instanceof Texture && typeof sp.update == "function" && (this.running.indexOf(false) == -1 || preBuffered.length == this.running.length && this.running.indexOf(true) == -1))
					sp.update();
			
			for (var j in this.spriteFunctions)
				this.spriteFunctions[j](sp);
			var trans = this.transform(sp.x, sp.y);
			
			if (trans.x + sp.width * this.camera.scale.x > 0 && trans.x < this.mc.width && trans.y + sp.height * this.camera.scale.y > 0 && trans.y < this.mc.height)
				this.render(sp);
			sp.last = { x:sp.x, y:sp.y };
		}
		
		call("drawnSprites");
		
		for (var i = 0; i < this.textures.values.length; i++)
		{
			var tex = this.textures.values[i];
			if (tex.type == "texture")
			{
				tex.frame.counter++;
				if (tex.frame.counter >= tex.frame.interval)
				{
					tex.frame.counter = 0;
					tex.frame.current = (tex.frame.current + 4) % tex.animation.length;
				}
			}
		}
	}
	this.render = function(sp)
	{
		if (!(sp instanceof Sprite))
			return;
		var tex = sp.texture;
		if (!tex)
			return;
		
		if (tex.clear)
			return;
		var trans = this.transform(sp.x, sp.y);
		
		if (tex.type == "color")
		{
			this.ctx.fillStyle = tex.color;
			if (sp.geometry.type == "circle")
			{
				this.ctx.beginPath();
				this.ctx.arc(sp.x + sp.radius, sp.y + sp.radius, sp.radius, 0, 2 * Math.PI);
				this.ctx.fill();
			}
			else
				this.ctx.fillRect( trans.x, trans.y, sp.width * this.camera.scale.x, sp.height * this.camera.scale.y );
		}
		else if (tex.texturePack && tex.texturePack.image instanceof Image)
		{
			var anim = tex.animation;
			var f = tex.frame;
			var c = f.current;
			
			this.ctx.save();
			this.ctx.translate( Math.floor(trans.x), Math.floor(trans.y) );
			if (typeof tex.rotation != "undefined")
			{
				if (tex.rotation == 90 || tex.rotation == 180)
					this.ctx.translate( Math.floor(sp.width * this.camera.scale.x), 0 );
				if (tex.rotation == 180 || tex.rotation == 270)
					this.ctx.translate( 0, Math.floor(sp.height * this.camera.scale.y) );
				this.ctx.rotate(tex.rotation * Math.PI / 180);
			}
			if (tex.flipX || tex.flipY)
			{
				var img = tex.texturePack.image;
				var tc = document.createElement("canvas");
				var tctx = tc.getContext("2d");
				
				tc.width = sp.width * this.camera.scale.x;
				tc.height = sp.height * this.camera.scale.y;
				
				if (tex.flipX && tex.flipY)
				{
					tctx.translate(tc.width, tc.height);
					tctx.scale(-1, -1);
					tctx.drawImage( img, anim[c], anim[c + 1], anim[c + 2], anim[c + 3], 0, 0, tc.width, tc.height );
				}
				else if (tex.flipX)
				{
					tctx.translate(tc.width, 0);
					tctx.scale(-1, 1);
					tctx.drawImage( img, anim[c], anim[c + 1], anim[c + 2], anim[c + 3], 0, 0, tc.width, tc.height );
				}
				else if (tex.flipY)
				{
					tctx.translate(0, tc.height);
					tctx.scale(1, -1);
					tctx.drawImage( img, anim[c], anim[c + 1], anim[c + 2], anim[c + 3], 0, 0, tc.width, tc.height );
				}
				
				this.ctx.fillStyle = this.ctx.createPattern(tc, "repeat");
				this.ctx.fillRect( 0, 0, Math.floor(sp.width * this.camera.scale.x), Math.floor(sp.height * this.camera.scale.y) );
			}
			else
				this.ctx.drawImage( tex.texturePack.image, anim[c], anim[c + 1], anim[c + 2], anim[c + 3], 0, 0, Math.floor(sp.width * this.camera.scale.x) + 1, Math.floor(sp.height * this.camera.scale.y) + 1 );
			this.ctx.restore();
		}
		
		if (tex.type == "texture")
		{
			tex.frame.counter = this.counter % (tex.frame.interval + 1);
			if (tex.frame.counter == 0)
				tex.frame.current = (tex.frame.current + 4) % tex.animation.length;
		}
		
		if (typeof sp.drawn == "function")
			sp.drawn();
	}
	this.transform = function(p, b)
	{
		if (typeof b == "number")
			p = { x:p, y:b };
		
		return {
			x:(p.x - this.camera.x - this.mc.width / 2) * this.camera.scale.x + this.mc.width / 2,
			y:(p.y - this.camera.y - this.mc.height / 2) * this.camera.scale.y + this.mc.height / 2
		};
	}
	this.untransform = function(p, b)
	{
		if (typeof b == "number")
			p = { x:typeof p == "number" ? p : p.x, y:b };
		return {
			x:(p.x - this.mc.width / 2) / this.camera.scale.x + this.mc.width / 2 + this.camera.x,
			y:(p.y - this.mc.height / 2) / this.camera.scale.y + this.mc.height / 2 + this.camera.y
		};
	}
	
	this.resumeMusic = function()
	{
		if (this.music)
		{
			if (this.music.wasPlaying)
			{
				this.music.play();
				this.music.wasPlaying = false;
			}
		}
	}
	this.pauseMusic = function()
	{
		if (this.music)
		{
			this.music.pause();
			this.music.wasPlaying = true;
		}
	}
	this.pauseMusicS = function()
	{
		if (this.music)
		{
			this.music.stop();
			this.music.wasPlaying = true;
		}
	}
	this.stopMusic = function()
	{
		if (this.music)
			this.music.stop();
	}
	this.stopSound = function()
	{
		for (var i in this.sounds.values)
			this.sounds.values[i].stop();
	}
	this.musicPlaying = function()
	{
		if (this.music)
			return !this.music.audio.paused;
		
		return false;
	}
}

// Added things to game
function Sprite(op)
{
	this.x = op.x || 0;
	this.y = op.y || 0;
	this.width = op.width || op.w || 32;
	this.height = op.height || op.h || 32;
	this.radius = op.radius || op.rad || op.r || 1;
	this.texture = op.texture || op.tex || new Texture({ color:"rgba(0, 0, 0, 0)" });
	this.geometry = op.geometry || new Geometry({ type:(op.radius || op.rad || op.r) ? "circle" : "rectangle", x:this.x, y:this.y, width:this.width, height:this.height, radius:this.width / 2 || this.radius });
	this.vx = op.velocityX || op.velocityx || op.vx || op.vX || 0;
	this.vy = op.velocityY || op.velocityy || op.vy || op.vY || 0;
	this.type = op.type || "generic";
	this.last = { x:0, y:0 };
	this.isRemoved = false;
	
	this.markForRemoval = function()
	{
		this.isRemoved = true;
	}
	this.setAnimation = function(op)
	{
		if (this.texture.type == "texture")
		{
			if (typeof op.interval == "number")
				this.texture.frame.interval = op.interval;
			if (op.animation || op.anim)
			{
				this.texture.animation = op.animation || op.anim || [];
				this.texture.frame.current = this.texture.frame.current % this.texture.animation.length || 0;
				if (this.texture.animation.length >= 4)
				{
					var dx = this.width - this.texture.animation[2];
					var dy = this.height - this.texture.animation[3];
					//this.x += dx;								// These two lines of code cause severe collision glitches
					//this.width = this.texture.animation[2];
					this.y += dy;
					this.height = this.texture.animation[3];
				}
				this.geometry.width = this.width;
				this.geometry.height = this.height;
			}
			var fx = op.flipX;
			var fy = op.flipY;
			if (typeof fx != "undefined")
				this.texture.flipX = fx;
			if (typeof fy != "undefined")
				this.texture.flipY = fy;
			if (typeof op.rotation != "undefined")
				this.texture.rotation = op.rotation;
			this.texture.clear = op.clear || false;
		}
	}
	
	this.updatedX = op.updatedX || op.onUpdateX || function(){};
	this.updatedY = op.updatedY || op.onUpdateY || function(){};
	this.update = op.update || function(){};
	this.drawn = op.drawn || function(){};
}

function Geometry(op)
{
	(function(){
		for (var i in op)
			this[i] = op[i];
		this.x = this.x || 0;
		this.y = this.y || 0;
		if (!this.type)
		{
			this.type = "rectangle";
			this.width = op.width || op.w || 32;
			this.height = op.height || op.h || 32;
		}
	}).call(this)
}
function checkCollision(a, b)
{
	if (!(a instanceof Sprite) || !(b instanceof Sprite))
		return false;
	
	var ga = a.geometry;
	var gb = b.geometry;
	
	var na = { x:a.x + ga.x, y:a.y + ga.y, width:ga.width, height:ga.height, radius:ga.radius };
	var nb = { x:b.x + gb.x, y:b.y + gb.y, width:gb.width, height:gb.height, radius:gb.radius };
	var ram = 2;
	na.x += ram; na.y += ram; na.width -= ram * 2; na.height -= ram * 2;
	
	if (ga.type == "rectangle" && gb.type == "rectangle")
	{
		return na.x + na.width > nb.x && na.x < nb.x + nb.width &&
			   na.y + na.height * 2 > nb.y && na.y < nb.y + nb.height;
	}
	else if (ga.type == "rectangle" && gb.type == "circle")
		return checkCollision(b, a);
	else if (ga.type == "circle" && gb.type == "circle")
	{
		var ar = ga.radius || ga.rad || ga.r || 1;
		var br = gb.radius || gb.rad || gb.r || 1;
		var sub = { x:na.x - nb.x, y:na.y - nb.y };
		return Math.sqrt(sub.x * sub.x + sub.y * sub.y) < ar + br;
	}
	return false;
}
function liesWithin(op)
{
	var p = op.point, sp = op.sprite, g = null;
	if (sp)
		g = sp.geometry;
	
	if (p && g)
	{
		var n = { x:sp.x + g.x, y:sp.y + g.y, width:g.width, height:g.height, radius:g.radius };
		if (g.type == "circle")
		{
			var sub = { x:n.x - p.x, y:n.y - p.y };
			return Math.sqrt(sub.x * sub.x + sub.y * sub.y) <= n.radius;
		}
		else if (g.type == "rectangle")
		{
			return p.x >= n.x && p.x <= n.x + n.width &&
				   p.y >= n.y && p.y <= n.y + n.height;
		}
	}
	return false;
}

function Texture(op)
{
	(function(){
		var col = op.color || op.col;
		if (col)
		{
			this.type = "color";
			this.color = col;
		}
		else
		{
			this.type = "texture";
			if (op.texturePack)
				this.texturePack = op.texturePack;
			
			this.animation = op.animation || op.anim;
			var gs = op.gridSize || op.offset || op.gs || op.off;
			if (gs)
				for (var i in this.animation)
					this.animation[i] *= gs;
			else
				if (!this.animation)
					this.animation = [0, 0, 32, 32];
			this.frame = op.frame || { current:0, counter:0, interval:6 };
			this.flipX = op.flipX || op.flipx || false;
			this.flipY = op.flipY || op.flipy || false;
			this.rotation = op.rotation || op.rot || op.r || 0;
		}
	}).call(this);
}

function TexturePack(op)
{
	(function(){
		var src = op.src || op.source;
		this.src = src;
		
		if (src)
		{
			var img = new Image();
			var self = this;
			var cb = op.callback || op.cb;
			
			function loaded(img){
				this.image = img;
				if (typeof cb == "function")
					cb(this.image);
			}
			img.onload = function(){
				loaded.call(self, this);
			}
			img.src = src;
		}
	}).call(this);
}

function Sound(op)
{
	(function(){
		var src = op.src || op.source || "";
		this.src = src;
		
		var a = new Audio(src);
		a.loop = op.loop;
		a.autoplay = op.autoplay;
		
		var end = op.end || op.ended || op.onend || op.onended;
		if (typeof end == "function")
			a.onended = end;
		
		var self = this;
		this.audio = a;
		this.resetOnPlay = op.resetOnPlay;
		var cb = op.callback || op.cb || function(){};
		cb(a);
	}).call(this);
	this.play = function()
	{
		if (typeof this.audio != "undefined" && !game.muteSounds){
			if (this.resetOnPlay)
				this.audio.currentTime = 0;
			this.audio.play();
		}
	}
	this.pause = function()
	{
		if (typeof this.audio != "undefined")
			this.audio.pause();
	}
	this.stop = function()
	{
		if (typeof this.audio != "undefined")
		{
			try {
				this.audio.currentTime = 0;
				this.audio.pause();
			} catch (ex) {
				
			}
		}
	}
}

function Dictionary()
{
	this.keys = [];
	this.values = [];
	this.remove = function(k)
	{
		if (k instanceof Array)
			for (var i in k)
				this.remove(k[i]);
		else
		{
			k = k + "";
			var ind = this.keys.indexOf(k);
			if (ind == -1)
				return;
			this.keys.splice(ind, 1);
			this.values.splice(ind, 1);
		}
	}
	this.add = function(k, v)
	{
		if (typeof v == "undefined")
		{
			v = k;
			k = this.values.length + "";
		}
		if (k instanceof Array)
			for (var i = 0; i < k.length; i++)
				this.add(k[i], v[i]);
		else
		{
			k = "" + k;
			this.remove(k);
			this.keys.push(k);
			this.values.push(v);
			return v;
		}
	}
	this.addBefore = function(k, v)
	{
		if (typeof v == "undefined")
		{
			v = k;
			k = "0";
		}
		for (var i in this.keys)
		{
			var tk = this.keys[i];
			if (isNumber(tk))
				this.keys[i] = (+tk + 1) + "";
		}
		
		if (k instanceof Array)
			for (var i = 0; i < k.length; i++)
				this.addBefore(k[i], v[i]);
		else
		{
			k = "" + k;
			this.remove(k);
			this.keys.splice(0, 0, k);
			this.values.splice(0, 0, v);
			return v;
		}
	}
	this.get = function(k)
	{
		k = k + "";
		var ind = this.keys.indexOf(k);
		if (ind == -1)
			return;
		return this.values[ind];
	}
	this.clear = function()
	{
		this.keys = [];
		this.values = [];
	}
}

function isNumber(n)
{
	return !isNaN(+n);
}

function getTexturePack(src)
{
	for (var i in game.texturePacks.values)
	{
		var pack = game.texturePacks.values[i];
		if (pack.src == src)
			return pack;
	}
	return null;
}

// Helper functions
function call(fn, a, b, c)
{
	var f = window[fn];
	if (typeof f == "function")
		f(a, b, c);
}

function clone(obj)
{
	var temp = {};
	for (var i in obj)
		temp[i] = obj[i];
	return temp;
}

// Extended objects (to be loaded last)
// For easier input checking, the keys object
var keys={back:8,tab:9,enter:13,shift:16,control:17,alt:18,break:19,pause:19,caps:20,escape:27,space:32,pageup:33,pagedown:34,end:35,home:36,left:37,up:38,right:39,down:40,prntscrn:44,insert:45,delete:46,d0:48,d1:49,d2:50,d3:51,d4:52,d5:53,d6:54,d7:55,d8:56,d9:57,a:65,b:66,c:67,d:68,e:69,f:70,g:71,h:72,i:73,j:74,k:75,l:76,m:77,n:78,o:79,p:80,q:81,r:82,s:83,t:84,u:85,v:86,w:87,x:88,y:89,z:90,comma:188,period:190,backslash:191,tilde:192,leftbracket:219,forwardslash:220,rightbracket:221,quotes:222,leftClick:1,rightClick:3};