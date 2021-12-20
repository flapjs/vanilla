document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', redraw);

const [LEFT_BTN, MID_BTN, RIGHT_BTN] = [0, 1, 2];
const EMPTY_FUNCTION = () => {};  // place holder function
const CLICK_HOLD_TIME = 350;  // [ms] the maximum time between mousedown and mouseup that is still considered a click
const DEFAULT_VERTEX_RADIUS = 40;
const START_TRIANGLE_SCALE = 0.6;  // wrt vertex radius
const ARROW_LENGTH = 15;
const ARROW_WIDTH = 10;

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

/**
 * draw a circle on the current canvas
 * @param {int} x - x position from left wrt canvas
 * @param {int} y - y position from top wrt canvas
 * @param {int} r - radius of the circle
 * @param {float} thickness - line width
 */
function draw_cricle(x, y, r, thickness=1) {
  const ctx = get_canvas().getContext("2d");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.lineWidth = Math.round(thickness);
  ctx.stroke();
}

/**
 * given the name of the vertex, grab the vertex from graph and draw it on screen
 * @param {string} v 
 */
function draw_vertex(v) {
  const vertex = graph.get(v);
  // draw the circle
  draw_cricle(vertex.x, vertex.y, vertex.r);
  // draw the text inside
  draw_text(vertex.name, vertex.x, vertex.y, vertex.r);
  if (vertex.is_start) {  // it is the starting vertex
    const tip1 = [vertex.x-vertex.r, vertex.y],
          tip2 = [tip1[0]-START_TRIANGLE_SCALE*vertex.r, tip1[1]-START_TRIANGLE_SCALE*vertex.r],
          tip3 = [tip1[0]-START_TRIANGLE_SCALE*vertex.r, tip1[1]+START_TRIANGLE_SCALE*vertex.r];
    draw_triangle(tip1, tip2, tip3);
  }
  if (vertex.is_final) draw_final_circle(vertex);
}

/**
 * create a vertex at the place the user has clicked
 * @param {float} x - x position of the user mouse click wrt canvas
 * @param {float} y - y position of the user mouse click wrt canvas
 * @param {float} radius - the radius of the graphical element
 */
