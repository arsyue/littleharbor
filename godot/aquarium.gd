extends Node3D
const Fish = preload("res://fish.gd")
var camera: Camera3D
var habitat: Node3D
var decor_root: Node3D
var fish_root: Node3D
var fish_nodes: Array = []
var obstacle_points: Array = []
var decor_nodes: Dictionary = {}
var tank_tier := -1
var half_width := 4.7
var water_height := 3.8
var depth := 2.0
var feed_time := 0.0
var food := Vector3(0,3.15,0)
var editing := false
var slow := false
var drag_uid := ""
var drag_start := Vector2.ZERO
var moved := false
var elapsed := 0.0
var poll_time := 0.0
var bubbles: Array[MeshInstance3D] = []
var pellets: Array[MeshInstance3D] = []
var rng := RandomNumberGenerator.new()

func _ready() -> void:
	rng.seed=82416
	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode=Environment.BG_COLOR
	env.background_color=Color("#0b2028")
	env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color=Color("#a2d8d4")
	env.ambient_light_energy=0.65
	env.reflected_light_source=Environment.REFLECTION_SOURCE_DISABLED
	env.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	environment.environment=env;add_child(environment)
	var key := DirectionalLight3D.new()
	key.rotation_degrees=Vector3(-65,-20,-12);key.light_color=Color("#e0f4e0");key.light_energy=1.5
	key.shadow_enabled=true;key.directional_shadow_max_distance=30
	add_child(key)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees=Vector3(-20,145,0);fill.light_color=Color("#68aab9");fill.light_energy=0.75;add_child(fill)
	camera=Camera3D.new();add_child(camera);camera.current=true;camera.fov=39
	habitat=Node3D.new();add_child(habitat)
	decor_root=Node3D.new();add_child(decor_root)
	fish_root=Node3D.new();add_child(fish_root)
	_build_tank(0)
	if OS.has_feature("web"):
		_send({"type":"ready"})
	else:
		_apply_state({"tank":0,"fish":[{"uid":"sunny","id":"goldfish"},{"uid":"bubbles","id":"guppy"},{"uid":"tang","id":"blue-tang"},{"uid":"angel","id":"angelfish"},{"uid":"clown","id":"clownfish"}],"decor":[{"uid":"plant","id":"seaweed","x":22,"y":73},{"uid":"arch","id":"pebble-arch","x":76,"y":76}]})

func mat(color: Color, rough: float=0.65, metal: float=0.0) -> StandardMaterial3D:
	var m:=StandardMaterial3D.new();m.albedo_color=color;m.roughness=rough;m.metallic=metal
	if color.a<1:
		m.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA
		m.cull_mode=BaseMaterial3D.CULL_DISABLED
	return m

func box(parent: Node3D, pos: Vector3, size: Vector3, material: Material) -> MeshInstance3D:
	var n:=MeshInstance3D.new();var mesh:=BoxMesh.new();mesh.size=size
	n.mesh=mesh;n.material_override=material;n.position=pos;parent.add_child(n);return n

func sphere(parent: Node3D,pos: Vector3,size: Vector3,material: Material) -> MeshInstance3D:
	var n:=MeshInstance3D.new();var mesh:=SphereMesh.new()
	mesh.radius=1;mesh.height=2;mesh.radial_segments=16;mesh.rings=10
	n.mesh=mesh;n.position=pos;n.scale=size;n.material_override=material;parent.add_child(n);return n

func cylinder(parent: Node3D,a: Vector3,b: Vector3,radius: float,material: Material) -> MeshInstance3D:
	var n:=MeshInstance3D.new();var mesh:=CylinderMesh.new()
	mesh.top_radius=radius*0.72;mesh.bottom_radius=radius;mesh.height=a.distance_to(b);mesh.radial_segments=10
	n.mesh=mesh;n.material_override=material;n.position=(a+b)*0.5;parent.add_child(n)
	var axis:=(b-a).normalized()
	n.quaternion=Quaternion(Vector3.UP,axis)
	return n

