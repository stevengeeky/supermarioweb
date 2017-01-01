// Edit.js

CREATION_OPTIONS = { cancel:true };
var bgmusic = [];
var attribs;

var selected = [], panSpeed = 20, ctp = "";
var hovers = [], tps;
var sc, sctx, scamera = { x:0, y:0 }, ganim = [], copypasta = false,
	camBounds, resizingCamera = { x:false, y:false, width:false, height:false };

var ctexture, levelMusic, currentSong;
var spritetype, laston = false;
var ALL_OVERRIDE = true;

var ewin;

var BLOCK_TYPES = ["blank", "ledge", "solid", "hurt", "kill", "vine"],
	SPRITE_TYPES = ["koopa"];

var gfx = false, gfy = false, grot = 0;

function importLevel(s, cb)
{
	if (levelMusic instanceof Sound)
		levelMusic.stop();
	clearGame();
	blocks = [];
	
	var lns = s.split("\n");
	for (var i in lns)
	{
		var l = lns[i];
		var t = l.split(" ");
		switch (t[0])
		{
			case "h_1":
				game.camera.x = +t[1];
				game.camera.y = +t[2];
				scamera.x = +t[3];
				scamera.y = +t[4];
				game.camera.scale.x = +t[5];
				game.camera.scale.y = +t[6];
				break;
			case "h_2":
				camBounds.x = +t[1];
				camBounds.y = +t[2];
				camBounds.width = +t[3];
				camBounds.height = +t[4];
				break;
			case "bg":
				game.running.push(false);
				background = new Texture({ type:"texture", texturePack:new TexturePack({ source:t[1], callback:function(){
					game.running.splice(game.running.indexOf(false), 1);
				} }) });
				break;
			case "b":
				var bx = +t[1] / bs;
				var by = +t[2] / bs;
				var tex = new Texture({ type:"texture", texturePack:game.texturePacks.get(+t[4]), animation:strtoarr(t[3]) });
				var b = addBlock({ x:bx, y:by, texture:tex, type:t[5] });
				if (t.length > 6)
				{
					b.texture.flipX = JSON.parse(t[6]);
					b.texture.flipY = JSON.parse(t[7]);
					b.texture.rotation = JSON.parse(t[8]);
				}
				b.isBlock = true;
				b.orig = { x:b.x, y:b.y };
				break;
			case "s":
				var sp = SPRITES[t[3]]({ x:+t[1], y:+t[2] });
				var props = t[4];
				
				if (props)
				{
					sp.attributes = [];
					var spl = props.substring(1, props.length - 1).split(",");
					
					if (spl.length == 1 && spl[0] != "" || spl.length > 1)
					{
						for (var j in spl)
						{
							var p = spl[j];
							var nam = p.substring(0, p.indexOf(":"));
							
							var val = JSON.parse( p.substring(p.indexOf(":") + 1) );
							sp.attributes.push(nam);
							sp[nam] = val;
						}
					}
				}
				
				if (t.length > 5)
				{
					sp.texture.flipX = JSON.parse(t[5]);
					sp.texture.flipY = JSON.parse(t[6]);
					sp.texture.rotation = JSON.parse(t[7]);
				}
				game.sprites.add(sp);
				break;
			case "m":
				if (levelMusic)
					levelMusic.stop();
				levelMusic = new Sound({ source:t[1], loop:true });
				levelMusic.play();
				break;
		}
	}
	if (typeof cb == "function")
		cb();
}
function exportLevel()
{
	var s = "";
	s += "h_1 " + game.camera.x + " " + game.camera.y + " " + scamera.x + " " + scamera.y + " " + game.camera.scale.x + " " + game.camera.scale.y + "\n";
	s += "h_2 " + camBounds.x + " " + camBounds.y + " " + camBounds.width + " " + camBounds.height + "\n";
	s += "bg " + background.texturePack.src + "\n";
	var bs = "";
	var ps = [];
	for (var i in blocks)
	{
		var b = blocks[i];
		if (b instanceof Sprite){
			if (ps.indexOf(b.texture.texturePack.image.src) == -1)
				ps.push(b.texture.texturePack.image.src);
			bs += "b " + b.x + " " + b.y + " " + arrtostr(b.texture.animation) + " " + ps.indexOf(b.texture.texturePack.image.src) + " " + b.type.split(" ")[0] + " " + b.texture.flipX + " " + b.texture.flipY + " " + b.texture.rotation + "\n";
		}
	}
	for (var i in game.sprites.values)
	{
		var sp = game.sprites.values[i];
		
		if (sp.texture.type == "texture")
			bs += "s " + sp.x + " " + sp.y + " " + sp.type.split(" ")[0] + " {";
			var a = sp.attributes;
			if (a)
			{
				for (var j in a)
				{
					bs += a[j] + ":";
					var v = sp[a[j]];
					if (typeof v == "boolean" || typeof v == "number")
						bs += v;
					else if (typeof v == "string")
						bs += "\"" + v + "\"";
					else if (v instanceof Array)
						bs += arrtostr(v);
					bs += ",";
				}
				if (a.length > 0)
					bs = bs.substring(0, bs.length - 1);
			}
			bs += "} " + sp.texture.flipX + " " + sp.texture.flipY + " " + sp.texture.rotation + "\n";
	}/*
	for (var i in ps)
		s += "p " + ps[i] + "\n";*/
	s += bs;
	if (typeof levelMusic != "undefined" && levelMusic instanceof Sound)
		s += "m " + levelMusic.src + "\n";
	return s;
}
function arrtostr(a)
{
	if (a.length == 0)
		return "[]";
	var r = "[";
	for (var i = 0; i < a.length; i++)
	{
		var v = a[i];
		if (typeof v == "string")
			r += "\"" + v + "\"";
		else
			r += v;
		r += ",";
	}
	return r.substring(0, r.length - 1) + "]";
}
function strtoarr(s)
{
	s = s.replace(/\[|\]/g, "");
	var sp = s.split(",");
	for (var i in sp)
		sp[i] = +sp[i];
	return sp;
}
function download(name, text)
{
    var el = document.createElement("a");
    document.body.appendChild(el);
    el.setAttribute("href", "data:text/plain;charset:utf-8," + encodeURIComponent(text));
    el.setAttribute("download", name);
    el.click();
    document.body.removeChild(el);
}

