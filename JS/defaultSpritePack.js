// Default sprite pack, containing the main sprites
// All sprites here have been made by me, Steven Geeky
/*
	For Sprite Extensions (custom sprites essentially):
		all sprites by convention should be aimed to be stored within the SPRITES object
		your sprite must be self-supported (processes only within its update function and collided function, without the modification of the engine itself)
		sprites must include automatic texture mapping for different input response (for example, the mario sprite changes its animation depending on what buttons are pressed)
		functions/variables related to a specific sprite must stay within the sprite itself or its instantiation routine (no custom global variables)
*/

SPRITES.spawnPoint = function(op)
{
	var s = new Sprite(op);
	s.width = 31;
	s.height = 31;
	s.type = "spawnPoint";
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	s.description = "The initial start and spawn point associated with the player";
    
	attachTextureSource({ sprite:s, source:"Packs/marioPoses.png" });
	
	s.used = false;
	
	var pose = [7, 18, 30, 40,
				42, 18, 30, 40];
	
	var ydiff = 40 - s.height;
	if (typeof ALL_OVERRIDE != "undefined" && ALL_OVERRIDE)
		s.y += ydiff;
	var first = true;
	
	s.update = function()
	{
		if (typeof ALL_OVERRIDE != "undefined" && ALL_OVERRIDE)
			s.setAnimation({ anim:pose });
		else
			s.texture = new Texture({ color:"rgba(0, 0, 0, 0)" });
	}
	
	if (typeof player != "undefined" && player instanceof Sprite)
	{
		player.spawnCoordinates = { x:s.x, y:s.y - ydiff };
		player.x = s.x;
		player.y = s.y;
		if (player.isBig)
			player.y -= 18;
		s.isRemoved = true;
	}
	
	return s;
}