func _clear(parent: Node3D) -> void:
	for c in parent.get_children():parent.remove_child(c);c.queue_free()

func _build_tank(tier: int) -> void:
	tank_tier=tier;half_width=4.7+tier*0.65;water_height=3.8+tier*0.24;depth=2.0+tier*0.22
	_clear(habitat);bubbles.clear()
	var dark:=mat(Color("#152d32"),0.25,0.55)
	var edge:=mat(Color(0.29,0.67,0.66,0.42),0.12,0.2)
	box(habitat,Vector3(0,-0.65,0),Vector3(half_width*2+0.30,0.86,depth*2+0.30),mat(Color("#294044"),0.4,0.1))
	box(habitat,Vector3(0,-0.18,0),Vector3(half_width*2+0.18,0.16,depth*2+0.18),dark)
	box(habitat,Vector3(0,-0.055,0),Vector3(half_width*2,0.15,depth*2),mat(Color("#c9bda0")))
	var substrate:=Shader.new()
	substrate.code="""
shader_type spatial;
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
	float grains=hash(floor(world.xz*80.0));
	float wave=sin(world.x*8.0+sin(world.z*8.0+TIME*0.5)*2.0)*sin(world.z*11.0+TIME*0.7);
	vec3 sand=mix(vec3(0.38,0.32,0.23),vec3(0.76,0.70,0.52),grains);
	ALBEDO=sand+pow(abs(wave),14.0)*0.17;ROUGHNESS=0.95;
}
"""
	var sm:=ShaderMaterial.new();sm.shader=substrate
	box(habitat,Vector3(0,0.035,0),Vector3(half_width*2-0.08,0.045,depth*2-0.08),sm)
	var back:=Shader.new()
	back.code="""
shader_type spatial;
render_mode unshaded;
void fragment(){vec3 a=vec3(0.018,0.075,0.09);vec3 b=vec3(0.05,0.28,0.32);float glow=pow(max(0.0,1.0-UV.y),0.6);ALBEDO=mix(a,b,glow);}
"""
	var bm:=ShaderMaterial.new();bm.shader=back
	box(habitat,Vector3(0,water_height*0.5,-depth-0.035),Vector3(half_width*2,water_height,0.045),bm)
	for x in [-half_width,half_width]:
		box(habitat,Vector3(x,water_height*0.5,0),Vector3(0.024,water_height,depth*2),mat(Color(0.15,0.52,0.59,0.09),0.08))
		box(habitat,Vector3(x,water_height*0.5,depth),Vector3(0.028,water_height,0.028),edge)
	for z in [-depth,depth]:
		box(habitat,Vector3(0,water_height,z),Vector3(half_width*2+0.12,0.075,0.075),dark)
		box(habitat,Vector3(0,water_height-0.16,z),Vector3(half_width*2,0.015,0.014),edge)
	# Front is optically clear, with narrow edge reflections rather than an opaque overlay.
	for x in [-half_width+0.04,half_width-0.04]:
		box(habitat,Vector3(x,water_height*0.5,depth+0.01),Vector3(0.018,water_height*0.95,0.008),mat(Color(0.75,0.95,0.94,0.25),0.1))
	var water:=Shader.new()
	water.code="""
shader_type spatial;
render_mode cull_disabled,blend_mix,depth_prepass_alpha;
varying vec3 world;
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;VERTEX.y+=sin(VERTEX.x*4.0+TIME)*0.008;}
void fragment(){float ripple=pow(abs(sin(world.x*4.0+TIME*0.7)*sin(world.z*6.0+TIME*0.4)),8.0);ALBEDO=vec3(0.25,0.63,0.64)+ripple*0.22;ALPHA=0.07+ripple*0.09;ROUGHNESS=0.12;SPECULAR=0.8;}
"""
	var wm:=ShaderMaterial.new();wm.shader=water
	var surface:=MeshInstance3D.new();var plane:=PlaneMesh.new();plane.size=Vector2(half_width*2,depth*2)
	surface.mesh=plane;surface.material_override=wm;surface.position.y=water_height-0.16;habitat.add_child(surface)
	var lightmat:=mat(Color("#ccefe4"),0.2)
	lightmat.emission_enabled=true;lightmat.emission=Color("#bce6da");lightmat.emission_energy_multiplier=1.4
	box(habitat,Vector3(0,water_height+0.19,-0.35),Vector3(half_width*1.7,0.08,0.20),dark)
	box(habitat,Vector3(0,water_height+0.145,-0.35),Vector3(half_width*1.65,0.025,0.14),lightmat)
	# Neutral gravel forms the built-in habitat. Ornaments are only added from owned inventory.
	for i in range(90):
		var p:=Vector3(rng.randf_range(-half_width+0.1,half_width-0.1),0.07,rng.randf_range(-depth+0.1,depth-0.1))
		var s:=rng.randf_range(0.028,0.085)
		sphere(habitat,p,Vector3(s,s*0.5,s*0.7),mat(Color("#8d9483").lerp(Color("#d5c9a7"),rng.randf())))
	for i in range(22):
		var b:=sphere(habitat,Vector3(-half_width+0.28,rng.randf_range(0.2,water_height),-depth+0.25),Vector3.ONE*rng.randf_range(0.014,0.038),mat(Color(0.62,0.9,0.9,0.23),0.08,0.2))
		bubbles.append(b)
	var aspect:=get_viewport().get_visible_rect().size.aspect()
	camera.position=Vector3(half_width*0.17,water_height*0.80, maxf(13.6+tier*1.3,half_width*2.9/maxf(aspect,0.8)))
	camera.look_at(Vector3(0,water_height*0.43,0))
	for f in fish_nodes:f.bounds=Vector3(half_width-0.4,water_height-0.2,depth-0.2)