function create_vertex(x, y, radius=DEFAULT_VERTEX_RADIUS) {
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

/**
 * get the position of the mouseclick event wrt canvas
 * @param {Object} e 
 * @returns {Array<float>} x and y position of the mouseclick wrt canvas
 */
function get_position(e) {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return [x, y];
}

/**
 * draws a smaller concentric circle within the vertex
 * @param {Object} vertex - the vertex object in which we want to draw a circle
 */
function draw_final_circle(vertex) {
  draw_cricle(vertex.x, vertex.y, vertex.r*0.8);
}

/**
 * mark a vertex as start
 * @param {string} v - name of the vertex
 */
function set_start(v) {
  graph.forEach(vertex => vertex.is_start = false);
  graph.get(v).is_start = true;
  redraw();
}

/**
 * toggle whether a vertex is accept
 * @param {string} v - name of the vertex
 */
function toggle_final(v) {
  const vertex = graph.get(v);
  vertex.is_final = !vertex.is_final;
  if (vertex.is_final) draw_final_circle(vertex);  // adding a circle
  else redraw();  // removing the circle, requires redrawing
}

/**
 * binds double click behavior
 */
function bind_double_click() {
  get_canvas().addEventListener('dblclick', e => {  // double click to create vertices
    if (e.movementX || e.movementY) return;  // shifted, don't create
    const [x, y] = get_position(e);
    const v = in_any_vertex(x, y);
    if (v) toggle_final(v);
    else create_vertex(x, y);
  })
}

/**
 * checks if (x, y) wrt canvas is inside vertex v
 * @param {float} x - x position
 * @param {float} y - y position
 * @param {string} v - name of the vertex 
 * @returns {boolean} whether (x, y) is in v
 */
function in_vertex(x, y, v) {
  const vertex = graph.get(v);
  const diff = [x-vertex.x, y-vertex.y];
  return vec_len(diff) < vertex.r;
}

/**
 * detects if the current click is inside a vertex
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns {string} returns the first vertex in the graph that contains (x, y), null otherwise
 */
function in_any_vertex(x, y) {
  for (let v of graph.keys()) {
    if (in_vertex(x, y, v)) return v;
  }
  return null;
}

/**
 * detects if the current click is inside edge text
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns {Object} returns the first edge in the graph that contains (x, y), null otherwise
 */
 function in_edge_text(x, y) {
  for (let vertex of graph.values()) {
    for (let edge of vertex.out) {
      const [, , mid] = compute_edge_geometry(edge);
      const diff = [x-mid[0], y-mid[1]];
      if (vec_len(diff) < vertex.r/2) return edge;
    }
  }
  return null;
}

/**
 * shift the entire graph by dx and dy
 * @param {Object} e - mousemove event
 */
function drag_scene(e) {
  const dx = e.movementX, dy = e.movementY;
  graph.forEach(v => {
    v.x += dx;
    v.y += dy;
  });
  redraw();
}

/**
 * builds a drag vertex callback function
 * @param {string} v - name of the vertex to be dragged 
 * @returns {function} a callback function to handle dragging a vertex
 */
function higher_order_drag_vertex(v) {
  const vertex = graph.get(v);
  return e => {
    [vertex.x, vertex.y] = get_position(e);
    redraw();
  }
}
let drag_vertex = EMPTY_FUNCTION;

/**
 * draw a triangle with three tips provided
 * @param {Array<float>} tip1 
 * @param {Array<float>} tip2 
 * @param {Array<float>} tip3 
 */
function draw_triangle(tip1, tip2, tip3) {
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(...tip1);
  ctx.lineTo(...tip2);
  ctx.lineTo(...tip3);
  ctx.fill();
}

/**
 * projection of the 2d vector u on to v
 * @param {Array<float>} u - first vector
 * @param {Array<float>} v - second vector (onto which to project the first)
 * @returns {Array<float>} the component of the first vector in the direction of the second
 */
function proj(u, v) {
  const unit_v = normalize(v);
  const dot_prod = u[0]*unit_v[0] + u[1]*unit_v[1];
  return [dot_prod*unit_v[0], dot_prod*unit_v[1]];
}

/**
 * draw an curved array with start, end and a mid
 * @param {float} start_x - where to begin x
 * @param {float} start_y - where to begin y
 * @param {float} end_x - where to end x
 * @param {float} end_y - where to end y
 * @param {float} mid_x - control x for quadratic bezier curve
 * @param {float} mid_y - control y for quadratic bezier curve
 */
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
  const vec = normalize([end_x-mid_x, end_y-mid_y], ARROW_LENGTH);
  const normal = normalize(normal_vec(vec), ARROW_WIDTH/2);  // half of the total width
  const tip1 = [end_x, end_y],
        tip2 = [end_x-vec[0]+normal[0], end_y-vec[1]+normal[1]],
        tip3 = [end_x-vec[0]-normal[0], end_y-vec[1]-normal[1]];
  draw_triangle(tip1, tip2, tip3);
}

/**
 * compute the length of a vector
 * @param {Array<float>} vec - a vector whose length we want to compute
 * @returns {float} the length of the vector
 */
function vec_len(vec) {
  let squared_sum = 0;
  vec.forEach(component => squared_sum+=component*component);
  return Math.sqrt(squared_sum);
}

/**
 * computes a orthogonal vector
 * @param {Array<float>} vec - a vector on which to calculate the orthogonal vector
 * @returns {Array<float>} a vector orthogonal of the original vector
 */
function normal_vec(vec, clockwise=false) {
  return clockwise ? [vec[1], -vec[0]] : [-vec[1], vec[0]];
}

/**
 * normalizes a vector to a specific length
 * @param {Array<float>} vec - the vector you want to scale
 * @param {float} final_length - the length you want the final vector to end up
 * @returns {Array<float>} the normalized vector
 */
function normalize(vec, final_length=1) {
  const adjusted_vec = [];
  const length_adj = vec_len(vec)/final_length;
  vec.forEach(component => adjusted_vec.push(component/length_adj));
  return adjusted_vec;
}

/**
 * calculate the linear combination of a1*v1+a2*v2
 * @param {Array<float>} v1 - vector1
 * @param {Array<float>} v2 - vector2
 * @param {float} a1 - scalar1
 * @param {float} a2 - scalar2
 * @returns {Array<float>} the result of a1*v1+a2*v2
 */
function linear_comb(v1, v2, a1=1, a2=1) {
  const [v1_x, v1_y] = [a1*v1[0], a1*v1[1]];
  const [v2_x, v2_y] = [a2*v2[0], a2*v2[1]];
  return [v1_x+v2_x, v1_y+v2_y];
}

/**
 * draw text on the canvas
 * @param {*} text - the text you want to draw on the screen
 * @param {*} x - x position wrt canvas
 * @param {*} y - y position wrt canvas
 * @param {float} size - font size
 */