SPRITES.mario = function(op)
{
	var s = new Sprite(op);
	s.width = 31;
	s.height = 31;
	s.texture = null;
	var pind = game.texturePacks.length;
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	s.type = "player";
	
	// Set variables
	s.onGround = false;
	s.turnSpeed = op.turnSpeed || .5;
	s.fallSpeed = .4;
	s.fallCap = 9;
	s.acceleration = .3;
	s.capSpeed = 7;
	s.friction = .3;
	s.jumpSpeed = 9;
	s.locked = false;
	
	s.isBig = false;
	
	s.spawnCoordinates = { x:s.x, y:s.y };
	s.deathZone = game.mc.height / 2;
	
	s.onVine = false;
	s.climbSpeed = 1.5;
	
	s.isDead = false;
	s.deathTimer = 0;
	s.deathTimeout = 100;
	
	s.invTimer = 0;
	s.invLength = 100;
	s.blinking = false;
	s.enableInput = true;
	
	s.coins = 0;
	
	// Animation
	var poses = {
		standing:[7, 18, 30, 40],
		walking:[42, 18, 30, 40,
				  7, 18, 30, 40],
		turning:[280, 16, 30, 42],
		jumping:[210, 12, 32, 44],
		falling:[244, 14, 32, 40],
		onVine:[218, 66, 32, 40],
		climbing:[218, 66, 32, 40],
		died:[802, 12, 32, 48],
		
		big: {
			standing:[8, 118, 30, 58],
			walking:[8, 118, 30, 58,
					 42, 118, 32, 58,
					 76, 122, 32, 54],
			turning:[372, 124, 32, 58],
			jumping:[290, 118, 32, 62],
			falling:[336, 120, 32, 58],
			climbing:[526, 188, 32, 58]
		}
	};
	
	attachTextureSource({ sprite:s, source:"Packs/marioPoses.png" });
	
	// Functions related
	var lleft = false, lright = false, ly;
	s.x = s.spawnCoordinates.x;
	s.y = s.spawnCoordinates.y;
	s.vx = .001;
	
	var fvine = false;
	
	s.reset = function()
	{
		s.isBig = false;
		s.invTimer = 0;
		s.isDead = false;
		s.vx = 0;
		s.vy = 0;
		s.deathTimer = 0;
		s.ignoreCollision = false;
	}
	s.die = function(){
		s.isDead = true;
		s.isBig = false;
		s.vy = -10;
		s.vx = 0;
		s.ignoreCollision = true;
		game.pauseMusicS();
		game.sounds.get("die").play();
		
		s.setAnimation({ anim:poses.died });
		freezeInterval = 40;
		addBuffer(EFFECTS.freeze);
	}
	
	s.hurt = function(){
		if (s.invTimer > 0)
			return;
		if (!s.isBig)
			s.die();
		else
		{
			s.isBig = false;
			s.invTimer++;
			game.sounds.get("pipe").play();
		}
	}
	
	doAnimation = function()
	{
		var op = {};
		var fx;
		if (!ly)
			ly = s.y;
		
		if (s.enableInput)
		{
			if (isKeyDown(keys.left))
				fx = true;
			else if (isKeyDown(keys.right))
				fx = false;
		}
		
		if (s.isDead){
			op = { anim:poses.died };
		}
		else
		{
			var p = s.isBig ? poses.big : poses;
			
			if (s.onVine && keydowns.length > 0)
			{
				op = { anim:p.climbing };
				var int = 7;
				op.flipX = (game.counter - game.counter % int) % (int * 2) == 0;
			}
			else if (s.onVine)
				op = { anim:p.climbing };
			else if (!s.onGround && s.vy < 0)
				op = { anim:p.jumping, flipX:fx };
			else if (!s.onGround && s.vy > 0)
				op = { anim:p.falling, flipX:fx };
			else if (s.vx < 0 && isKeyDown(keys.right))
				op = { anim:p.turning, flipX:false };
			else if (s.vx > 0 && isKeyDown(keys.left))
				op = { anim:p.turning, flipX:true };
			else if (s.vx != 0)
				op = { anim:p.walking, flipX:fx };
			else if (s.vx == 0)
					op = { anim:p.standing };
		}
		op.clear = s.blinking;
		
		ly = s.y;
		lleft = isKeyDown(keys.left);
		lright = isKeyDown(keys.right);
		s.setAnimation(op);
	}
	
	s.update = function()
	{
		if (s.isDead)
		{
			s.vy += s.fallSpeed;
			if (s.deathTimer >= s.deathTimeout)
				doDeath();
			s.deathTimer++;
		}
		else
		{
			if (s.invTimer > 0)
			{
				s.invTimer++;
				if (s.invTimer >= s.invLength)
				{
					s.blinking = false;
					s.invTimer = 0;
				}
				else
				{
					if (s.invTimer % 5 == 0)
					{
						if (s.blinking)
							s.blinking = false;
						else
							s.blinking = true;
					}
				}
			}
			input();
		}
		if (s.y > s.deathZone + s.height)
			doDeath();
		doAnimation();
		s.onGround = false;
		if (!fvine)
			s.onVine = false;
		fvine = false;
	}
	doDeath = function()
	{
		game.running.push(false);
		game.pauseMusicS();
		
		if (!s.isDead)
		{
			game.sounds.get("die").play();
			freezeInterval = 200;
			addBuffer(EFFECTS.freeze);
		}
		
		s.reset();
		
		addBuffer(EFFECTS.fadeOut);
		addBuffer(function(){
			s.x = s.spawnCoordinates.x;
			s.y = s.spawnCoordinates.y;
			s.setAnimation({ anim:poses.standing, flipX:false, flipY:false });
			
			readLevel(clevel, function(){
				game.running.splice(game.running.indexOf(false), 1);
				loadFunction();
				addBuffer(EFFECTS.fadeIn);
			});
		});
		
	}
	input = function()
	{
		if (s.enableInput)
		{
			if (s.onVine)
			{
				if (isKeyDown(keys.left))
					s.vx = -s.climbSpeed;
				else if (isKeyDown(keys.right))
					s.vx = s.climbSpeed;
				else
					s.vx = 0;
				
				if (isKeyDown(keys.up))
					s.vy = -s.climbSpeed;
				else if (isKeyDown(keys.down))
					s.vy = s.climbSpeed;
				else
					s.vy = 0;
				
				if (getKeyDown(keys.space))
				{
					s.onVine = false;
					s.vy = -s.jumpSpeed * 6 / 7;
				}
			}
			else
			{
				if (isKeyDown(keys.left) && !s.locked)
					if (s.vx > 0)
						s.vx -= s.turnSpeed;
					else
						s.vx -= s.acceleration;
				else if (isKeyDown(keys.right) && !s.locked)
					if (s.vx < 0)
						s.vx += s.turnSpeed;
					else
						s.vx += s.acceleration;
				else if (s.onGround)
				{
					// Friction
					if (s.vx > 0)
						if (s.vx - s.friction < 0)
							s.vx = 0;
						else
							s.vx -= s.friction;
					else if (s.vx < 0)
						if (s.vx + s.friction > 0)
							s.vx = 0;
						else
							s.vx += s.friction;
				}
			}
		}
		if (!s.onVine)
			s.vy += s.fallSpeed;
		if (s.onGround && getKeyDown(keys.space) && s.enableInput && !s.onVine)
		{
			s.vy = -s.jumpSpeed;
			game.sounds.get("jump").play();
		}
		
		if (s.vx > s.capSpeed)
			s.vx = s.capSpeed;
		if (s.vx < -s.capSpeed)
			s.vx = -s.capSpeed;
		if (s.vy > s.fallCap)
			s.vy = s.fallCap;
	}
	s.collided = function(b)
	{
		if (s.isDead)
			return;
		
		if (b.type == "vine")
		{
			fvine = true;
			if (!s.onVine)
			{
				if (getKeyDown(keys.up))
					s.onVine = true;
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (inf.left && bounds.left || inf.right && bounds.right)
				s.vx = 0;
			
			if (b.type == "hurt")
				s.hurt();
			else if (b.type == "kill")
				s.die();
		}
	}
	
	return s;
}

SPRITES.greenShellKoopa = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 54;
	s.type = "greenShellKoopa";
	s.description = "A green koopa with a shell that will, when stomped on, generate a regular green koopa with a green koopa shell";
	
	s.vx = 1;
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	s.hit = false;
	s.attributes = ["x", "y", "vx"];
	
	var pose = [42, 6, 32, 54,
				80, 6, 32, 54];
	
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png" });
	
	function doAnimation()
	{
		var op = { anim:pose };
		if (s.hit)
			op.flipY = true;
		else if (s.vx < 0)
			op.flipX = true;
		else if (s.vx > 0)
			op.flipX = false;
		s.setAnimation(op);
	}
	s.update = function()
	{
		doAnimation();
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += s.fallSpeed;
		}
		else
		{
			s.vy += s.fallSpeed;
			if (s.fallSpeed > s.fallCap)
				s.fallSpeed = s.fallCap;
			
			s.y += (54 - 32);
			s.height = 32;
			doPlayerCollision(s);
			s.y -= (54 - 32);
			s.height = 54;
		}
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			if (b.type == "player")
			{
				var inf = getCollisionInfo(b, s);
				
				if (inf.top)
				{
					s.isRemoved = true;
					var k = SPRITES.greenKoopa({ x:s.x - 3, y:s.y });
					k.vx = s.vx;
					game.addSprite(k);
					game.addSprite(SPRITES.greenShell({ x:s.x + 3, y:s.y }));
					b.y = s.y - b.height - .01;
					b.vy = -9.5;
					game.sounds.get("stomp").play();
				}
				else if (inf.right || inf.left || inf.bottom)
					b.hurt();
				
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (inf.left && bounds.left)
				s.vx = -Math.abs(s.vx);
			else if (inf.right && bounds.right)
				s.vx = Math.abs(s.vx);
		}
	}
	
	return s;
}

