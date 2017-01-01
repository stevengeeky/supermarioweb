// Sample of the plain drawn graphic for the thwump (no real interaction implemented yet)

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
	
	s.update = function()
	{
		doAnimation();
	}
	
	return s;
}
