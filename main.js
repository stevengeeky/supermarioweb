// Main
var player, camBounds;
var loadFunctions = [], clevel = "";

var restSprites;
var dev = true;
var ct = 0, ld = new Date().getSeconds(), fps = 0;

function doLoad()
{
	// Sound effects
	game.muteSounds = typeof DISABLE_SOUND != "undefined";
	
	game.sounds.add("jump", new Sound({ source:"Sounds/jump.wav", resetOnPlay:true }));
	game.sounds.add("door", new Sound({ source:"Sounds/door.wav", resetOnPlay:true }));
	game.sounds.add("mushroom", new Sound({ source:"Sounds/mushroom.wav", resetOnPlay:true }));
	game.sounds.add("appear", new Sound({ source:"Sounds/appear.wav", resetOnPlay:true }));
	game.sounds.add("pipe", new Sound({ source:"Sounds/pipe.wav", resetOnPlay:true }));
	game.sounds.add("stomp", new Sound({ source:"Sounds/stomp.wav", resetOnPlay:true }));
	game.sounds.add("kick", new Sound({ source:"Sounds/kick.wav", resetOnPlay:true }));
	game.sounds.add("spring", new Sound({ source:"Sounds/spring.wav", resetOnPlay:true }));
	game.sounds.add("ricochet", new Sound({ source:"Sounds/ricochet.wav", resetOnPlay:true }));
	game.sounds.add("die", new Sound({ source:"Sounds/die.wav", resetOnPlay:true }));
	
	player = SPRITES.mario({ x:0, y:0, type:"player" });
	
	loaded();
}

function loaded()
{
	addBuffer(EFFECTS.immediateBlack);
	openLevel("Levels/sample.txt", function(){
		addBuffer(loadFunction);
		addBuffer(EFFECTS.fadeIn);
	});
	for (var i in loadFunctions)
		loadFunctions[i]();
	
	document.body.style.background = "black";
	
	var st = document.createElement("style");
	st.textContent = "a{text-decoration:none;color:lightgreen;}a:hover{text-decoration:underline;}";
	document.body.appendChild(st);
}

function update()
{
	if (!(player instanceof Sprite))
		return;
	setCamera();
	
	// Clamp player
	{
		if (player.x + player.width > game.camera.x + game.mc.width)
		{
			player.x = game.camera.x + game.mc.width - player.width;
			player.vx = 0;
		}
		if (player.x < game.camera.x)
		{
			player.x = game.camera.x;
			player.vx = 0;
		}
	}
}
function setCamera()
{
	game.camera.x = player.x - game.mc.width / 2 + player.width / 2;
	game.camera.y = player.y - game.mc.height / 2 + player.height / 2;
	if (camBounds)
		clampCamera();
}
function clampCamera()
{
	if (game.camera.x < camBounds.x)
		game.camera.x = camBounds.x;
	if (game.camera.y < camBounds.y)
		game.camera.y = camBounds.y;
	
	if (game.camera.x + game.mc.width > camBounds.x + camBounds.width)
		game.camera.x = camBounds.x + camBounds.width - game.mc.width;
	if (game.camera.y + game.mc.height > camBounds.y + camBounds.height)
		game.camera.y = camBounds.y + camBounds.height - game.mc.height;
}
function loadFunction()
{
	if (!player)
		player = SPRITES.mario({ x:0, y:0, type:"player" });
	
	game.sprites.add(["player"], [player]);
	game.camera.x = -game.mc.width / 2;
	game.camera.y = -game.mc.height / 2;
}
function openLevel(fn, cb)
{
	var xhr = new XMLHttpRequest();
	xhr.open("get", fn, true);
	xhr.send();
	
	xhr.onreadystatechange = function(e)
	{
		if (e.target.readyState == 4)
		{
			var t = e.target.responseText;
			readLevel(t, function(){
				if (typeof cb == "function")
					cb();
			});
		}
	}
}
function readLevel(s, cb)
{
	clearGame();
	game.resumeMusic();
	
	blocks = [];
	game.camera.x = -game.mc.width / 2;
	game.camera.y = -game.mc.height / 2;
	game.running.push(false);
	clevel = s;
	
	var lns = s.split("\n");
	for (var i in lns)
	{
		var l = lns[i];
		var t = l.split(" ");
		switch (t[0])
		{
			case "h_2":
				if (!camBounds)
					camBounds = {};
				camBounds.x = +t[1];
				camBounds.y = +t[2];
				camBounds.width = +t[3];
				camBounds.height = +t[4];
				break;
			case "bg":
				setBackground(t[1]);
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
					var spl = props.substring(props.indexOf("{") + 1, props.lastIndexOf("}")).split(",");
					
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
				game.stopMusic();
				game.music = new Sound({ source:t[1], loop:true });
				game.music.play();
				break;
		}
	}
	if (typeof cb == "function")
		cb();
	game.running.splice(game.running.indexOf(false), 1);
}
function strtoarr(s)
{
	s = s.replace(/\[|\]/g, "");
	var sp = s.split(",");
	for (var i in sp)
		sp[i] = +sp[i];
	return sp;
}

function drawn()
{
	if (getKeyDown(keys.d))
		if (dev)
			dev = false;
		else
			dev = true;
	
	game.ctx.save();
	game.ctx.lineWidth = 1;
	var fs = 27;
	var pad = 2;
	
	game.ctx.font = fs + "px Verdana";
	game.ctx.strokeStyle = "black";
	
	game.ctx.fillStyle = "white";
	/*if (player)
		text("Coins: " + player.coins, pad, pad + fs);
	*/
	game.ctx.fillStyle = "white";
	
	if (dev)
	{
		// Do FPS
		var cd = new Date().getSeconds();
		if (cd != ld)
		{
			fps = ct;
			ct = 0;
			ld = new Date().getSeconds();
		}
		else
			ct++;
		
		text("FPS: " + fps + " (CT: " + ct + ")", pad, pad + fs * 3);
		text("S: " + game.sprites.values.length, pad, pad + fs * 4);
	}
	
	game.ctx.restore();
}

function text(t, x, y)
{
	game.ctx.fillText(t, x, y);
	game.ctx.strokeText(t, x, y);
}