SPRITES.redShellKoopa = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 54;
	s.type = "redShellKoopa";
	s.description = "A red koopa with a shell that will, when stomped on, generate a regular red koopa with a green koopa shell";
	
	s.vx = 1;
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	s.hit = false;
	s.attributes = ["x", "y", "vx"];
	
	s.longround = false;
	
	var pose = [42, 78, 32, 54,
				80, 78, 32, 54];
	
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png" });
	
	function doAnimation()
	{
		var op = { anim:pose };
		
		if (s.hit)
			op.flipY = true;
		else if (s.vx < 0)
			op.flipX = true;
		else if (s.vx > 0)
			op.flipX = false;
		s.setAnimation(op);
	}
	s.update = function()
	{
		doAnimation();
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += s.fallSpeed;
		}
		else
		{
			if (s.longround && !s.onGround && s.vy > 0)
			{
				s.vx = -s.vx;
				s.x -= s.vx;
				s.y -= s.vy;
				s.vy = s.fallSpeed;
			}
			s.longround = s.onGround;
			
			s.vy += s.fallSpeed;
			if (s.fallSpeed > s.fallCap)
				s.fallSpeed = s.fallCap;
			
			s.y += (54 - 32);
			s.height = 32;
			doPlayerCollision(s);
			s.y -= (54 - 32);
			s.height = 54;
			s.onGround = false;
		}
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			if (b.type == "player")
			{
				var inf = getCollisionInfo(b, s);
				
				if (inf.top)
				{
					s.isRemoved = true;
					var k = SPRITES.redKoopa({ x:s.x - 3, y:s.y });
					k.vx = s.vx;
					game.addSprite(k);
					game.addSprite(SPRITES.redShell({ x:s.x + 3, y:s.y }));
					b.y = s.y - b.height - .01;
					b.vy = -9.5;
					game.sounds.get("stomp").play();
				}
				else if (inf.right || inf.left || inf.bottom)
					b.hurt();
				
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (inf.left && bounds.left)
				s.vx = -Math.abs(s.vx);
			else if (inf.right && bounds.right)
				s.vx = Math.abs(s.vx);
		}
	}
	
	return s;
}

