document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', redraw);

const [LEFT_BTN, MID_BTN, RIGHT_BTN] = [0, 1, 2];
const EMPTY_FUNCTION = () => {};

// this is the graph
const graph = new Map();

/**
 * get the machine drawing canvas
 * @returns the canvas object on which the machine is drawn
 */
function get_canvas() {
  return document.getElementById('machine_drawing');
}

function redraw() {
  const canvas = get_canvas();
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  graph.forEach(vertex => {
    draw_vertex(vertex.name);
    vertex.out.forEach(draw_edge);
  });
}

/**
 * go through the list of used names for a vertex and find the smallest unused
 * @returns the smallest unused name for a vertex
 */
function find_unused_name() {
  const prefix = 'q';  // using standard notation
  let i;
  for (i = 0; i <= graph.size; i++) {  // we don't need to look further than how many elements in the set
    if (!graph.has(prefix+`${i}`)) break;
  }
  return prefix+`${i}`;
}

function draw_cricle(x, y, r, thickness=1) {
  const ctx = get_canvas().getContext("2d");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.lineWidth = Math.round(thickness);
  ctx.stroke();
}

function draw_vertex(v) {
  const vertex = graph.get(v);
  // draw the circle
  draw_cricle(vertex.x, vertex.y, vertex.r);
  // draw the text inside
  draw_text(vertex.name, vertex.x, vertex.y, vertex.r);
  if (vertex.is_start) {  // it is the starting vertex
    const tip1 = [vertex.x-vertex.r, vertex.y],
          tip2 = [vertex.x-1.5*vertex.r, vertex.y-vertex.r/2],
          tip3 = [vertex.x-1.5*vertex.r, vertex.y+vertex.r/2];
    draw_triangle(tip1, tip2, tip3);
  }
  if (vertex.is_final) draw_final_circle(vertex);
}

function create_vertex(x, y, radius=40) {
  const name = find_unused_name();
  const vertex = {
    name: name,
    x: x,
    y: y,
    r: radius,
    is_start: graph.size === 0,
    is_final: false,
    out: new Set(),
  };
  graph.set(name, vertex);  // add to the list
  draw_vertex(name);  // draw it
}

function get_position(e) {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return [x, y];
}

function draw_final_circle(vertex) {
  draw_cricle(vertex.x, vertex.y, vertex.r*0.8);
}

function set_start(v) {
  graph.forEach(vertex => vertex.is_start = false);
  graph.get(v).is_start = true;
  redraw();
}

function toggle_final(v) {
  const vertex = graph.get(v);
  vertex.is_final = !vertex.is_final;
  if (vertex.is_final) draw_final_circle(vertex);  // adding a circle
  else redraw();  // removing the circle, requires redrawing
}

function bind_double_click() {
  get_canvas().addEventListener('dblclick', e => {  // double click to create vertices
    if (e.movementX || e.movementY) return;  // shifted, don't create
    const [x, y] = get_position(e);
    const v = in_vertex(x, y);
    if (v) toggle_final(v);
    else create_vertex(x, y);
  })
}

/**
 * detects if the current click is inside a vertex
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns returns the first vertex in the graph that contains (x, y), null otherwise
 */
function in_vertex(x, y) {
  for (let vertex of graph.values()) {
    const diff = [x-vertex.x, y-vertex.y];
    if (vec_len(diff) < vertex.r) return vertex.name;
  }
  return null;
}

/**
 * detects if the current click is inside edge text
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns returns the first edge in the graph that contains (x, y), null otherwise
 */
 function in_edge_text(x, y) {
  for (let vertex of graph.values()) {
    for (let edge of vertex.out) {
      const {_, __, to, a1, a2} = edge;
      const other = graph.get(to);
      const v1 = [other.x-vertex.x, other.y-vertex.y];
      const v2 = normalize(normal_vec(v1), vertex.r);
      const mid_vec = linear_comb(v1, v2, a1, a2);
      const [mid_x, mid_y] = [vertex.x+mid_vec[0], vertex.y+mid_vec[1]];
      const diff = [x-mid_x, y-mid_y];
      if (vec_len(diff) < vertex.r/2) return edge;
    }
  }
  return null;
}

function shift_vertices(dx, dy) {
  graph.forEach(v => {
    v.x += dx;
    v.y += dy;
  });
  redraw();
}

function drag_scene(e) {
  const dx = e.movementX, dy = e.movementY;
  shift_vertices(dx, dy);
}

function higher_order_drag_vertex(v) {
  const vertex = graph.get(v);
  return e => {
    [vertex.x, vertex.y] = get_position(e);
    redraw();
  }
}
let drag_vertex = EMPTY_FUNCTION;  // hack