func _apply_state(state: Dictionary) -> void:
	var tier:=clampi(int(state.get("tank",0)),0,2)
	if tier!=tank_tier:_build_tank(tier)
	var keep: Dictionary={}
	for data in state.get("fish",[]):
		var id:=str(data.get("uid",""))
		keep[id]=true
		var found:=false
		for f in fish_nodes:
			if f.uid==id:found=true
		if not found:
			var f:=Fish.new();fish_root.add_child(f);f.configure(data,fish_nodes.size())
			f.bounds=Vector3(half_width-0.4,water_height-0.2,depth-0.2);fish_nodes.append(f)
	for i in range(fish_nodes.size()-1,-1,-1):
		if not keep.has(fish_nodes[i].uid):fish_nodes[i].queue_free();fish_nodes.remove_at(i)
	_clear(decor_root);decor_nodes.clear();obstacle_points.clear()
	for data in state.get("decor",[]):
		var n:=Node3D.new();decor_root.add_child(n)
		n.position=_decor_position(float(data.get("x",50)),float(data.get("y",80)))
		decor_nodes[str(data.get("uid",""))]=n
		_ornament(n,str(data.get("id","seaweed")))
		obstacle_points.append(n.position+Vector3(0,0.45,0))

func _decor_position(x: float,y: float) -> Vector3:
	return Vector3((x/100.0-0.5)*half_width*1.85,0.09,lerpf(-depth+0.45,depth-0.45,clampf((y-60)/34.0,0,1)))