SPRITES.greenShell = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "greenShell";
	s.description = "A green shell that can be kicked by the player";
	
	s.speed = 8;
	s.isKicked = false;
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	var kinv = false;
	var ktimer = 0;
	var klen = 20;
	
	s.hit = false;
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png" });
	s.attributes = ["x", "y", "speed", "vx", "fallSpeed", "fallCap", "isKicked"];
	
	var poses = {
		normal:[606, 36, 32, 32],
		kicked:[568, 36, 32, 32,
				606, 36, 32, 32,
				644, 36, 32, 32]
	}
	
	function doAnimation()
	{
		var op = {};
		
		if (s.hit)
			op.flipY = true;
		else if (s.isKicked)
			op.anim = poses.kicked;
		else
			op.anim = poses.normal;
		s.setAnimation(op);
	}
	s.update = function()
	{
		doAnimation();
		s.vy += s.fallSpeed;
		if (s.vy > s.fallCap)
			s.vy = s.fallCap;
		
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += s.fallSpeed;
		}
		else if (s.isKicked)
		{
			ktimer++;
			if (ktimer >= klen)
			{
				ktimer = 0;
				kinv = false;
			}
		}
		doSpriteCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			if (b.type == "player")
			{
				var inf = getCollisionInfo(b, s);
				
				if (s.isKicked)
				{
					if (inf.top && !kinv)
					{
						b.vy = -9.5;
						b.y = s.y - b.height;
						game.sounds.get("stomp").play();
						s.isKicked = false;
						s.vx = 0;
						ktimer = 0;
					}
					else if ((inf.left || inf.right || inf.bottom) && !kinv)
						b.hurt();
				}
				else
				{
					kinv = true;
					s.isKicked = true;
					game.sounds.get("kick").play();
					
					if (b.x + b.width / 2 <= s.x + s.width / 2)
						s.vx = s.speed;
					else
						s.vx = -s.speed;
				}
			}
			else if (b.type.replace(/greenKoopa|redKoopa|redShell|greenShell|redShellKoopa|greenShellKoopa/g, "") == "")
			{
				if (s.isKicked)
				{
					b.vy = -4;
					b.hit = true;
					if (b.isKicked)
					{
						s.hit = true;
						s.vy = -4;
					}
					game.sounds.get("kick").play();
				}
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (s.isKicked)
			{
				game.sounds.get("ricochet").play();
				if (inf.left && bounds.left)
					s.vx = -Math.abs(s.vx);
				else if (inf.right && bounds.right)
					s.vx = Math.abs(s.vx);
			}
		}
	}
	
	return s;
}

SPRITES.redShell = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "redShell";
	s.description = "A red shell that can be kicked by the player";
	
	s.speed = 8;
	s.isKicked = false;
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	var kinv = false;
	var ktimer = 0;
	var klen = 20;
	s.hit = false;
	
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png" });
	s.attributes = ["x", "y", "speed", "vx", "fallSpeed", "fallCap", "isKicked"];
	
	var poses = {
		normal:[604, 106, 32, 32],
		kicked:[566, 106, 32, 32,
				604, 106, 32, 32,
				642, 106, 32, 32]
	}
	
	function doAnimation()
	{
		var op = {};
		
		if (s.hit)
			op.flipY = true;
		else if (s.isKicked)
			op.anim = poses.kicked;
		else
			op.anim = poses.normal;
		s.setAnimation(op);
	}
	s.update = function()
	{
		doAnimation();
		s.vy += s.fallSpeed;
		if (s.vy > s.fallCap)
			s.vy = s.fallCap;
		
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += s.fallSpeed;
		}
		else if (s.isKicked)
		{
			ktimer++;
			if (ktimer >= klen)
			{
				ktimer = 0;
				kinv = false;
			}
		}
		doSpriteCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			if (b.type == "player")
			{
				var inf = getCollisionInfo(b, s);
				
				if (s.isKicked)
				{
					if (inf.top && !kinv)
					{
						b.vy = -9.5;
						b.y = s.y - b.height;
						game.sounds.get("stomp").play();
						s.isKicked = false;
						s.vx = 0;
						ktimer = 0;
					}
					else if ((inf.left || inf.right || inf.bottom) && !kinv)
						b.hurt();
				}
				else
				{
					kinv = true;
					s.isKicked = true;
					game.sounds.get("kick").play();
					
					if (b.x + b.width / 2 <= s.x + s.width / 2)
						s.vx = s.speed;
					else
						s.vx = -s.speed;
				}
			}
			else if (b.type.replace(/greenKoopa|redKoopa|redShell|greenShell|redShellKoopa|greenShellKoopa/g, "") == "")
			{
				if (s.isKicked)
				{
					b.vy = -4;
					b.hit = true;
					if (b.isKicked)
					{
						s.hit = true;
						s.vy = -4;
					}
					game.sounds.get("kick").play();
				}
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (s.isKicked)
			{
				if (inf.left && bounds.left || inf.right && bounds.right)
				{
					s.vx = -s.vx;
					game.sounds.get("ricochet").play();
				}
			}
		}
	}
	
	return s;
}