function doLoad()
{
	background = new Texture({ texturePack:new TexturePack({ source:"Edit/Backgrounds/woven.png" }) });
	camBounds = { x:-game.mc.width / 2, y:-game.mc.height / 2, width:game.mc.width, height:game.mc.height };
	
	document.getElementById("bgchange").onclick = function()
	{
		var nf = prompt("Type in the name of the new background you would like to use (All backgrounds mentioned here are automatically assumed to be within the 'Backgrounds' folder):");
		if (nf)
		{
			if (nf.split(".").length == 1)
				nf += ".png";
			var tp = new TexturePack({ source:"Backgrounds/" + nf, callback:function(img){
				if (img)
					background = new Texture({ texturePack:tp });
			} });
		}
		clearInput();
	}
	document.getElementById("changemusic").onclick = function()
	{
		if (levelMusic instanceof Sound)
			levelMusic.pause();
		var nf = prompt("Please type the name of the music you would like to associate with this level (Music is assumed to be within the 'Music' folder) (Type 'none' to rid this level of its music)");
		if (nf)
		{
			if (nf.toLowerCase() == "none")
				levelMusic = undefined;
			else
			{
				if (nf.split(".").length == 1)
					nf += ".mp3";
				if (levelMusic)
					levelMusic.stop();
				levelMusic = new Sound({ source:"Music/" + nf, loop:true });
				if (currentSong)
					currentSong.pause();
				levelMusic.play();
			}
		}
		else if (levelMusic)
			levelMusic.play();
	}
	
	document.getElementById("togglemusic").onclick = function()
	{
		if (levelMusic instanceof Sound)
		{
			if (levelMusic.audio.paused)
				levelMusic.play();
			else
				levelMusic.pause();
		}
	}
	document.getElementById("addsprite").onclick = function()
	{
		var ty = spritetype.value;
		var p = game.untransform(game.mc.width / 2, game.mc.height / 2);
		var sp = SPRITES[ty]({ x:p.x, y:p.y });
		
		if (sp.x < camBounds.x)
			sp.x = camBounds.x + bs;
		if (sp.x + sp.width > camBounds.x + camBounds.width)
			sp.x = camBounds.x + camBounds.width - sp.width;
		if (sp.y < camBounds.y)
			sp.y = camBounds.y + bs;
		if (sp.y + sp.height > camBounds.y + camBounds.height)
			sp.y = camBounds.y + camBounds.height - sp.height;
		
		if (sp.width % bs == 0 && sp.height % bs == 0)
		{
			sp.x = mod(sp.x);
			sp.y = mod(sp.y);
		}
		
		if (typeof sp.priority != "undefined" && sp.priority == "first")
			game.sprites.addBefore(sp);
		else
			game.sprites.add(sp);
	}
	document.getElementById("dgame").onclick = function()
	{
		download("level.txt", exportLevel());
	}
	
	var cdiv = document.createElement("div");
	cdiv.style.position = "fixed";
	cdiv.style.left = "0";
	cdiv.style.top = "0";
	cdiv.style.right = "0";
	cdiv.style.bottom = "0";
	cdiv.style.background = "black";
	cdiv.style.visibility = "hidden";
	cdiv.style.opacity = "0";
	cdiv.style.transition = "opacity .5s";
	
	document.body.appendChild(cdiv);
	
	var ifr = document.createElement("iframe");
	ifr.style.position = "fixed";
	ifr.width = 640;
	ifr.height = 480;
	ifr.style.border = "none";
	ifr.src = "index.html";
	cdiv.appendChild(ifr);
	
	ewin = ifr.contentWindow;
	ewin.DISABLE_SOUND = true;
	
	cdiv.onclick = function(){
		cdiv.style.visibility = "hidden";
		cdiv.style.opacity = "0";
		ewin.game.muteSounds = true;
		game.running.splice(game.running.indexOf(false), 1);
	}
	
	function resized(){
		ifr.style.left = (window.innerWidth - ifr.width) / 2 + "px";
		ifr.style.top = (window.innerHeight - ifr.height) / 2 + "px";
	}
	window.onresize = resized;
	resized();
	
	document.getElementById("player").onclick = function()
	{
		var hasSpawnPoint = false;
		for (var i in game.sprites.values)
		{
			var sp = game.sprites.values[i];
			if (sp.type == "spawnPoint")
				hasSpawnPoint = true;
		}
		if (!hasSpawnPoint)
			return;
		
		ewin.game.muteSounds = false;
		
		if (typeof levelMusic != "undefined" && levelMusic instanceof Sound)
			levelMusic.stop();
		
		ewin.player.reset();
		ewin.addBuffer(EFFECTS.immediateBlack);
		
		cdiv.style.visibility = "visible";
		game.running.push(false);
		cdiv.style.opacity = "1";
		ifr.focus();
		
		ewin.readLevel(exportLevel(), function(){
			ewin.addBuffer(ewin.loadFunction);
			ewin.addBuffer(EFFECTS.fadeIn);
		});
	}
	
	tps = document.getElementById("texturePacks");
	tps.onchange = function()
	{
		ctexture.animation = [0, 0, bs, bs];
	}
	
	attribs = document.getElementById("attributes");
	updateTexturePacks();
	ganim = [0, 0, bs, bs];
	
	window.ondragover = function(e)
	{
		e.preventDefault();
	}
	window.ondrop = function(e)
	{
		e.preventDefault();
		var f = e.dataTransfer.files[0];
		
		addBuffer(EFFECTS.fadeOut);
		addBuffer(function(){
			var reader = new FileReader();
			reader.onload = function(){
				importLevel(reader.result, function(){
					addBuffer(EFFECTS.fadeIn);
				});
			}
			reader.readAsText(f);
		});
	}
	window.onblur = function()
	{
		if (levelMusic)
		{
			if (!levelMusic.audio.paused)
			{
				levelMusic.pause();
				levelMusic.wasPlaying = true;
			}
		}
	}
	window.onfocus = function()
	{
		if (levelMusic && levelMusic.wasPlaying)
		{
			levelMusic.play();
			levelMusic.wasPlaying = false;
		}
	}
	
	spritetype = document.getElementById("spritetype");
	spritetype.innerHTML = "";
	
	for (var i in SPRITES)
	{
		if (i != "mario")
		{
			var op = document.createElement("option");
			op.innerHTML = i;
			spritetype.appendChild(op);
		}
	}
	
	sc = document.getElementById("chooser");
	sc.width = 500;
	sc.height = 400;
	sc.style.background = "black";
	sctx = sc.getContext("2d");
	sctx.imageSmoothingEnabled = false;
	
	ctp = tps.value;
}
function getCurrentTextureIndex()
{
	for (var i = 0; i < game.texturePacks.values.length; i++)
	{
		var p = game.texturePacks.values[i];
		var img = p.image;
		if (img)
			if (p.src == tps.value)
				return i;
	}
}