function draw_text(text, x, y, size) {
  const ctx = get_canvas().getContext('2d');
  ctx.font = `${size}px Sans-Serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function compute_edge_start_end(edge) {
  const {from, to} = edge;
  const s = graph.get(from), t = graph.get(to);
  let start, end;
  if (from === to) {
    const {angle1, angle2} = edge;  // additioanl attributes storing the start and end angle
    start = [s.x+s.r*Math.cos(angle1), s.y+s.r*Math.sin(angle1)];
    end = [t.x+t.r*Math.cos(angle2), t.y+t.r*Math.sin(angle2)];
  } else {
    const from_to = [t.x-s.x, t.y-s.y];
    const inner_vec = normalize(from_to, s.r);
    start = [s.x+inner_vec[0], s.y+inner_vec[1]];
    end = [t.x-inner_vec[0], t.y-inner_vec[1]];
  }
  return [start, end];
}

function compute_edge_geometry(edge) {
  const {from, to, a1, a2} = edge;
  const s = graph.get(from);
  const [start, end] = compute_edge_start_end(edge);
  // construct the two basis vectors
  const v1 = [end[0]-start[0], end[1]-start[1]];
  let v2 = normalize(normal_vec(v1), s.r);
  let mid_vec = linear_comb(v1, v2, a1, a2);
  let mid = [start[0]+mid_vec[0], start[1]+mid_vec[1]];
  if (from === to && in_vertex(...mid, from)) {  // if edge falls inside the from vertex
    v2 = [-v2[0], -v2[1]];  // flip the second basis vector temporarily
    mid_vec = linear_comb(v1, v2, a1, a2);
    mid = [start[0]+mid_vec[0], start[1]+mid_vec[1]];
    edge.a2 = -edge.a2;  // also change the internal direction to make the flip permanent
  }
  return [start, end, mid];
}

/**
 * draws the edge object on the canvas
 * @param {Object} edge - the edge object you want to draw
 */
function draw_edge(edge) {
  const {transition, from} = edge;
  const [start, end, mid] = compute_edge_geometry(edge);
  draw_arrow(...start, ...end, ...mid);
  const text_size = graph.get(from).r;  // using the radius of the vertex as text size
  draw_text(transition, ...mid, text_size);
}

/**
 * creates an edge between two vertices and draw it on the screen
 * @param {string} u - from vertex
 * @param {string} v - to vertex
 * @param {float} angle1 - the angle which the cursor left the from vertex
 * @param {float} angle2 - the angle which the cursor entered the to vertex
 */
function create_edge(u, v, angle1, angle2) {
  const transition = prompt("Please input the transition", "0");
  if (!transition) return;  // can't have null transition
  // now we add the edge to the graph and draw it
  let edge;
  if (u !== v) {  // easy case since start and end are different
    const a1 = 0.5, a2 = 0;  // right in the center
    edge = { transition: transition, from: u, to: v, a1: a1, a2: a2 };
  } else {  // self loop
    const a1 = 0.5, a2 = 1;
    edge = { transition: transition, from: u, to: v, a1: a1, a2: a2, angle1: angle1, angle2: angle2 };
  }
  graph.get(u).out.add(edge);
  draw_edge(edge);
}

/**
 * creates a callback function to handle edge creation animation
 * @param {string} v - the vertex from which the edge is stemmed from
 * @returns {function} a function that handles drawing an edge from v on mousedrag
 */
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
  let has_left_before = false;
  let angle1, angle2;

  canvas.addEventListener('mouseup', e => {  // additional event listener to restore canvas and snap to vertex
    const [x, y] = get_position(e);
    const cur_v = in_any_vertex(x, y);
    const cur_vertex = graph.get(cur_v);
    restore();
    if (cur_v && has_left_before) {
      angle2 = Math.atan2(y-cur_vertex.y, x-cur_vertex.x);
      create_edge(v, cur_v, angle1, angle2);  // snap to the other vertex
    }
  }, { once:true });  // snap once only

  return e => {
    const [x, y] = get_position(e);
    if (in_any_vertex(x, y) === v) return;  // haven't left the vertex yet
    // now we are away from the vertex
    if (!has_left_before) {
      has_left_before = true;
      angle1 = Math.atan2(y-vertex.y, x-vertex.x);
    }
    restore();
    const [truncate_x, truncate_y] = normalize([x-vertex.x, y-vertex.y], vertex.r);
    draw_arrow(vertex.x+truncate_x, vertex.y+truncate_y, x, y);
  }
}
let edge_animation = EMPTY_FUNCTION;

/**
 * creates a callback function that handles dragging an edge
 * @param {Object} edge - the edge you are dragging
 * @returns {function} a callback function that handles dragging an edge
 */
function higher_order_drag_edge(edge) {
  const s = graph.get(edge.from);

  return e => {
    const [mouse_x, mouse_y] = get_position(e);
    const [start, end] = compute_edge_start_end(edge);
    const mid = [mouse_x-start[0], mouse_y-start[1]];
    const v1 = [end[0]-start[0], end[1]-start[1]];
    const v2 = normalize(normal_vec(v1), s.r);
    const proj_on_v1 = proj(mid, v1);
    const proj_on_v2 = proj(mid, v2);
    [edge.a1, edge.a2] = [proj_on_v1[0]/v1[0], proj_on_v2[0]/v2[0]];
    redraw();
  }
}
let drag_edge = EMPTY_FUNCTION;

/**
 * binds callback functions to the mouse dragging behavior
 */
function bind_drag() {
  const canvas = get_canvas();
  canvas.addEventListener('mousedown', e => {
    const [x, y] = get_position(e);
    const clicked_vertex = in_any_vertex(x, y);
    const clicked_edge = in_edge_text(x, y);
    if ((e.button == RIGHT_BTN || e.ctrlKey) && clicked_vertex) {  // right create edge
      edge_animation = higher_order_edge_animation(clicked_vertex);
      canvas.addEventListener('mousemove', edge_animation);
    } else if (e.button == LEFT_BTN) {  // left drag
      if (clicked_edge) {  // left drag edge
        drag_edge = higher_order_drag_edge(clicked_edge);
        canvas.addEventListener('mousemove', drag_edge);
      } else if (clicked_vertex) {  // vertex has lower priority than edge
        drag_vertex = higher_order_drag_vertex(clicked_vertex);  // create the function
        canvas.addEventListener('mousemove', drag_vertex);
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

/**
 * deletes a vertex by its name as well as its associated edges
 * @param {string} v - the vertex you want to delete
 */
function delete_vertex(v) {
  graph.delete(v);  // remove this vertex
  for (let vertex of graph.values()) {
    for (let edge of vertex.out) {
      if (edge.to == v) vertex.out.delete(edge);  // remove all edges leading to it
    }
  }
  redraw();
}

/**
 * creates the context menu to change a vertex and display it
 * @param {string} v - the vertex we clicked on and want to change
 * @param {float} x - x position of the top left corner of the menu
 * @param {float} y - y position of the top left corner of the menu
 */
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

function delete_edge(edge) {
  graph.get(edge.from).out.delete(edge);
  redraw();
}

function rename_edge(edge, new_transition) {
  edge.transition = new_transition;
  redraw();
}

/**
 * creates the context menu to change a vertex and display it
 * @param {string} v - the vertex we clicked on and want to change
 * @param {float} x - x position of the top left corner of the menu
 * @param {float} y - y position of the top left corner of the menu
 */
 function display_edge_menu(edge, x, y) {
  const container = document.createElement('div');
  container.className = 'contextmenu';
  const rename_div = document.createElement('div');
  const delete_div = document.createElement('div');
  delete_div.innerText = 'delete';
  delete_div.addEventListener('click', () => { remove_context_menu(); delete_edge(edge); });
  container.appendChild(rename_div);
  container.appendChild(delete_div);
  const rename = document.createElement('input');
  rename.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') rename_edge(this.value);
  });
  rename_div.appendChild(rename);
  container.style = `position:absolute; left:${x}px; top:${y}px; color:blue`;
  document.querySelector('body').appendChild(container);
}

/**
 * wipes the context menu; does nothing if none exists
 */
function remove_context_menu() {
  const menu = document.querySelector('.contextmenu');
  if (!menu) return;
  document.querySelector('body').removeChild(menu);
}

/**
 * replaces the default context menu
 */
function bind_context_menu() {
  const canvas = get_canvas();
  let last_time_mouse_press;
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();  // stop the context from showing
    remove_context_menu();  // remove old
    console.log(e.timeStamp - last_time_mouse_press);
    if (e.timeStamp - last_time_mouse_press > 350) return;  // hack
    const [x, y] = get_position(e);
    const v = in_any_vertex(x, y);
    const edge = in_edge_text(x, y);
    if (v) display_vertex_menu(v, e.clientX, e.clientY);
    else if (edge) display_edge_menu(edge, e.clientX, e.clientY);
  });
  canvas.addEventListener('mousedown', e => {
    if (e.button === LEFT_BTN) remove_context_menu();
    else if (e.button === RIGHT_BTN) last_time_mouse_press = e.timeStamp;
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