func _plant(parent: Node3D, height: float, color: Color) -> void:
	var shader:=Shader.new()
	shader.code="""
shader_type spatial;
render_mode cull_disabled;
uniform vec4 leaf:source_color;
void vertex(){VERTEX.x+=sin(TIME*0.8+VERTEX.y*2.5+INSTANCE_ID)*VERTEX.y*0.035;}
void fragment(){ALBEDO=leaf.rgb*(0.65+UV.x*0.4);ROUGHNESS=0.52;}
"""
	var material:=ShaderMaterial.new();material.shader=shader;material.set_shader_parameter("leaf",color)
	for i in range(14):
		var angle:=i*2.399
		var h:=height*rng.randf_range(0.55,1.1)
		var st:=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
		for segment in range(9):
			for pair in [Vector2i(segment,0),Vector2i(segment+1,0),Vector2i(segment+1,1),Vector2i(segment,0),Vector2i(segment+1,1),Vector2i(segment,1)]:
				var t:=float(pair.x)/9.0
				var width:=sin(t*PI)*0.11
				var bend:=sin(t*1.8)*0.4
				st.set_uv(Vector2(pair.y,t))
				st.add_vertex(Vector3(cos(angle)*bend+(pair.y-0.5)*width,sin(t*1.3)*h,sin(angle)*bend))
		st.generate_normals()
		var leaf:=MeshInstance3D.new();leaf.mesh=st.commit();leaf.material_override=material;parent.add_child(leaf)

func _ornament(n: Node3D,id: String) -> void:
	var stone:=mat(Color("#6e7b72"),0.9)
	var sand:=mat(Color("#c8ac74"),0.9)
	var wood:=mat(Color("#624333"),0.8)
	match id:
		"seaweed":_plant(n,1.8,Color("#3d8050"))
		"coral":
			for i in range(11):
				var a:=i*2.399;var tip:=Vector3(cos(a)*0.43,rng.randf_range(0.55,1.1),sin(a)*0.38)
				cylinder(n,Vector3.ZERO,tip,0.055,mat(Color("#c77e66")))
				cylinder(n,tip*0.6,tip+Vector3(0.14,0.1,0.05),0.032,mat(Color("#d7987c")))
		"pebble-arch","rainbow":
			for i in range(11):
				var a:=float(i)/10.0*PI
				var color:=Color.from_hsv(float(i)/15.0,0.35,0.65) if id=="rainbow" else Color("#829080")
				sphere(n,Vector3(cos(a)*0.62,sin(a)*0.70+0.10,0),Vector3(0.22,0.20,0.25),mat(color))
		"treasure-chest":
			box(n,Vector3(0,0.24,0),Vector3(0.70,0.43,0.42),wood)
			var lid:=box(n,Vector3(0,0.49,-0.12),Vector3(0.72,0.12,0.46),wood);lid.rotation.x=-0.45
			for x in [-0.23,0.23]:box(n,Vector3(x,0.25,0.22),Vector3(0.055,0.44,0.025),mat(Color("#b08e43"),0.3,0.6))
			for i in range(7):sphere(n,Vector3(rng.randf_range(-0.24,0.24),0.47,rng.randf_range(-0.12,0.12)),Vector3(0.065,0.015,0.065),mat(Color("#d7b45e"),0.25,0.7))
		"sandcastle":
			box(n,Vector3(0,0.35,0),Vector3(0.62,0.70,0.45),sand)
			for x in [-0.42,0.42]:
				cylinder(n,Vector3(x,0,0),Vector3(x,0.95,0),0.19,sand)
				for i in range(4):box(n,Vector3(x+cos(i*PI/2)*0.14,1.0,sin(i*PI/2)*0.14),Vector3(0.10,0.15,0.10),sand)
		"shell":
			for i in range(9):
				var a:=float(i)/8.0*PI
				var l:=sphere(n,Vector3(cos(a)*0.22,0.12,sin(a)*0.22),Vector3(0.07,0.035,0.38),mat(Color("#d6bbab")))
				l.rotation.y=-a+PI/2
			sphere(n,Vector3(0,0.21,0.1),Vector3.ONE*0.12,mat(Color("#e5e0cc"),0.15,0.25))
		"mushroom-house":
			cylinder(n,Vector3.ZERO,Vector3(0,0.65,0),0.28,stone)
			sphere(n,Vector3(0,0.73,0),Vector3(0.51,0.23,0.48),mat(Color("#9e6654"),0.85))
			box(n,Vector3(0,0.24,0.265),Vector3(0.17,0.35,0.018),mat(Color("#263b34")))
		_:
			sphere(n,Vector3(0,0.2,0),Vector3(0.35,0.25,0.3),stone)