function update()
{
	if (ewin && ewin.game)
		ewin.game.muteSounds = !ewin.document.hasFocus();
	hovers = [];
	
	choose();
	input();
	clampCamera();
}

function clampCamera()
{
	var lw = 2;
	var ta = game.untransform(0, 0);
	if (!camBounds)
		return;
	if (game.camera.x >= (camBounds.x + camBounds.width - lw) / game.camera.scale.x)
		game.camera.x = (camBounds.x + camBounds.width - lw) / game.camera.scale.x;
	if (game.camera.y >= (camBounds.y + camBounds.height - lw) / game.camera.scale.y)
		game.camera.y = (camBounds.y + camBounds.height - lw) / game.camera.scale.y;
	
	if (game.camera.x + game.mc.width <= (camBounds.x + lw) / game.camera.scale.x)
		game.camera.x = (camBounds.x + lw) / game.camera.scale.x - game.mc.width;
	if (game.camera.y + game.mc.height <= (camBounds.y + lw) / game.camera.scale.y)
		game.camera.y = (camBounds.y + lw) / game.camera.scale.y - game.mc.height;
}

function choose()
{
	if (!sc)
		return;
	if (tps.value == "")
		tps.value = tps.firstChild.innerHTML;
	sc.width = sc.width;
	
	var cind = getCurrentTextureIndex();
	var pack = game.texturePacks.get(cind);
	
	if (typeof pack.map == "undefined")
	{
		pack.map = [];
		if (typeof MAPS[pack.src] != "undefined")
			pack.map = MAPS[pack.src];
	}
	
	if (cursorInChoose() && isKeyDown(keys.space))
	{
		sc.style.cursor = "move";
		if (mouse.isDown)
		{
			scamera.x -= mouse.x - mouse.last.x;
			scamera.y -= mouse.y - mouse.last.y;
			
			if (scamera.x < 0)
				scamera.x = 0;
			if (scamera.x > pack.image.width - 1)
				scamera.x = pack.image.width - 1;
			if (scamera.y < 0)
				scamera.y = 0;
			if (scamera.y > pack.image.height - 1)
				scamera.y = pack.image.height - 1;
		}
	}
	else if (cursorInChoose())
	{
		sc.style.cursor = "default";
		var smouse = { x:mouse.x + game.mc.offsetLeft - sc.offsetLeft, y:mouse.y + game.mc.offsetTop - sc.offsetTop };
		var cmouse = { x:smouse.x + scamera.x, y:smouse.y + scamera.y };
		
		if (mod(cmouse.x) < pack.image.width && mod(cmouse.y) < pack.image.height)
		{
			if (getMouseDown(1))
			{
				ganim = [ mod(cmouse.x), mod(cmouse.y), bs, bs ];
				laston = false;
				selected = [];
				addBlockAttribs();
			}
			else if (getMouseDown(3))
				ganim.push( mod(cmouse.x), mod(cmouse.y), bs, bs );
			
			if (getMouseDown(1) || getMouseDown(3))
			{
				ctp = tps.value;
				gfx = false;
				gfy = false;
				grot = 0;
			}
		}
		
	}
	
	if (ctp != tps.value)
		return;
	sctx.drawImage( pack.image, -scamera.x, -scamera.y, pack.image.width, pack.image.height );
	sctx.strokeStyle = "red";
	sctx.lineWidth = 2;
	
	if (ctp == tps.value)
	{
		var anim = ganim;
		for (var i = 0; i < anim.length; i += 4)
			sctx.strokeRect( anim[i] - scamera.x, anim[i + 1] - scamera.y, anim[i + 2], anim[i + 3] );
	}
}

