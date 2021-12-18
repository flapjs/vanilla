document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', redraw);

const [LEFT_BTN, MID_BTN, RIGHT_BTN] = [0, 1, 2];

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
  graph.forEach(draw_vertex);
  for (let v of graph.values()) {
    for (let [transition, u] of v.out) {
      draw_edge(v, graph.get(u), transition);
    }
  }
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

function draw_vertex(vertex) {
  const ctx = get_canvas().getContext("2d");
  // draw the circle
  draw_cricle(vertex.x, vertex.y, vertex.r);
  // draw the text inside
  ctx.font = `${vertex.r}px Sans-Serif`;
  ctx.textAlign = 'center';  // align left right center
  ctx.textBaseline = 'middle';  // align top bottom center
  ctx.fillText(vertex.name, vertex.x, vertex.y);
  if (vertex.is_start) {  // it is the starting vertex
    const tip1 = [vertex.x-vertex.r, vertex.y],
          tip2 = [vertex.x-1.5*vertex.r, vertex.y-vertex.r/2],
          tip3 = [vertex.x-1.5*vertex.r, vertex.y+vertex.r/2];
    draw_triangle(tip1, tip2, tip3);
  }
  if (vertex.is_final) {
    draw_final_circle(vertex);
  }
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
    in: new Set()
  };
  graph.set(name, vertex);  // add to the list
  draw_vertex(vertex);  // draw it
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

function toggle_final(v, to=true) {
  const vertex = graph.get(v);
  if (vertex.is_final == to) return;  // prevent drawing too many circles
  vertex.is_final = to;
  if (to) draw_final_circle(vertex);  // adding a circle
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
  for (let [k, v] of graph.entries()) {
    const diff_squared = (x-v.x)*(x-v.x)+(y-v.y)*(y-v.y);
    if (diff_squared < v.r*v.r) return k;
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
  remove_context_menu();
  const dx = e.movementX, dy = e.movementY;
  shift_vertices(dx, dy);
}

function higher_order_drag_vertex(v) {
  remove_context_menu();
  const vertex = graph.get(v);
  return e => {
    const dx = e.movementX, dy = e.movementY;
    vertex.x += dx;
    vertex.y += dy;
    redraw();
  }
}
let drag_vertex = null;  // hack

function draw_triangle(tip1, tip2, tip3) {
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(...tip1);
  ctx.lineTo(...tip2);
  ctx.lineTo(...tip3);
  ctx.fill();
}

function draw_arrow(start_x, start_y, end_x, end_y) {
  const vec = normalize([end_x-start_x, end_y-start_y], 15);  // arrow length is 15
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(start_x, start_y);
  ctx.lineTo(end_x-vec[0], end_y-vec[1]);
  ctx.stroke();
  const normal = [-vec[1]/2, vec[0]/2];
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

function normalize(vec, final_length=1) {
  const adjusted_vec = [];
  const length_adj = vec_len(vec)/final_length;
  vec.forEach(component => adjusted_vec.push(component/length_adj));
  return adjusted_vec;
}

function draw_edge(s, t, transition) {
  const vec = [t.x-s.x, t.y-s.y];
  const normalized = normalize(vec, s.r);
  const start_x = s.x+normalized[0], start_y = s.y+normalized[1], end_x = t.x-normalized[0], end_y = t.y-normalized[1];
  draw_arrow(start_x, start_y, end_x, end_y);
  const ctx = get_canvas().getContext('2d');
  ctx.font = `${s.r}px Sans-Serif`;
  ctx.textAlign = 'center';  // align left right center
  ctx.textBaseline = 'bottom';  // align top bottom center
  ctx.fillText(transition, (start_x+end_x)/2, (start_y+end_y)/2);
}

function create_edge(u, v) {
  const transition_trigger = prompt("Please input the transition", "0");
  if (!transition_trigger) return;  // can't have null transition
  // now we add the edge to the graph and draw it
  const s = graph.get(u), t = graph.get(v);
  s.out.add([transition_trigger, v]);
  t.in.add([transition_trigger, u]);
  draw_edge(s, t, transition_trigger);
}

function higher_order_drag_edge_from(v) {
  remove_context_menu();
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
let drag_edge = null;  // hack

function bind_drag() {
  const canvas = get_canvas();
  canvas.addEventListener('mousedown', e => {
    const [x, y] = get_position(e);
    const clicked_vertex = in_vertex(x, y);
    if ((e.button == RIGHT_BTN || e.ctrlKey) && clicked_vertex) {  // right drag edge
      drag_edge = higher_order_drag_edge_from(clicked_vertex);
      canvas.addEventListener('mousemove', drag_edge);
    } else if (e.button == LEFT_BTN) {  // left drag
      if (!clicked_vertex) {  // left drag scene
        canvas.addEventListener('mousemove', drag_scene);
      } else {  // left drag vertex
        drag_vertex = higher_order_drag_vertex(clicked_vertex);  // create the function
        canvas.addEventListener('mousemove', drag_vertex);
      }
    }
  });
  canvas.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', drag_scene);
    canvas.removeEventListener('mousemove', drag_vertex);
    canvas.removeEventListener('mousemove', drag_edge);
  })
}

function display_vertex_menu(vertex, x, y) {
  const container = document.createElement('div');
  container.className = 'contextmenu';
  const rename_div = document.createElement('div');
  const switches_div = document.createElement('div');
  container.appendChild(rename_div);
  container.appendChild(switches_div);
  const rename = document.createElement('input');
  rename_div.appendChild(rename);
  const start_check = document.createElement('input');
  start_check.type = 'checkbox';
  if (vertex.is_start) start_check.checked = true;
  start_check.addEventListener('change', function() { if (this.checked) set_start(vertex.name); });
  const final_check = document.createElement('input');
  final_check.type = 'checkbox';
  if (vertex.is_final) final_check.checked = true;
  final_check.addEventListener('change', function() { toggle_final(vertex.name, this.checked); });
  switches_div.appendChild(start_check);
  switches_div.appendChild(final_check);
  container.style = `position:absolute; left:${x}px; top:${y}px`;
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
    if (v) display_vertex_menu(graph.get(v), e.clientX, e.clientY);
  });
  canvas.addEventListener('mousedown', e => {
    if (e.button === LEFT_BTN) remove_context_menu();
  });
}

/**
 * run after all the contents are loaded
 */
function init() {
  console.log('loaded');
  redraw();  // first time is actually to resize the canvas

  bind_double_click();
  bind_drag();
  bind_context_menu();
}