function draw_triangle(tip1, tip2, tip3) {
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(...tip1);
  ctx.lineTo(...tip2);
  ctx.lineTo(...tip3);
  ctx.fill();
}

function proj(u, v) {
  const unit_v = normalize(v);
  const dot_prod = u[0]*unit_v[0] + u[1]*unit_v[1];
  return [dot_prod*unit_v[0], dot_prod*unit_v[1]];
}

function draw_arrow(start_x, start_y, end_x, end_y, mid_x, mid_y) {
  if (!mid_x) mid_x = (start_x+end_x)/2;
  if (!mid_y) mid_y = (start_y+end_y)/2;
  const vec1 = [mid_x-start_x, mid_y-start_y];
  const vec2 = [end_x-start_x, end_y-start_y];
  const v1_on_v2 = proj(vec1, vec2);
  const ortho_comp = [(vec1[0]-v1_on_v2[0])/3, (vec1[1]-v1_on_v2[1])/3];
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(start_x, start_y);
  // we boost the curve by the orthogonal component of v1 wrt v2
  ctx.quadraticCurveTo(mid_x+ortho_comp[0], mid_y+ortho_comp[1], end_x, end_y);
  ctx.stroke();
  const vec = normalize([end_x-mid_x, end_y-mid_y], 15);  // arrow length is 15
  const normal = normal_vec(vec);
  const tip1 = [end_x, end_y],
        tip2 = [end_x-vec[0]+normal[0], end_y-vec[1]+normal[1]],
        tip3 = [end_x-vec[0]-normal[0], end_y-vec[1]-normal[1]];
  draw_triangle(tip1, tip2, tip3);
}

function vec_len(vec) {
  let squared_sum = 0;
  vec.forEach(component => squared_sum+=component*component);
  return Math.sqrt(squared_sum);
}

function normal_vec(vec) {
  return [-vec[1]/2, vec[0]/2];
}

function normalize(vec, final_length=1) {
  const adjusted_vec = [];
  const length_adj = vec_len(vec)/final_length;
  vec.forEach(component => adjusted_vec.push(component/length_adj));
  return adjusted_vec;
}

function linear_comb(v1, v2, a1=1, a2=1) {
  const [v1_x, v1_y] = [a1*v1[0], a1*v1[1]];
  const [v2_x, v2_y] = [a2*v2[0], a2*v2[1]];
  return [v1_x+v2_x, v1_y+v2_y];
}