function cursorInChoose()
{
	var nmouse = { x:mouse.x + game.mc.offsetLeft - sc.offsetLeft, y:mouse.y + game.mc.offsetTop - sc.offsetTop };
	return nmouse.x >= 0 && nmouse.x <= sc.width && nmouse.y >= 0 && nmouse.y <= sc.height;
}

function input()
{
	if (document.activeElement != document.body)
		return;
	var dselect = false, nmouse = game.untransform(mouse), lnmouse = game.untransform(mouse.last);
	
	if (!attribs)
		return;
	var tbox = attribs.getBoundingClientRect();
	
	if (keydowns.length == 0)
	{
		var lwx = 2 / game.camera.scale.x;
		var lwy = 2 / game.camera.scale.y;
		
		if (nmouse.x >= camBounds.x - lwx && nmouse.x <= camBounds.x + lwx)
		{
			game.mc.style.cursor = "w-resize";
			if (getMouseDown(1))
				resizingCamera.x = true;
		}
		else if (nmouse.x >= camBounds.x + camBounds.width - lwx && nmouse.x <= camBounds.x + camBounds.width + lwx)
		{
			game.mc.style.cursor = "e-resize";
			if (getMouseDown(1))
				resizingCamera.width = true;
		}
		else if (nmouse.y >= camBounds.y - lwy && nmouse.y <= camBounds.y + lwy)
		{
			game.mc.style.cursor = "n-resize";
			if (getMouseDown(1))
				resizingCamera.y = true;
		}
		else if (nmouse.y >= camBounds.y + camBounds.height - lwy && nmouse.y <= camBounds.y + camBounds.height + lwy)
		{
			game.mc.style.cursor = "s-resize";
			if (getMouseDown(1))
				resizingCamera.height = true;
		}
		else if (!(resizingCamera.x || resizingCamera.y || resizingCamera.width || resizingCamera.height))
			game.mc.style.cursor = "default";
	}
	if (resizingCamera.x || resizingCamera.y || resizingCamera.width || resizingCamera.height)
	{
		selected = [];
		var diff = { x:nmouse.x - lnmouse.x, y:nmouse.y - lnmouse.y };
		var rb = { right:camBounds.x + camBounds.width, bottom:camBounds.y + camBounds.height };
		
		if (resizingCamera.x)
		{
			if (rb.right - (camBounds.x + diff.x) >= game.mc.width && nmouse.x <= camBounds.x + camBounds.width - game.mc.width)
			{
				camBounds.x += diff.x;
				camBounds.width -= diff.x;
			}
		}
		if (resizingCamera.y)
		{
			if (rb.bottom - (camBounds.y + diff.y) >= game.mc.height && nmouse.y <= camBounds.y + camBounds.height - game.mc.height)
			{
				camBounds.y += diff.y;
				camBounds.height -= diff.y;
			}
		}
		if (resizingCamera.width)
		{
			if ((camBounds.width + diff.x) >= game.mc.width && nmouse.x >= camBounds.x + game.mc.width)
				camBounds.width += diff.x;
		}
		if (resizingCamera.height)
		{
			if ((camBounds.height + diff.y) >= game.mc.height && nmouse.y >= camBounds.y + game.mc.height)
				camBounds.height += diff.y;
		}	
	}
	else
	{
		if (getMouseDown() && !cursorInBounds() && !cursorInChoose() && mouse.x < tbox.left - game.mc.offsetLeft)
		{
			clearAttributes();
			selected = [];
		}
		if (selected.length == 0)
		{
			if (isKeyDown(keys.left))
				game.camera.x -= panSpeed;
			if (isKeyDown(keys.right))
				game.camera.x += panSpeed;
			if (isKeyDown(keys.up))
				game.camera.y -= panSpeed;
			if (isKeyDown(keys.down))
				game.camera.y += panSpeed;
		}
		else
		{
			if (getKeyDown(keys.delete) || getKeyDown(keys.back))
			{
				var hs = false;
				for (var i in selected)
				{
					var sp = selected[i];
					if (sp.isBlock)
					{
						bset(sp.x / bs, sp.y / bs, null);
					}
					else
					{
						var ind = game.sprites.values.indexOf(sp);
						game.sprites.values.splice(ind, 1);
						game.sprites.keys.splice(ind, 1);
						hs = true;
					}
					
				}
				
				if (hs)
				{
					gfx = false;
					gfy = false;
					grot = 0;
					ganim = [0, 0, bs, bs];
				}
				ctp = tps.value;
				selected = [];
				clearAttributes();
			}
		}
		
		if (isKeyDown(keys.space) && cursorInBounds())
		{
			game.mc.style.cursor = "move";
			if (mouse.isDown)
			{
				game.camera.x -= nmouse.x - lnmouse.x;
				game.camera.y -= nmouse.y - lnmouse.y;
			}
		}
		else if (isKeyDown(keys.s) && cursorInBounds())
		{
			game.mc.style.cursor = "crosshair";
			if (mouse.isDown)
			{
				game.camera.scale.x -= (nmouse.y - lnmouse.y) / 100 * game.camera.scale.x;
				if (game.camera.scale.x < .01)
					game.camera.scale.x = .01;
				
				game.camera.scale.y = game.camera.scale.x;
			}
		}
		else
		{
			//game.mc.style.cursor = "default";
			if (cursorInBounds())
			{
				/*if (getMouseDown(3) && selected.length == 1 && selected[0].isBlock)
				{
					var sp = selected[0];
					ganim = sp.texture.animation.slice(0);
					selected = [];
				}
				else */if (getMouseDown(3) && selected.length > 0 || getMouseDown(3) && selected.length == 1 && !selected[0].isBlock)
				{
					copypasta = true;
					
					var mx, my;
					for (var i in selected)
					{
						var sp = selected[i];
						
						if (typeof mx == "undefined")
							mx = sp.x;
						else
							mx = Math.min(mx, sp.x);
						if (typeof my == "undefined")
							my = sp.y;
						else
							my = Math.min(my, sp.y);
					}
					
					for (var i in selected)
					{
						var sp = selected[i];
						var nsp = new Sprite({ x:sp.x, y:sp.y, width:sp.width, height:sp.height, texture:new Texture({ texturePack:sp.texture.texturePack, animation:sp.texture.animation, frame:{ current:0, counter:0, interval:sp.texture.frame.interval }, flipX:sp.texture.flipX, flipY:sp.texture.flipY, rotation:sp.texture.rotation }), type:sp.type });
						nsp.description = sp.description;
						nsp.attributes = [];
						var attrs = sp.attributes || [];
						
						for (var j = 0; j < attrs.length; j++)
						{
							var n = attrs[j];
							nsp.attributes[j] = n;
							if (n.replace(/x|y/g, "") != "")
								nsp[n] = sp[n];
						}
						
						nsp.x = nsp.x - mx + nmouse.x;
						nsp.y = nsp.y - my + nmouse.y;
						
						nsp.x = mod(nsp.x);
						nsp.y = mod(nsp.y);
						if (sp.isBlock)
						{
							nsp.orig = { x:nsp.x, y:nsp.y };
							nsp.isBlock = true;
							bset(nsp.x / bs, nsp.y / bs, nsp);
						}
						else
							game.sprites.add(nsp);
						selected[i] = nsp;
					}
					if (selected.length == 1 && selected[0].isBlock)
					{
						ganim = selected[0].texture.animation.slice(0);
						gfx = selected[0].texture.flipX;
						gfy = selected[0].texture.flipY;
						grot = selected[0].texture.rotation;
						selected = [];
					}
				}
				else if (getMouseUp(3) && (mouse.x == mouse.pressed.x && mouse.y == mouse.pressed.y))
				{
					if (copypasta)
						copypasta = false;
					else
					{
						selected = [];
						var pack = game.texturePacks.get(getCurrentTextureIndex());
						var span = mod(pack.image.width) / bs + 1;
						var ty = pack.map[ganim[1] / bs * span + ganim[0] / bs];
						
						var b = addBlock({ x:mod(nmouse.x) / bs, y:mod(nmouse.y) / bs, texture:new Texture({ texturePack:pack, animation:ganim, flipX:gfx, flipY:gfy, rotation:grot }), type:ty });
						b.orig = { x:b.x, y:b.y };
						b.isBlock = true;
					}
				}
				
				for (var i = game.sprites.values.length - 1; i >= 0; i--)
				{
					var sp = game.sprites.values[i];
					if (nmouse.x >= sp.x && nmouse.x <= sp.x + sp.width && nmouse.y >= sp.y && nmouse.y <= sp.y + sp.height)
					{
						dselect = true;
						
						if (getMouseDown(1))
						{
							if (isKeyDown(keys.control))
							{
								if (selected.indexOf(sp) == -1)
									selected.push(sp);
							}
							else if (selected.length <= 1 || selected.indexOf(sp) == -1)
							{
								selected = [sp];
								laston = true;
							}
							
							if (sp.texture.texturePack)
							{
								tps.value = sp.texture.texturePack.src;
								ctp = sp.texture.texturePack.src;
								ganim = sp.texture.animation;
								gfx = sp.texture.flipX;
								gfy = sp.texture.flipY;
								grot = sp.texture.rotation;
							}
						}
						else
							hovers = [{ x:sp.x, y:sp.y, width:sp.width, height:sp.height, color:"rgba(70, 70, 255, .3)" }];
						if (sp.texture.type == "texture")
							game.mc.title = sp.type + "<" + sp.x + ", " + sp.y + ">" + (typeof sp.description == "string" ? "\n" + sp.description : "") + "\nTextureSource: " + sp.texture.texturePack.src + "\nTextureAnimation: " + arrtostr(sp.texture.animation);
						break;
					}
				}
				
				var mp = game.untransform(mouse.pressed);
				if (selected.length == 0 && mouse.isDown && mouse.pressed.which == 3 && (mouse.x != mouse.pressed.x || mouse.y != mouse.pressed.y))
				{
					var a = mod(mp.x); var b = mod(mp.y);
					var c = mod(nmouse.x); var d = mod(nmouse.y);
					
					if (c < a)
					{
						var temp = c;
						c = a;
						a = temp;
					}
					if (d < b)
					{
						var temp = d;
						d = b;
						b = temp;
					}
					c += bs;
					d += bs;
					var tp = game.texturePacks.get(getCurrentTextureIndex());
					
					for (var x = a; x < c; x += bs)
						for (var y = b; y < d; y += bs)
							hovers.push({ x:x, y:y, width:bs, height:bs, image:tp.image, sx:ganim[0], sy:ganim[1], sw:ganim[2], sh:ganim[3] });
				}
				else if (selected.length == 0 && getMouseUp(3) && (mouse.x != mouse.pressed.x || mouse.y != mouse.pressed.y))
				{
					var a = mod(mp.x); var b = mod(mp.y);
					var c = mod(nmouse.x); var d = mod(nmouse.y);
					
					if (c < a)
					{
						var temp = c;
						c = a;
						a = temp;
					}
					if (d < b)
					{
						var temp = d;
						d = b;
						b = temp;
					}
					c += bs;
					d += bs;
					var tp = game.texturePacks.get(getCurrentTextureIndex());
					selected = [];
					
					var span = mod(tp.image.width) / bs + 1;
					var ty = tp.map[ganim[1] / bs * span + ganim[0] / bs];
					
					for (var x = a; x < c; x += bs)
						for (var y = b; y < d; y += bs)
						{
							var bl = addBlock({ x:x / bs, y:y / bs, texture:new Texture({ texturePack:tp, animation:ganim, flipX:gfx, flipY:gfy, rotation:grot }), type:ty });
							bl.isBlock = true;
							bl.orig = { x:bl.x, y:bl.y };
							selected.push(bl);
						}
				}
				else if (!dselect)
				{
					var b = bget( mod(nmouse.x) / bs, mod(nmouse.y) / bs );
					if (b instanceof Sprite)
					{
						dselect = true;
						b.isBlock = true;
						
						if (getMouseDown(1))
						{
							b.orig = { x:b.x, y:b.y };
							if (isKeyDown(keys.control))
							{
								if (selected.indexOf(b) == -1)
									selected.push(b);
							}
							else if (selected.length <= 1 || selected.indexOf(b) == -1)
							{
								selected = [b];
								laston = false;
								addBlockAttribs();
							}
							
							tps.value = b.texture.texturePack.src;
							ctp = b.texture.texturePack.src;
							ganim = b.texture.animation;
							gfx = b.texture.flipX;
							gfy = b.texture.flipY;
							grot = b.texture.rotation;
						}
						else if (!mouse.isDown)
							hovers = [{ x:b.x, y:b.y, width:b.width, height:b.height, color:"rgba(70, 70, 255, .3)" }];
						
						game.mc.title = b.type.toLowerCase() + "<" + b.x + ", " + b.y + ">\nTextureSource: " + b.texture.texturePack.src + "\nTextureAnimation: " + arrtostr(b.texture.animation);
					}
				}
				
				if (!dselect)
				{
					game.mc.title = "";
					if (getMouseDown(1) && cursorInBounds())
					{
						if (selected.length != 0)
						{
							for (var i in selected)
							{
								var s = selected[i];
								if (!s.isBlock)
								{
									ganim = [0, 0, bs, bs];
									gfx = false;
									gfy = false;
									grot = 0;
									break;
								}
							}
							selected = [];
							clearAttributes();
							ctp = tps.value;
							
	                        var tex = getTexturePack(ctp);
	                        if (tex)
	                        {
	                            var img = tex.image;
	                            for (var i = 0; i < ganim.length; i += 4)
	                            {
	                                if (ganim[i] + ganim[i + 2] > img.width || ganim[i + 1] + ganim[i + 3] > img.height)
	                                {
	                                    ganim = [0, 0, bs, bs];
	                                    break;
	                                }
	                            }
	                        }
						}
						
					}
				}
				
				var pt = game.untransform(mouse.pressed);
				if (selected.length == 0 && mouse.isDown && mouse.pressed.which == 1 && (mouse.x != mouse.pressed.x || mouse.y != mouse.pressed.y))
				{
					hovers.push({ x:pt.x, y:pt.y, width:nmouse.x - pt.x, height:nmouse.y - pt.y, borderColor:"darkgray", color:"rgba(170, 170, 170, .3)" });
				}
				else if (selected.length == 0 && getMouseUp(1) && (mouse.x != mouse.pressed.x || mouse.y != mouse.pressed.y))
				{
					var ta = Math.min(pt.x, nmouse.x);
					var tb = Math.min(pt.y, nmouse.y);
					var tc = Math.max(pt.x, nmouse.x);
					var td = Math.max(pt.y, nmouse.y);
					var r = { x:ta, y:tb, width:tc - ta, height:td - tb, color:"rgba(170, 170, 170, .5)" };
					
					selected = [];
					for (var i in game.sprites.values)
					{
						var sp = game.sprites.values[i];
						if (r.x + r.width >= sp.x && r.x <= sp.x + sp.width && r.y + r.height >= sp.y && r.y <= sp.y + sp.height)
							selected.push(sp);
					}
					
					var b;
					for (var x = mod(r.x); x < r.x + r.width; x += bs)
					{
						for (var y = mod(r.y); y < r.y + r.height; y += bs)
						{
							b = bget(x / bs, y / bs);
							if (b && selected.indexOf(b) == -1)
							{
								b.isBlock = true;
								b.orig = { x:b.x, y:b.y };
								selected.push(b);
							}
						}
					}
					for (var x = mod(r.x); x < r.x + r.width; x += bs)
					{
						b = bget(x / bs, mod(r.y + r.height) / bs);
						if (b && selected.indexOf(b) == -1)
						{
							b.isBlock = true;
							b.orig = { x:b.x, y:b.y };
							selected.push(b);
						}
					}
					for (var y = mod(r.y); y < r.y + r.height; y += bs)
					{
						b = bget(mod(r.x + r.width) / bs, y / bs);
						if (b && selected.indexOf(b) == -1)
						{
							b.isBlock = true;
							b.orig = { x:b.x, y:b.y };
							selected.push(b);
						}
					}
					b = bget(mod(r.x + r.width) / bs, mod(r.y + r.height) / bs);
					if (b && selected.indexOf(b) == -1)
					{
						b.isBlock = true;
						b.orig = { x:b.x, y:b.y };
						selected.push(b);
					}
				}
				
			}
		}
	}
	if (getMouseUp())
		resizingCamera = { x:false, y:false, width:false, height:false };
	
	if (selected.length > 0)
	{
		if (getMouseUp())
		{
			for (var i in selected)
			{
				var sp = selected[i];
				if (sp.isBlock)
				{
					bset(sp.orig.x / bs, sp.orig.y / bs, null);
					sp.orig = { x:sp.x, y:sp.y };
				}
			}
			for (var i in selected)
			{
				var sp = selected[i];
				if (sp.isBlock)
					bset(sp.x / bs, sp.y / bs, sp);
			}
			resizingCamera = { x:false, y:false, width:false, height:false };
		}
		else
		{
			if (selected.length == 1 && laston)
			{
				clearAttributes();
				var s = selected[0];
				if (!s.isBlock)
				{
					for (var i in s.attributes)
						addAttribute(selected[0], s.attributes[i]);
				}
			}
			
			var kx = getKeyDown(keys.x);
			var ky = getKeyDown(keys.y);
			var kr = getKeyDown(keys.r);
			
			for (var i in selected)
			{
				var sp = selected[i];
				var ms = bs;
				if (kx)
				{
					sp.texture.flipX = sp.texture.flipX ? false : true;
					gfx = sp.texture.flipX;
				}
				if (ky)
				{
					sp.texture.flipY = sp.texture.flipY ? false : true;
					gfy = sp.texture.flipY;
				}
				if (kr)
				{
					sp.texture.rotation = (sp.texture.rotation + 90) % 360;
					grot = sp.texture.rotation;
				}
				
				if (!sp.isBlock)
				{
					if (mouse.isDown && mouse.pressed.which == 1 && keydowns.length == 0 && !isKeyDown(keys.space) && !isKeyDown(keys.s))
					{
						if (sp.width % bs == 0 && sp.height % bs == 0)
						{
							sp.x += mod(nmouse.x) - mod(lnmouse.x);
							sp.y += mod(nmouse.y) - mod(lnmouse.y);
						}
						else
						{
							sp.x += nmouse.x - lnmouse.x;
							sp.y += nmouse.y - lnmouse.y;
						}
					}
					else if (getKeyDown(keys.left))
						sp.x -= ms;
					else if (getKeyDown(keys.right))
						sp.x += ms;
					else if (getKeyDown(keys.up))
						sp.y -= ms;
					else if (getKeyDown(keys.down))
						sp.y += ms;
				}
				else
				{
					if (mouse.isDown && mouse.pressed.which == 1 && !isKeyDown(keys.space) && !isKeyDown(keys.s))
					{
						if (selected.length == 1)
						{
							sp.x = mod(nmouse.x);
							sp.y = mod(nmouse.y);
						}
						else
						{
							sp.x += mod(nmouse.x) - mod(lnmouse.x);
							sp.y += mod(nmouse.y) - mod(lnmouse.y);
						}
					}
				}
				
				hovers.push({ x:sp.x, y:sp.y, width:sp.width, height:sp.height, color:"rgba(255, 150, 150, .3)" });
			}
		}
	}
}

