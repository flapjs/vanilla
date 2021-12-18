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

function draw_vertex(v) {
  const ctx = get_canvas().getContext("2d");
  // draw the circle
  ctx.beginPath();
  ctx.arc(v.x, v.y, v.r, 0, 2*Math.PI);
  ctx.lineWidth = Math.round(v.r/10);
  ctx.stroke();
  // draw the text inside
  ctx.font = `${v.r}px Sans-Serif`;
  ctx.textAlign = 'center';  // align left right center
  ctx.textBaseline = 'middle';  // align top bottom center
  ctx.fillText(v.name, v.x, v.y);
  if (v.is_start) {  // it is the starting vertex
    const tip1 = [v.x-v.r, v.y], tip2 = [v.x-1.5*v.r, v.y-v.r/2], tip3 = [v.x-1.5*v.r, v.y+v.r/2];
    draw_triangle(tip1, tip2, tip3);
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
    is_end: false,
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

function bind_double_click() {
  get_canvas().addEventListener('dblclick', e => {  // double click to create vertices
    if (e.movementX || e.movementY) return;  // shifted, don't create
    const [x, y] = get_position(e);
    create_vertex(x, y);
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
  const dx = e.movementX, dy = e.movementY;
  shift_vertices(dx, dy);
}

function higher_order_drag_vertex(v) {
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

function create_edge(u, v) {
  const transition_trigger = prompt("Please input the transition", "0");
  if (!transition_trigger) return;  // can't have null transition
  // now we add the edge to the graph and draw it
  const s = graph.get(u), t = graph.get(v);
  s.out.add([transition_trigger, v]);
  t.in.add([transition_trigger, u]);
  const vec = [t.x-s.x, t.y-s.y];
  const normalized = normalize(vec, s.r);
  const start_x = s.x+normalized[0], start_y = s.y+normalized[1], end_x = t.x-normalized[0], end_y = t.y-normalized[1];
  draw_arrow(start_x, start_y, end_x, end_y);
  const ctx = get_canvas().getContext('2d');
  ctx.font = `${v.r}px Sans-Serif`;
  ctx.textAlign = 'center';  // align left right center
  ctx.textBaseline = 'bottom';  // align top bottom center
  ctx.fillText(transition_trigger, (start_x+end_x)/2, (start_y+end_y)/2);
}

function higher_order_drag_edge_from(v) {
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
    if (e.button == LEFT_BTN) {  // left drag
      if (!clicked_vertex) {  // left drag scene
        canvas.addEventListener('mousemove', drag_scene);
      } else {  // left drag vertex
        drag_vertex = higher_order_drag_vertex(clicked_vertex);  // create the function
        canvas.addEventListener('mousemove', drag_vertex);
      }
    } else if (e.button == RIGHT_BTN && clicked_vertex) {  // right drag edge
      drag_edge = higher_order_drag_edge_from(clicked_vertex);
      canvas.addEventListener('mousemove', drag_edge);
    }
  });
  canvas.addEventListener('mouseup', () => {
    canvas.removeEventListener('mousemove', drag_scene);
    canvas.removeEventListener('mousemove', drag_vertex);
    canvas.removeEventListener('mousemove', drag_edge);
  })
}

function bind_context_menu() {
  get_canvas().addEventListener('contextmenu', e => {
    e.preventDefault();  // stop the context from showing
    // add custom menu here if clicked within one of the vertices
    // console.log(e);
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