func _send(data: Dictionary) -> void:
	if OS.has_feature("web"):JavaScriptBridge.eval("window.harborSend("+JSON.stringify(data)+")")

func _process(dt: float) -> void:
	dt=minf(dt,0.05);elapsed+=dt;feed_time=maxf(0,feed_time-dt);poll_time+=dt
	if OS.has_feature("web") and poll_time>0.12:
		poll_time=0
		var fish_info: Array=[]
		for f in fish_nodes:fish_info.append({"uid":f.uid,"x":f.position.x,"y":f.position.y,"z":f.position.z,"yaw":f.rotation.y})
		var decor_info: Array=[]
		for id in decor_nodes:
			var point:=camera.unproject_position(decor_nodes[id].position+Vector3(0,0.35,0))
			decor_info.append({"uid":id,"sx":point.x,"sy":point.y})
		JavaScriptBridge.eval("window.harborDiagnostics="+JSON.stringify({"fish":fish_info,"decor":decor_info,"tier":tank_tier,"feeding":feed_time>0,"width":half_width,"height":water_height,"depth":depth}))
		var raw=JavaScriptBridge.eval("JSON.stringify(window.harborQueue.splice(0))")
		if raw:
			var messages=JSON.parse_string(raw)
			if messages is Array:
				for msg in messages:
					match msg.get("type",""):
						"state":_apply_state(msg.get("state",{}));editing=bool(msg.get("editing",false));slow=bool(msg.get("reduced",false))
						"feed":_feed()
						"editing":editing=bool(msg.get("value",false))
	for f in fish_nodes:f.swim(dt,fish_nodes,food,feed_time>0,obstacle_points,slow)
	for i in range(bubbles.size()):
		var b:=bubbles[i];b.position.y+=dt*(0.19+i*0.008)
		b.position.x=-half_width+0.30+sin(elapsed+i)*0.05
		if b.position.y>water_height-0.18:b.position.y=0.15
	for p in pellets:
		if is_instance_valid(p):p.position.y-=dt*0.16;p.visible=feed_time>0
	if feed_time==0 and not pellets.is_empty():
		for p in pellets:p.queue_free()
		pellets.clear()

func _feed() -> void:
	feed_time=7.0
	for i in range(16):
		pellets.append(sphere(self,food+Vector3(rng.randf_range(-0.5,0.5),rng.randf_range(0,0.25),rng.randf_range(-0.35,0.35)),Vector3.ONE*0.025,mat(Color("#ad7945"))))

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT:
		if event.pressed:
			drag_start=event.position;moved=false
			if editing:
				var nearest:=80.0
				for id in decor_nodes:
					var dist:=camera.unproject_position(decor_nodes[id].position+Vector3(0,0.35,0)).distance_to(event.position)
					if dist<nearest:nearest=dist;drag_uid=id
		else:
			if not drag_uid.is_empty():
				var p:Vector3=decor_nodes[drag_uid].position
				if moved:_send({"type":"move","uid":drag_uid,"x":clampf((p.x/(half_width*1.85)+0.5)*100,9,91),"y":clampf(60+(p.z+depth-0.45)/(2*depth-0.9)*34,60,94)})
				drag_uid=""
			elif not moved:
				var nearest:=48.0;var selected:Node3D=null
				for f in fish_nodes:
					var d:=camera.unproject_position(f.position).distance_to(event.position)
					if d<nearest:nearest=d;selected=f
				if selected:_send({"type":"fish","uid":selected.uid})
	if event is InputEventMouseMotion:
		if event.position.distance_to(drag_start)>5:moved=true
		if not drag_uid.is_empty():
			var ray:=camera.project_ray_normal(event.position)
			var hit=Plane(Vector3.UP,0.1).intersects_ray(camera.project_ray_origin(event.position),ray)
			if hit!=null:decor_nodes[drag_uid].position=Vector3(clampf(hit.x,-half_width+0.5,half_width-0.5),0.09,clampf(hit.z,-depth+0.45,depth-0.45))