function drawn()
{
	var t, ut;
	for (var i in hovers)
	{
		var h = hovers[i];
		if (h.color)
		{
			t = game.transform(h.x, h.y)
			game.ctx.fillStyle = h.color;
			game.ctx.strokeStyle = h.borderColor || h.color;
			
			game.ctx.fillRect(t.x, t.y, h.width * game.camera.scale.x, h.height * game.camera.scale.y);
			game.ctx.strokeRect(t.x, t.y, h.width * game.camera.scale.x, h.height * game.camera.scale.y);
		}
		else if (h.image)
		{
			t = game.transform(h.x, h.y);
			if (typeof h.sx == "number")
				game.ctx.drawImage( h.image, h.sx, h.sy, h.sw, h.sh, t.x, t.y,  h.width * game.camera.scale.x, h.height * game.camera.scale.y);
			else
				game.ctx.drawImage( h.image, t.x, t.y, h.width * game.camera.scale.x, h.height * game.camera.scale.y );
		}
	}
	
	/*game.ctx.beginPath();
	game.ctx.lineWidth = 1;
	game.ctx.strokeStyle = "lightgray";
	
	t = game.transform(0, 0);
	game.ctx.moveTo( t.x, 0 );
	game.ctx.lineTo( t.x, game.mc.height );
	
	game.ctx.moveTo( 0, t.y );
	game.ctx.lineTo( game.mc.width, t.y );
	
	game.ctx.stroke();*/
	if (!camBounds)
		return;
	game.ctx.beginPath();
	game.ctx.lineWidth = 2;
	game.ctx.strokeStyle = "red";
	
	t = game.transform(camBounds.x, camBounds.y);
	game.ctx.strokeRect( t.x, t.y, camBounds.width * game.camera.scale.x, camBounds.height * game.camera.scale.y );
	
	t = game.transform(camBounds.x + camBounds.width, camBounds.y + camBounds.height);
	var et = game.transform(camBounds.x, camBounds.y);
	ut = game.untransform(camBounds.x - camBounds.width, camBounds.y - camBounds.height);
	
	game.ctx.fillStyle = "black";
	game.ctx.fillRect( 0, 0, et.x, game.mc.height );
	game.ctx.fillRect( t.x, 0, game.mc.width - ut.x, game.mc.height );
	
	game.ctx.fillRect( 0, 0, game.mc.width, et.y );
	game.ctx.fillRect( 0, t.y, game.mc.width, game.mc.height - ut.y );
	
	t = game.transform(-game.mc.width / 2, -game.mc.height / 2);
	game.ctx.strokeStyle = "blue";
	game.ctx.strokeRect( t.x, t.y, game.mc.width * game.camera.scale.x, game.mc.height * game.camera.scale.y );
}