function draw_text(text, x, y, size) {
  const ctx = get_canvas().getContext('2d');
  ctx.font = `${size}px Sans-Serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function draw_edge(edge) {
  const {transition, from, to, a1, a2} = edge;
  const s = graph.get(from), t = graph.get(to);
  const v1 = [t.x-s.x, t.y-s.y];  // basis vector 1 (from->to)
  const v2 = normalize(normal_vec(v1), s.r);  // basis vector 2
  const inner_vec = normalize(v1, s.r);
  const [start_x, start_y] = [s.x+inner_vec[0], s.y+inner_vec[1]];
  const [end_x, end_y] = [t.x-inner_vec[0], t.y-inner_vec[1]];
  const mid_vec = linear_comb(v1, v2, a1, a2);
  const [mid_x, mid_y] = [s.x+mid_vec[0], s.y+mid_vec[1]];
  draw_arrow(start_x, start_y, end_x, end_y, mid_x, mid_y);
  draw_text(transition, mid_x, mid_y, s.r);
}

function create_edge(u, v, self_loop=false) {
  const transition = prompt("Please input the transition", "0");
  if (!transition) return;  // can't have null transition
  // now we add the edge to the graph and draw it
  const default_a1 = 0.5, default_a2 = 0;  // right in the center
  const edge = { transition: transition, from: u, to: v, a1: default_a1, a2: default_a2 };
  graph.get(u).out.add(edge);
  draw_edge(edge);
}

function higher_order_edge_animation(v) {
  const vertex = graph.get(v);  // convert name of vertex to actual vertex
  const canvas = get_canvas();
  const ctx = canvas.getContext('2d');
  const cached_canvas = canvas.cloneNode();
  cached_canvas.getContext('2d').drawImage(canvas, 0, 0);  // save the original image
  const restore = () => {  // helper to restore to the orignal canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // clear
    ctx.drawImage(cached_canvas, 0, 0);  // restore
  }

  canvas.addEventListener('mouseup', e => {  // additional event listener to restore canvas and snap to vertex
    const cur_vertex = in_vertex(...get_position(e));
    restore();
    if (cur_vertex && cur_vertex !== v) create_edge(v, cur_vertex);  // snap to the other vertex
  }, { once:true });  // snap once only

  return e => {
    const [x, y] = get_position(e);
    if (in_vertex(x, y) === v) return;  // haven't left the vertex yet
    // now we are away from the vertex
    restore();
    const [truncate_x, truncate_y] = normalize([x-vertex.x, y-vertex.y], vertex.r);
    draw_arrow(vertex.x+truncate_x, vertex.y+truncate_y, x, y);
  }
}
let edge_animation = EMPTY_FUNCTION;  // hack

function higher_order_drag_edge(edge) {
  const s = graph.get(edge.from), t = graph.get(edge.to);

  return e => {
    const [mid_x, mid_y] = get_position(e);
    const mid_vec = [mid_x-s.x, mid_y-s.y];
    const v1 = [t.x-s.x, t.y-s.y];
    const v2 = normalize(normal_vec(v1), s.r);
    const proj_on_v1 = proj(mid_vec, v1);
    const proj_on_v2 = proj(mid_vec, v2);
    [edge.a1, edge.a2] = [proj_on_v1[0]/v1[0], proj_on_v2[0]/v2[0]];
    redraw();
  }
}
let drag_edge = EMPTY_FUNCTION;

function bind_drag() {
  const canvas = get_canvas();
  canvas.addEventListener('mousedown', e => {
    const [x, y] = get_position(e);
    const clicked_vertex = in_vertex(x, y);
    const clicked_edge = in_edge_text(x, y);
    if ((e.button == RIGHT_BTN || e.ctrlKey) && clicked_vertex) {  // right create edge
      edge_animation = higher_order_edge_animation(clicked_vertex);
      canvas.addEventListener('mousemove', edge_animation);
    } else if (e.button == LEFT_BTN) {  // left drag
      if (clicked_vertex) {  // left drag vertex
        drag_vertex = higher_order_drag_vertex(clicked_vertex);  // create the function
        canvas.addEventListener('mousemove', drag_vertex);
      } else if (clicked_edge) {
        drag_edge = higher_order_drag_edge(clicked_edge);
        canvas.addEventListener('mousemove', drag_edge);
      } else {  // left drag scene
        canvas.addEventListener('mousemove', drag_scene);
      } 
    }
  });
  canvas.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', drag_scene);
    canvas.removeEventListener('mousemove', drag_vertex);
    canvas.removeEventListener('mousemove', drag_edge);
    canvas.removeEventListener('mousemove', edge_animation);
  })
}

function delete_vertex(v) {
  graph.delete(v);  // remove this vertex
  for (let vertex of graph.values()) {
    for (let edge of vertex.out) {
      if (edge.to == v) vertex.out.delete(edge);  // remove all edges leading to it
    }
  }
  redraw();
}

function display_vertex_menu(v, x, y) {
  const container = document.createElement('div');
  container.className = 'contextmenu';
  const rename_div = document.createElement('div');
  const buttons_div = document.createElement('div');
  const delete_div = document.createElement('div');
  delete_div.innerText = 'delete';
  delete_div.addEventListener('click', () => { remove_context_menu(); delete_vertex(v); });
  container.appendChild(rename_div);
  container.appendChild(buttons_div);
  container.appendChild(delete_div);
  const rename = document.createElement('input');
  rename_div.appendChild(rename);
  const start_btn = document.createElement('button');
  start_btn.innerText = 'make start';
  start_btn.addEventListener('click', () => set_start(v));
  const final_btn = document.createElement('button');
  final_btn.innerText = 'toggle final';
  final_btn.addEventListener('click', () => toggle_final(v));
  buttons_div.appendChild(start_btn);
  buttons_div.appendChild(final_btn);
  container.style = `position:absolute; left:${x}px; top:${y}px; color:blue`;
  document.querySelector('body').appendChild(container);
}

function remove_context_menu() {
  const menu = document.querySelector('.contextmenu');
  if (!menu) return;
  document.querySelector('body').removeChild(menu);
}

function bind_context_menu() {
  const canvas = get_canvas();
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();  // stop the context from showing
    remove_context_menu();
    const [x, y] = get_position(e);
    const v = in_vertex(x, y);
    if (v) display_vertex_menu(v, e.clientX, e.clientY);
  });
  canvas.addEventListener('mousedown', e => {
    if (e.button === LEFT_BTN) remove_context_menu();
  });
}

/**
 * run after all the contents are loaded
 */
function init() {
  redraw();  // first time is actually to resize the canvas

  bind_double_click();
  bind_drag();
  bind_context_menu();
}