SPRITES.bulletBillSpawner = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "bulletBillSpawner";
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	s.description = "Periodically spawns bullet bills in the direction of the player";
	
	s.interval = op.interval || 240;
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png" });
	
	s.attributes = ["x", "y", "interval"];
	
	var pose = [754, 390, 32, 32];
	s.update = function()
	{
		if (typeof ALL_OVERRIDE != "undefined")
			s.setAnimation({ anim:pose });
		else
			s.texture = new Texture({ color:"rgba(0, 0, 0, 0)" });
		if (game.counter % s.interval == 0 && getOnScreen(s))
			spawnBulletBill();
	}
	function spawnBulletBill()
	{
		var shootRight = null;
		if (player.x + player.width < s.x)
			shootRight = false;
		else if (player.x > s.x + s.width)
			shootRight = true;
		
		if (shootRight != null)
			game.addSprite(SPRITES.bulletBill({ x:s.x, y:s.y, shootRight:shootRight }));
	}
	
	return s;
}

SPRITES.noteBlock = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "noteBlock";
	s.description = "Bounces the player upwards";
	
	var de = 25;
	var orig = s.y;
	var ny = orig + de;
	var down = true;
	var rate = 5;
	var target;
	
	s.attributes = ["x", "y"];
	attachTextureSource({ sprite:s, source:"Packs/emain.png" });
	
	var pose = [0, 448, 32, 32,
				32, 448, 32, 32,
				64, 448, 32, 32,
				96, 448, 32, 32];
	s.update = function()
	{
		s.setAnimation({ anim:pose });
		if (typeof target != "undefined")
		{
			if (down)
			{
				s.y += rate;
				target.onGround = true;
				target.y = s.y - target.height;
				target.vy = target.fallSpeed;
				
				if (s.y >= ny)
					down = false;
			}
			else
			{
				s.y -= rate;
				target.y = s.y - target.height;
				if (s.y <= orig)
				{
					s.y = orig;
					target.vy = -10;
					target.onGround = false;
					down = true;
					target.onNoteBlock = false;
					target = undefined;
				}
				else
				{
					target.onGround = true;
					target.vy = target.fallSpeed;
				}
			}
		}
		
		doSpriteCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			var bounds = { left:true, top:true, right:true, bottom:true };
			var inf = getCollisionInfo(b, s, true);
			
			if (b.type == "player")
			{
				if (inf.top && !b.onNoteBlock)
				{
					b.y = s.y - b.height - .01;
					if (typeof target == "undefined")
						game.sounds.get("spring").play();
					target = b;
					target.onNoteBlock = true;
				}
				else if (typeof target == "undefined")
				{
					inf = doCollisionInteraction(b, s, bounds, true);
					if (inf.left && bounds.left && b.vx > 0 || inf.right && bounds.right && b.vx < 0)
						b.vx = 0;
				}
			}
			else if (b.type.replace(/mushroom|greenKoopa|greenShellKoopa|redKoopa|redShellKoopa/g, "") == "")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true });
				
				if (inf.left || inf.right)
					b.vx = -b.vx;
			}
			else if (b.type.replace(/greenShell|redShell/g, "") == "")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true });
				
				if (inf.left || inf.right)
					game.sounds.get("ricochet").play();
				if ((inf.left || inf.right) && b.isKicked)
					b.vx = -b.vx;
			}
			
		}
	}
	
	return s;
}

SPRITES.door = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 64;
	s.type = "door";
	s.description = "A door that the player may press up to enter and be transported to a desired level";
	s.destination = "Levels/sample.txt";
	
	attachTextureSource({ sprite:s, source:"Packs/misc.png" });
	
	var pose = [226, 2, 32, 64];
	s.attributes = ["x", "y", "destination"];
	
	s.update = function()
	{
		s.setAnimation({ anim:pose });
		doPlayerCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			if (b.type == "player")
			{
				if (getKeyDown(keys.up) && b.onGround && typeof ALL_OVERRIDE == "undefined")
				{
					game.running.push(false);
					game.sprites.clear();
					background = null;
					blocks = [];
					var ib = false;
					if (player)
					{
						ib = player.isBig;
						player.vx = 0;
						player.vy = 0;
					}
					game.sounds.get("door").play();
					
					addBuffer(EFFECTS.fadeOut);
					addBuffer(function(){
						openLevel(s.destination, function(){
							addBuffer(EFFECTS.fadeIn);
							addBuffer(function(){
								loadFunction();
								player.isBig = ib;
								game.running.splice(game.running.indexOf(false), 1);
								setCamera();
							});
						});
						
					});
				}
				
			}
		}
	}
	
	return s;
}

