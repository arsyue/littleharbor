extends Node3D
## Fish geometry faces +X. Steering is acceleration limited; the tail follows body speed.
var uid := ""
var species := "goldfish"
var velocity := Vector3(0.6, 0, 0)
var target := Vector3.ZERO
var turn_clock := 0.0
var phase := 0.0
var age := 0.0
var speed := 0.62
var body_length := 0.78
var body_height := 0.22
var body_width := 0.12
var tail: Node3D
var fins: Array[Node3D] = []
var skin: ShaderMaterial
var rng := RandomNumberGenerator.new()
var bounds := Vector3(4.2, 3.5, 1.5)
var body_color := Color("#e67e2c")
var fin_color := Color("#df873b")
var pattern := 0
var resting := false

func configure(data: Dictionary, index: int) -> void:
	uid = str(data.get("uid", index))
	species = str(data.get("id", "goldfish"))
	rng.seed = hash(uid)
	phase = rng.randf() * TAU
	position = Vector3(rng.randf_range(-3, 3), rng.randf_range(1.0, 3.1), rng.randf_range(-1, 1))
	match species:
		"guppy":
			body_length = 0.53; body_height = 0.105; body_width = 0.065; speed = 0.73
			body_color = Color("#3f9e9d"); fin_color = Color("#e3663d"); pattern = 3
		"blue-tang":
			body_length = 0.82; body_height = 0.28; body_width = 0.10
			body_color = Color("#1764c8"); fin_color = Color("#e8c736"); pattern = 2
		"clownfish":
			body_length = 0.65; body_height = 0.21; body_width = 0.12
			body_color = Color("#e7701b"); fin_color = Color("#ed852a"); pattern = 1
		"angelfish":
			body_length = 0.64; body_height = 0.42; body_width = 0.085; speed = 0.43
			body_color = Color("#c5c7b8"); fin_color = Color("#7e817c"); pattern = 4
		"betta":
			body_length = 0.65; body_height = 0.17; body_width = 0.08; speed = 0.42
			body_color = Color("#91528a"); fin_color = Color("#c05d91"); pattern = 3
		"pufferfish":
			body_length = 0.62; body_height = 0.28; body_width = 0.23; speed = 0.38
			body_color = Color("#a89c5a"); fin_color = Color("#bdb77e"); pattern = 5
		"seahorse":
			body_length = 0.52; body_height = 0.12; body_width = 0.08; speed = 0.24
			body_color = Color("#bda55f"); fin_color = Color("#bea86d"); pattern = 6
	_build_model()
	_pick_target()
	velocity = (target - position).normalized() * speed

