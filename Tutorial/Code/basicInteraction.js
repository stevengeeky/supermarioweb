SPRITES.thwump = function(op)
{
	var s = new Sprite(op);
	s.width = 32;
	s.height = 32;
	s.type = "thwump";
	s.geometry = new Geometry({ x:0, y:0, width:s.width, height:s.height });
	
	s.speed = .5;
	s.fallSpeed = .4;
	s.fallCap = 9;
	
	s.vx = -s.speed;
	
	var tp = getTexturePack("Packs/defaultSprites.png");
	if (tp)
		s.texture = new Texture({ type:"texture", texturePack:tp, animation:[], frame:{ current:0, counter:0, interval:s.animSpeed } });
	else
	{
		tp = game.texturePacks.add(new TexturePack({ source:"Packs/defaultSprites.png", callback:function(){
			s.texture = new Texture({ type:"texture", texturePack:tp, animation:[], frame:{ current:0, counter:0, interval:s.animSpeed } });
		} }));
	}
	
	var poses = {
		fixed:[514, 800, 32, 32]
	};
	
	function doAnimation()
	{
		var op = { anim:poses.fixed };
		s.setAnimation(op);
	}
	function doLerp()
	{
		s.vy += s.fallSpeed;
		if (s.fallSpeed > s.fallCap)
			s.fallSpeed = s.fallCap;
	}
	
	s.update = function()
	{
		doAnimation();
		doLerp();
	}
	
	s.collided = function(b)
	{
		var inf = getCollisionInfo(s, b);
		if (b.type.replace(/solid|ledge/g, "") == "")
		{
			if (inf.top)
			{
				s.vy = s.fallSpeed;
				s.onGround = true;
				s.y = b.y - s.height;
			}
			
			if (b.type == "solid")
			{
				if (inf.bottom)
				{
					s.vy = s.fallSpeed;
					s.y = b.y + b.height + .01;
				}
				if (inf.left)
				{
					s.vx = -s.speed;
					s.x = b.x - s.width - .01;
				}
				if (inf.right)
				{
					s.vx = s.speed;
					s.x = b.x + b.width + .01;
				}
			}
		}
	}
	return s;
}