SPRITES.turnBlock = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "turnBlock";
	s.description = "Can be activated in order to be spun so that the player may walk through it for a short period of time"
	
	s.turning = false;
	s.hit = false;
	s.turnTimer = 0;
	s.turnLen = 150;
	
	s.attributes = ["x", "y", "turning", "turnLen"];
	
	attachTextureSource({ sprite:s, source:"Packs/misc.png" });
	
	var poses = {
		normal:[346, 328, 32, 32],
		turning:[346, 328, 32, 32,
				 380, 328, 32, 32,
				 414, 328, 32, 32,
				 448, 328, 32, 32]
	}
	
	s.bounce = function(cb)
	{
		if (s.hit)
			return;
		s.hit = true;
		addPreBuffer(function(){
			lerpDistance = -15;
			lerpIncrease = -1;
			lerpValue = s.y;
			lerpUpdate = function(){ s.y = lerpValue; };
			
			addPreBuffer(PRE_EFFECTS.lerp);
			addPreBuffer(function(){
				lerpDistance = -lerpDistance - lerpIncrease;
				lerpIncrease = -lerpIncrease + 2;
				addPreBuffer(PRE_EFFECTS.lerp);
				addPreBuffer(function(){
					if (typeof cb == "function")
						addPreBuffer(cb);
					lerpUpdate = null;
					s.hit = false;
				});
			});
		});
	}
	s.activate = function()
	{
		s.bounce(function(){
			s.turning = true;
		});
	}
	function doAnimation()
	{
		var op = {};
		if (s.turning)
			op.anim = poses.turning;
		else
			op.anim = poses.normal;
		s.setAnimation(op);
	}
	s.update = function()
	{
		if (s.turning)
		{
			s.turnTimer++;
			if (s.turnTimer >= s.turnLen)
			{
				s.turnTimer = 0;
				s.turning = false;
			}
		}
		doAnimation();
		doSpriteCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is && !s.turning)
		{
			if (b.type == "player")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true }, true);
				
				if (inf.left || inf.right)
					b.vx = 0;
				if (inf.top)
					b.y++;
				if (inf.bottom)
					s.activate();
			}
			else if (b.type.replace(/mushroom|greenKoopa|greenShellKoopa|redKoopa|redShellKoopa/g, "") == "")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true });
				
				if (inf.left || inf.right)
					b.vx = -b.vx;
			}
			else if (b.type.replace(/greenShell|redShell/g, "") == "")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true });
				
				if (inf.left || inf.right)
					game.sounds.get("ricochet").play();
				if ((inf.left || inf.right) && b.isKicked)
				{
					b.vx = -b.vx;
					s.activate();
				}
			}
		}
	}
	
	return s;
}

SPRITES.questionBlock = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "questionBlock";
	s.description = "A question mark block that the player may hit from the bottom to activate";
	
	s.item = "mushroom";
	s.used = false;
	
	s.attributes = ["x", "y", "item", "used"];
	attachTextureSource({ sprite:s, source:"Packs/misc.png" });
	
	var isprite;
	var poses = {
		normal:[346, 362, 32, 32,
			    380, 362, 32, 32,
			    414, 362, 32, 32,
			    448, 362, 32, 32],
		used:[514, 194, 32, 32]
	}
	
	function doAnimation()
	{
		var op = {  };
		if (!s.used)
			op.anim = poses.normal;
		else
			op.anim = poses.used;
		s.setAnimation(op);
	}
	s.activate = function()
	{
		if (s.used)
			return;
		
		s.used = true;
		switch (s.item)
		{
			case "mushroom":
				isprite = SPRITES.mushroom({ x:s.x, y:s.y - 2 });
				game.addSprite(isprite);
				game.sounds.get("appear").play();
				break;
		}
	}
	s.update = function()
	{
		if (typeof isprite != "undefined")
		{
			if (isprite.type.replace(/mushroom/g, "") == "")
			{
				if (isprite.y + isprite.height > s.y + 1)
					isprite.vy = -1;
				else
				{
					if (player.x + player.width / 2 > s.x + s.width / 2)
						isprite.vx = 2;
					else
						isprite.vx = -2;
					isprite.vy = isprite.fallSpeed;
					isprite = undefined;
				}
			}
		}
		doAnimation();
		doSpriteCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			if (b.type == "player")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true }, true);
				
				if (inf.left || inf.right)
					b.vx = 0;
				if (inf.top)
					b.y++;
				if (inf.bottom)
					s.activate();
			}
			else if (b.type.replace(/mushroom|greenKoopa|greenShellKoopa|redKoopa|redShellKoopa/g, "") == "")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true });
				
				if (inf.left || inf.right)
					b.vx = -b.vx;
			}
			else if (b.type.replace(/greenShell|redShell/g, "") == "")
			{
				var inf = doCollisionInteraction(b, s, { left:true, top:true, right:true, bottom:true });
				
				if (inf.left || inf.right)
					game.sounds.get("ricochet").play();
				if ((inf.left || inf.right) && b.isKicked)
				{
					b.vx = -b.vx;
					s.activate();
				}
			}
		}
	}
	
	return s;
}