function updateTexturePacks()
{
	tps.innerHTML = "";
	for (var i in game.texturePacks.values)
	{
		var tp = game.texturePacks.values[i];
		if (tp.image)
		{
			var op = document.createElement("option");
			op.innerHTML = tp.src;
			tps.appendChild(op);
		}
	}
}

// Helper/Other
function clearInput()
{
	mouse.isDown = false;
	selected = [];
	keydowns = [];
}
function cursorInBounds()
{
	return mouse.x >= 0 && mouse.x <= game.mc.width && mouse.y >= 0 && mouse.y <= game.mc.height;
}

function rand(max)
{
	return Math.floor(Math.random() * max);
}
function chooseRandomSong()
{
	currentSong = bgmusic[rand(bgmusic.length)];
	currentSong.play();
}

// Properties
var aa = {};
function clearAttributes()
{
	aa = {};
	attribs.innerHTML = "";
}

function addAttribute(o, n, op)
{
	n = "" + n;
	var v = o[n];
	
	aa[n] = v;
	var np = document.createElement("div");
	var pn = document.createElement("label");
	var pv = document.createElement("label");
	pn.style["font-weight"] = "bold";
	pn.innerHTML = n + ": ";
	
	var ni = document.createElement("input");
	
	if (typeof op != "undefined")
	{
		ni = document.createElement("select");
		if (op.indexOf(n) == -1)
			op.push(n);
		for (var i in op)
		{
			var o = document.createElement("option");
			o.innerHTML = op[i];
			ni.appendChild(o);
		}
		ni.value = v;
	}
	else
	{
		if (typeof v == "boolean")
		{
			ni = document.createElement("select");
			var to = document.createElement("option");
			var fo = document.createElement("option");
			
			to.innerHTML = "true";
			fo.innerHTML = "false";
			ni.appendChild(to);
			ni.appendChild(fo);
			
			ni.value = "" + v;
			ni.onchange = function()
			{
				var a = JSON.parse(ni.value);
				aa[n] = a;
				o[n] = a;
			}
		}
		else if (v instanceof Array)
		{
			ni.value = arrtostr(v);
			ni.onchange = function()
			{
				var a = strtoarr(ni.value.replace(/ /g, ""));
				aa[n] = a;
				o[n] = a;
			}
		}
		else if (typeof v == "string" || typeof v == "number")
		{
			ni.value = v;
			if (typeof v == "number")
				ni.type = "number";
			
			ni.onchange = function()
			{
				if (ni.type == "number")
				{
					aa[n] = +ni.value;
					o[n] = +ni.value;
				}
				else
				{
					aa[n] = ni.value;
					o[n] = ni.value;
				}
			}
		}
	}
	
	pv.appendChild(ni);
	np.appendChild(pn);
	np.appendChild(pv);
	attribs.appendChild(np);
}