func _material(color: Color, metallic: float = 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color; m.roughness = 0.38; m.metallic = metallic
	return m

func _sphere(parent: Node3D, at: Vector3, size: Vector3, material: Material) -> MeshInstance3D:
	var n := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 1.0; mesh.height = 2.0; mesh.radial_segments = 20; mesh.rings = 12
	n.mesh = mesh; n.material_override = material; n.position = at; n.scale = size
	parent.add_child(n)
	return n

func _build_model() -> void:
	if species == "seahorse":
		_build_seahorse()
		return
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode cull_disabled;
uniform vec4 body_color : source_color;
uniform int pattern = 0;
uniform float phase = 0.0;
uniform float swim_speed = 1.0;
varying vec3 local_pos;
void vertex(){
	local_pos=VERTEX;
	float rear = smoothstep(0.0,1.0,1.0-UV.x);
	VERTEX.z += sin(TIME*(5.0+swim_speed*3.0)+phase-UV.x*5.0)*rear*rear*0.035;
}
void fragment(){
	vec3 col=body_color.rgb;
	float shade=0.7+0.3*sin(UV.y*6.283);
	col*=shade;
	float belly=1.0-smoothstep(-0.15,0.0,local_pos.y);
	col=mix(col,vec3(0.78,0.78,0.63),belly*0.38);
	vec2 cell=vec2(UV.x*38.0,UV.y*18.0);
	cell.x+=mod(floor(cell.y),2.0)*0.5;
	float scale_edge=smoothstep(0.36,0.5,length(fract(cell)-0.5));
	col*=1.0-scale_edge*0.06;
	if(pattern==1){
		float bands=max(max(1.0-smoothstep(0.065,0.09,abs(UV.x-0.28)),1.0-smoothstep(0.075,0.10,abs(UV.x-0.59))),1.0-smoothstep(0.045,0.065,abs(UV.x-0.83)));
		float borders=max(max(1.0-smoothstep(0.09,0.11,abs(UV.x-0.28)),1.0-smoothstep(0.10,0.12,abs(UV.x-0.59))),1.0-smoothstep(0.065,0.08,abs(UV.x-0.83)));
		col=mix(col,vec3(0.035),borders);col=mix(col,vec3(0.88,0.9,0.84),bands);
	}
	if(pattern==2){float stripe=smoothstep(0.0,0.04,local_pos.y+0.025*sin(UV.x*8.0))*(1.0-smoothstep(0.12,0.18,local_pos.y));col=mix(col,vec3(0.015,0.025,0.055),stripe*0.9);}
	if(pattern==3){col=mix(col,vec3(0.3,0.65,0.67),sin(UV.x*20.0)*0.15+0.15);}
	if(pattern==4){float bars=pow(max(0.0,sin(UV.x*22.0)),9.0);col=mix(col,vec3(0.08,0.09,0.075),bars*0.85);}
	if(pattern==5){vec2 p=fract(vec2(UV.x*14.0,UV.y*9.0))-0.5;col=mix(col,vec3(0.10,0.105,0.065),1.0-smoothstep(0.08,0.15,length(p)));}
	float gill=(1.0-smoothstep(0.007,0.018,abs(UV.x-0.77)))*(1.0-smoothstep(0.10,0.19,abs(local_pos.y)));
	col*=1.0-gill*0.25;
	ALBEDO=col;ROUGHNESS=0.42;METALLIC=0.05;SPECULAR=0.5;
}
"""
	skin = ShaderMaterial.new(); skin.shader = shader
	skin.set_shader_parameter("body_color", body_color)
	skin.set_shader_parameter("pattern", pattern)
	skin.set_shader_parameter("phase", phase)
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rings := 36
	var sides := 24
	for i in range(rings):
		for j in range(sides):
			for ij in [Vector2i(i,j),Vector2i(i+1,j),Vector2i(i+1,j+1),Vector2i(i,j),Vector2i(i+1,j+1),Vector2i(i,j+1)]:
				var t := float(ij.x)/rings
				var a := float(ij.y)/sides*TAU
				var profile := pow(maxf(0.001,sin(t*PI)),0.7) * (0.50 + t*0.55)
				st.set_uv(Vector2(t,float(ij.y)/sides))
				st.add_vertex(Vector3((t-0.5)*body_length, sin(a)*body_height*profile, cos(a)*body_width*profile))
	st.generate_normals()
	var body := MeshInstance3D.new(); body.mesh = st.commit(); body.material_override = skin; add_child(body)
	var eye := _material(Color("#10150f"),0.25)
	var iris := _material(Color("#c9b476"),0.5)
	for side in [-1.0,1.0]:
		_sphere(self,Vector3(body_length*0.34,body_height*0.19,side*body_width*0.66),Vector3.ONE*body_length*0.046,iris)
		_sphere(self,Vector3(body_length*0.35,body_height*0.2,side*body_width*0.75),Vector3.ONE*body_length*0.031,eye)
	tail = Node3D.new(); add_child(tail); tail.position.x = -body_length*0.43
	var fan := 0.27 if species in ["goldfish","guppy","betta"] else 0.17
	if species == "betta": fan = 0.37
	_tail_fan(tail,fan,0.38 if species in ["guppy","betta"] else 0.30,fin_color)
	var top := 0.46 if species == "angelfish" else 0.16
	var dorsal := Node3D.new(); add_child(dorsal); fins.append(dorsal)
	_fin(dorsal,[Vector3(0.18,body_height*0.7,0),Vector3(-0.12,body_height+top,0),Vector3(-body_length*0.4,body_height*0.25,0)],fin_color)
	var anal := Node3D.new(); add_child(anal); fins.append(anal)
	_fin(anal,[Vector3(0.04,-body_height*0.8,0),Vector3(-0.18,-body_height-top*0.8,0),Vector3(-body_length*0.4,-body_height*0.3,0)],fin_color)
	for side in [-1.0,1.0]:
		var fin := Node3D.new();add_child(fin);fin.position = Vector3(body_length*0.10,-body_height*0.25,side*body_width*0.75); fins.append(fin)
		_fin(fin,[Vector3.ZERO,Vector3(-0.17,-0.09,side*0.20),Vector3(-0.22,0.035,side*0.13)],fin_color)
	if species == "angelfish":
		for side in [-1.0,1.0]:
			_fin(self,[Vector3(0.13,-0.19,side*0.03),Vector3(-0.02,-0.69,side*0.035),Vector3(0.09,-0.24,side*0.035)],Color("#c2c8b0"))

func _fin_material(color: Color) -> ShaderMaterial:
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
render_mode cull_disabled, blend_mix, depth_prepass_alpha;
uniform vec4 fin_color:source_color;
void vertex(){VERTEX.z+=sin(TIME*6.0+VERTEX.x*17.0)*UV.y*UV.y*0.018;}
void fragment(){
	float rays=pow(abs(sin(UV.x*75.0)),16.0);
	ALBEDO=fin_color.rgb*(0.78+rays*0.18);
	ALPHA=mix(0.88,0.50,UV.y)+rays*0.10;
	ROUGHNESS=0.48;SPECULAR=0.38;
}
"""
	var material := ShaderMaterial.new();material.shader=sh;material.set_shader_parameter("fin_color",color)
	return material

func _tail_fan(parent: Node3D, height: float, length: float, color: Color) -> void:
	var st := SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for sector in range(28):
		for band in range(5):
			for point in [Vector2i(sector,band),Vector2i(sector+1,band),Vector2i(sector+1,band+1),Vector2i(sector,band),Vector2i(sector+1,band+1),Vector2i(sector,band+1)]:
				var t := float(point.x)/28.0
				var r := float(point.y)/5.0
				var angle := lerpf(-1.34,1.34,t)
				var fork := 0.72+0.28*absf(sin(angle)) if species in ["goldfish","blue-tang"] else 0.78+0.22*cos(angle)
				st.set_uv(Vector2(t,r))
				st.add_vertex(Vector3(-length*fork*r,sin(angle)*height*r,sin(angle*2.0)*0.015*r))
	st.generate_normals()
	var n := MeshInstance3D.new();n.mesh=st.commit();n.material_override=_fin_material(color);parent.add_child(n)

func _fin(parent: Node3D, points: Array, color: Color) -> void:
	var st := SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var a:Vector3=points[0];var b:Vector3=points[1];var c:Vector3=points[2]
	var base:Vector3=(a+c)*0.5
	var control:Vector3=b*1.7-base*0.7
	for i in range(24):
		var t0:=float(i)/24.0;var t1:=float(i+1)/24.0
		var p0:Vector3=a*pow(1-t0,2)+control*2*t0*(1-t0)+c*t0*t0
		var p1:Vector3=a*pow(1-t1,2)+control*2*t1*(1-t1)+c*t1*t1
		st.set_uv(Vector2(0.5,0));st.add_vertex(base)
		st.set_uv(Vector2(t0,1));st.add_vertex(p0)
		st.set_uv(Vector2(t1,1));st.add_vertex(p1)
	st.generate_normals()
	var n := MeshInstance3D.new();n.mesh=st.commit();n.material_override=_fin_material(color);parent.add_child(n)

func _build_seahorse() -> void:
	var material := _material(Color("#a68c57"),0.04)
	material.roughness=0.64
	var ridge := _material(Color("#b9a06c"),0.03)
	_sphere(self,Vector3(-0.02,0.02,0),Vector3(0.072,0.21,0.063),material)
	var neck := _sphere(self,Vector3(0.0,0.19,0),Vector3(0.045,0.12,0.046),material)
	neck.rotation.z=-0.24
	var head := _sphere(self,Vector3(0.055,0.28,0),Vector3(0.083,0.062,0.048),material)
	head.rotation.z=-0.28
	_sphere(self,Vector3(0.14,0.25,0),Vector3(0.09,0.020,0.023),material)
	var eye := _material(Color("#11180f"))
	for side in [-1.0,1.0]:
		_sphere(self,Vector3(0.080,0.30,side*0.043),Vector3.ONE*0.012,eye)
	for i in range(9):
		var y := -0.13+i*0.035
		_sphere(self,Vector3(-0.062,y,0),Vector3(0.027,0.012,0.065),ridge)
	_sphere(self,Vector3(-0.025,-0.21,0),Vector3(0.029,0.075,0.028),material)
	for i in range(30):
		var t := float(i)/29.0
		var angle := PI+t*TAU*1.12
		var radius := 0.13*(1.0-t*0.75)
		_sphere(self,Vector3(0.10+cos(angle)*radius,-0.30+sin(angle)*radius,0),Vector3.ONE*lerpf(0.031,0.009,t),material)
	for i in range(3):
		_sphere(self,Vector3(0.015+i*0.019,0.33+sin(i+0.6)*0.024,0),Vector3(0.012,0.026,0.017),ridge)
	tail=Node3D.new();add_child(tail)
	_fin(tail,[Vector3(-0.075,0.12,0),Vector3(-0.19,0.15,0),Vector3(-0.09,-0.03,0)],fin_color)

func _pick_target() -> void:
	target = Vector3(rng.randf_range(-bounds.x+0.7,bounds.x-0.7),rng.randf_range(0.65,bounds.y-0.45),rng.randf_range(-bounds.z+0.45,bounds.z-0.45))
	turn_clock = rng.randf_range(4.0,9.0)

func swim(dt: float, neighbors: Array, food: Vector3, feeding: bool, obstacles: Array, slow: bool) -> void:
	age += dt
	turn_clock -= dt
	if turn_clock < 0 or position.distance_to(target)<0.5: _pick_target()
	var goal := food + Vector3(sin(phase)*0.4, -0.12, cos(phase)*0.3) if feeding else target
	var desired := (goal-position).normalized()
	if feeding and position.distance_to(goal)<0.25: desired *= 0.2
	var avoid := Vector3.ZERO
	for other in neighbors:
		if other == self: continue
		var offset: Vector3 = position-other.position
		var dist: float = offset.length()
		if dist > 0.01 and dist<0.75: avoid += offset.normalized()*(0.75-dist)*1.7
		elif species == other.species and dist<2.0: desired += other.velocity.normalized()*0.10
	for obstacle in obstacles:
		var offset: Vector3 = position-obstacle
		var dist := offset.length()
		if dist<0.9 and dist>0.01: avoid+=offset.normalized()*(0.9-dist)*2.8
	for axis in [0,2]:
		var edge := bounds.x if axis==0 else bounds.z
		var gap := edge-absf(position[axis])
		if gap<0.7: avoid[axis]-=signf(position[axis])*(0.7-gap)*4.0
	if position.y<0.55:avoid.y+=(0.55-position.y)*5.0
	if position.y>bounds.y-0.35:avoid.y-=(position.y-bounds.y+0.35)*5.0
	var factor := 0.3 if slow else 1.0
	var wanted := (desired+avoid).normalized()*speed*factor*(1.2 if feeding else 1.0)
	velocity=velocity.move_toward(wanted,dt*0.5*factor)
	position+=velocity*dt
	position.x=clampf(position.x,-bounds.x+0.18,bounds.x-0.18)
	position.z=clampf(position.z,-bounds.z+0.16,bounds.z-0.16)
	position.y=clampf(position.y,0.28,bounds.y-0.15)
	if velocity.length()>0.02:
		var yaw := atan2(-velocity.z,velocity.x)
		rotation.y=lerp_angle(rotation.y,yaw,1.0-exp(-dt*2.3))
		rotation.z=lerp_angle(rotation.z,clampf(velocity.y,-0.3,0.3),1.0-exp(-dt*2.0))
	if tail:tail.rotation.y=sin(age*(5.0+velocity.length()*5.0)+phase)*0.3*factor
	for i in range(fins.size()):
		fins[i].rotation.x=sin(age*8.0+phase+i)*0.14*factor
	if skin:skin.set_shader_parameter("swim_speed",velocity.length())