SPRITES.mushroom = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "mushroom";
	s.description = "A red mushroom that will make Mario big upon being collected";
	
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	s.attributes = ["x", "y", "vx", "fallSpeed", "fallCap"];
	
	s.pose = [582, 60, 32, 32];
	attachTextureSource({ sprite:s, source:"Packs/misc.png" });
	s.priority = "first";
	
	s.update = function()
	{
		s.setAnimation({ anim:s.pose });
		s.vy += s.fallSpeed;
		if (s.vy > s.fallCap)
			s.vy = s.fallCap;
		doPlayerCollision(s);
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			var inf = getCollisionInfo(s, b);
			if (b.type == "player")
			{
				b.isBig = true;
				s.isRemoved = true;
				game.sounds.get("mushroom").play();
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (inf.left && bounds.left)
				s.vx = -Math.abs(s.vx);
			else if (inf.right && bounds.right)
				s.vx = Math.abs(s.vx);
		}
	}
	
	return s;
}

SPRITES.bulletBill = function(op)
{
	var s = new Sprite(op)
	s.width = 32;
	s.height = 28;
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	s.type = "bulletBill";
	s.description = "A bullet bill that constantly shoots in one direction";
	
	s.shootRight = op.shootRight || false;
	s.speed = op.speed || 4;
	s.squashed = false;
	s.attributes = ["x", "y", "vx", "shootRight", "squashed"];
	s.hit = false;
	
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png" });
	
	var poses = {
		fixed:[666, 394, 32, 28],
		squashed:[708, 392, 32, 32]
	};
	
	if (s.shootRight)
		s.vx = s.speed;
	else
		s.vx = -s.speed;
	
	function doRemoval()
	{
		if (s.x + s.width < camBounds.x ||
			s.x > camBounds.x + camBounds.width ||
			s.y + s.height < camBounds.y ||
			s.y > camBounds.y + camBounds.height)
			s.isRemoved = true;
	}
	function doAnimation()
	{
		var fx = false;
		if (s.shootRight)
			fx = true;
		var op = {};
		if (s.hit)
			op.flipY = true;
		else if (s.squashed)
			op = { anim:poses.squashed, flipX:fx };
		else
			op = { anim:poses.fixed, flipX:fx };
		s.setAnimation(op);
	}
	s.update = function()
	{
		doAnimation();
		
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += .4;
		}
		else if (s.squashed)
		{
			if (s.y >= game.mc.height)
				s.isRemoved = true;
		}
		else
			doPlayerCollision(s);
		doRemoval();
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			var binf = getCollisionInfo(b, s);
			switch (b.type)
			{
				case "player":
					if (binf.top && !b.onGround)
					{
						s.ignoreCollision = true;
						s.vy = 5;
						s.vx = 0;
						b.vy = -9.5;
						s.squashed = true;
						game.sounds.get("stomp").play();
					}
					else if (binf.left || binf.right || binf.bottom)
						if (!binf.top)
							b.hurt();
					break;
			}
		}
	}
	
	return s;
}