function addLabel(s)
{
	var d = document.createElement("div");
	var b = document.createElement("b");
	b.innerHTML = b;
	
	d.appendChild(b);
	attribs.appendChild(d);
}

function getAttribute(n)
{
	return aa[n];
}

function addBlockAttribs()
{
	var pack = game.texturePacks.get(getCurrentTextureIndex());
	
	clearAttributes();
	var c = document.createElement("canvas");
	var sf = 2;
	c.width = bs * sf;
	c.height = bs * sf;
	
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	attribs.appendChild(c);
	attribs.appendChild(document.createElement("br"));
	ctx.drawImage(pack.image, ganim[0], ganim[1], ganim[2], ganim[3], 0, 0, c.width, c.height);
	
	var xy = { x:ganim[0] / bs, y:ganim[1] / bs };
	var span = mod(pack.image.width) / bs + 1;
	if (typeof pack.map[xy.y * span + xy.x] == "undefined")
		pack.map[xy.y * span + xy.x] = "solid";
	
	var s = document.createElement("select");
	for (var i in BLOCK_TYPES)
	{
		var op = document.createElement("option");
		op.innerHTML = BLOCK_TYPES[i];
		s.appendChild(op);
	}
	s.onchange = function()
	{
		pack.map[xy.y * span + xy.x] = s.value;
	}
	
	s.value = pack.map[xy.y * span + xy.x];
	var nd = document.createElement("div");
	nd.innerHTML = "<b>type: </b>";
	nd.appendChild(s);
	attribs.appendChild(nd);
}

function clearUp(a)
{
	for (var i = 0; i < a.length; i++)
	{
		if (typeof a[i] == "undefined")
			a[i] = "solid";
	}
	return a;
}
function getTextureMap()
{
	return arrtostr( clearUp( game.texturePacks.get(getCurrentTextureIndex()).map ) );
}