SPRITES.redKoopa = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	s.type = "redKoopa";
	s.description = "A red koopa (will not fall off of ledges)";
	
	s.speed = 1;
	s.fallSpeed = .4;
	s.fallCap = 9;
	s.animSpeed = 12;
	
	s.squashed = false;
	s.squashTimer = 0;
	s.attributes = ["x", "y", "vx", "fallSpeed", "fallCap", "squashed", "squashTimer", "animSpeed"];
	
	s.hit = false;
	s.longround = false;
	
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png", interval:s.animSpeed });
	
	var poses = {
		walking:[402, 68, 32, 32,
				 404, 104, 32, 32],
		squashed:[486, 106, 32, 30]
	};
	s.vx = -s.speed;
	
	function doAnimation()
	{
		var op = {};
		var fx;
		if (s.vx > 0) fx = false;
		if (s.vx < 0) fx = true;
		
		if (s.hit)
			op.flipY = true;
		else if (s.squashed)
			op = { anim:poses.squashed, flipX:fx };
		else
		{
			if (s.vx > 0)
				op = { anim:poses.walking, flipX:fx };
			else if (s.vx < 0)
				op = { anim:poses.walking, flipX:fx };
		}
		s.setAnimation(op);
	}
	s.update = function()
	{
		doAnimation();
		if (s.longround && !s.onGround && s.vy > 0)
		{
			s.vx = -s.vx;
			s.x -= s.vx;
			s.y -= s.vy;
			s.vy = s.fallSpeed;
		}
		s.longround = s.onGround;
		
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += s.fallSpeed;
		}
		else if (s.squashed)
		{
			s.squashTimer++;
			s.vy = 0;
			if (s.squashTimer >= 20)
				s.isRemoved = true;
		}
		else
		{
			doLerps();
			doPlayerCollision(s);
			s.onGround = false;
		}
	}
	function doLerps()
	{
		s.vy += s.fallSpeed;
		if (s.vy > s.fallCap)
			s.vy = s.fallCap;
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			var inf = getCollisionInfo(s, b);
			switch (b.type)
			{
				case "player":
					var pinf = getCollisionInfo(b, s);
					if (pinf.top && !b.onGround)
					{
						s.squashed = true;
						s.ignoreCollision = true;
						s.vx = 0;
						b.vy = -9.5;
						game.sounds.get("stomp").play();
					}
					else if (pinf.left || pinf.right || pinf.bottom)
						if (!pinf.top)
							b.hurt();
					break;
				case "greenKoopa":
				case "redKoopa":
					b.vx = -b.vx;
					if (b.vx > 0 && s.vx > 0)
						s.vx = -s.vx;
					if (inf.left)
						s.x = b.x - s.width;
					break;
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (inf.left && bounds.left)
				s.vx = -Math.abs(s.vx);
			else if (inf.right && bounds.right)
				s.vx = Math.abs(s.vx);
		}
	}
	
	return s;
}

SPRITES.greenKoopa = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	s.type = "greenKoopa";
    s.description = "A green koopa";
	
	s.speed = 1;
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	s.squashed = false;
	s.squashTimer = 0;
	s.animSpeed = 12;
	s.attributes = ["x", "y", "vx", "fallSpeed", "fallCap", "squashed", "squashTimer", "animSpeed"];
	s.hit = false;
	
	attachTextureSource({ sprite:s, source:"Packs/defaultSprites.png", interval:s.animSpeed });
	
	var poses = {
		walking:[406, 34, 32, 32,
				 404, 0, 32, 32],
		squashed:[488, 36, 32, 30]
	};
	s.vx = -s.speed;
	
	function doAnimation()
	{
		var op = {};
		var fx;
		if (s.vx > 0) fx = false;
		if (s.vx < 0) fx = true;
		
		if (s.hit)
			op.flipY = true;
		else if (s.squashed)
			op = { anim:poses.squashed, flipX:fx };
		else
		{
			if (s.vx > 0)
				op = { anim:poses.walking, flipX:fx };
			else if (s.vx < 0)
				op = { anim:poses.walking, flipX:fx };
		}
		s.setAnimation(op);
	}
	
	s.update = function()
	{
		doAnimation();
		
		if (s.hit)
		{
			s.ignoreCollision = true;
			if (underBounds(s))
				s.isRemoved = true;
			s.vy += s.fallSpeed;
		}
		else if (s.squashed)
		{
			s.vy = 0;
			s.squashTimer++;
			if (s.squashTimer == 20)
			{
				s.isRemoved = true;
			}
		}
		else
		{
			doLerps();
			doPlayerCollision(s);
			s.onGround = false;
		}
	}
	function doLerps()
	{
		s.vy += s.fallSpeed;
		if (s.vy > s.fallCap)
			s.vy = s.fallCap;
	}
	s.collided = function(b, is)
	{
		if (is)
		{
			var inf = getCollisionInfo(s, b);
			switch (b.type)
			{
				case "player":
					var pinf = getCollisionInfo(b, s);
					if (pinf.top && !b.onGround)
					{
						s.squashed = true;
						s.ignoreCollision = true;
						s.vx = 0;
						b.vy = -9.5;
						game.sounds.get("stomp").play();
					}
					else if (pinf.left || pinf.right || pinf.bottom)
						if (!pinf.top)
							b.hurt();
					break;
				case "redKoopa":
				case "greenKoopa":
					b.vx = -b.vx;
					if (b.vx > 0 && s.vx > 0)
						s.vx = -s.vx;
					if (inf.left)
						s.x = b.x - s.width;
					break;
			}
		}
		else
		{
			var bounds = getCollisionBounds(b);
			var inf = doCollisionInteraction(s, b, bounds);
			
			if (inf.left && bounds.left)
				s.vx = -Math.abs(s.vx);
			else if (inf.right && bounds.right)
				s.vx = Math.abs(s.vx);
		}
	}
	return s;
}
