/** @module drawing */

import * as consts from './consts.js';
import * as linalg from './linalg.js';
import * as menus from './menus.js';
import { make_vertex } from './graph_components.js';

/**
 * get the machine drawing canvas
 * @returns the canvas object on which the machine is drawn
 */
export function get_canvas() {
  return document.getElementById('machine_drawing');
}

/**
 * get the position of the mouseclick event wrt canvas
 * @param {Object} e 
 * @returns {Array<float>} x and y position of the mouseclick wrt canvas
 */
export function event_position_on_canvas(e) {
  const rect = get_canvas().getBoundingClientRect();
  const x = (e.clientX - rect.left)*window.devicePixelRatio;
  const y = (e.clientY - rect.top)*window.devicePixelRatio;
  return [x, y];
}

function canvas_size() {
  const rect = get_canvas().getBoundingClientRect();
  return [rect.right*window.devicePixelRatio, rect.bottom*window.devicePixelRatio];
}

/**
 * get the position of the mouseclick event wrt canvas
 * @param {Array<float>} canvas_pt - the [x, y] position wrt canvas 
 * @returns {Array<float>} x and y position wrt window
 */
export function canvas_px_to_window_px(canvas_pt) {
  const rect = get_canvas().getBoundingClientRect();
  return linalg.add([rect.left, rect.top], linalg.scale(1/window.devicePixelRatio, canvas_pt));
}

/**
 * computes an appropriate text size to display the label
 * @param {int} textbox_width - width of textbox in pxiels
 * @param {string} text - the text message to display 
 * @returns {int} fontsize in pixels
 */
function text_size_huristic(textbox_width, text) {
  const default_size = consts.TEXT_SIZING_CONSTS.b+
                       Math.exp(consts.TEXT_SIZING_CONSTS.k*text.length+consts.TEXT_SIZING_CONSTS.a);
  return textbox_width/consts.DEFAULT_VERTEX_RADIUS*default_size;
}

/**
 * draw text on the canvas
 * @param {string} text - the text you want to draw on the screen
 * @param {Array<float>} pos - the position wrt canvas
 * @param {float} size - font size
 * @param {string} text_align - choice from {'center', 'left', 'right'}
 * @param {Array<string>} color_map - an array of colors the same length as the text coding the color of each char
 */
export function draw_text(text, pos, size, color_map, text_align='center') {
  const ctx = get_canvas().getContext('2d');
  ctx.font = `${size}px Sans-Serif`;
  ctx.textAlign = text_align;
  ctx.textBaseline = 'middle';
  if (!color_map) {
    ctx.fillText(text, ...pos);
  } else {  // we want to control the individual character color
    for (let i = 0; i < text.length; ++i) {
      console.log(color_map[i]);
      ctx.fillStyle = color_map[i];
      ctx.fillText(text.charAt(i), pos[0]+i*consts.DEFAULT_VIZ_SIZE, pos[1]);
    }
    ctx.fillStyle = consts.DEFAULT_INPUT_COLOR;  // reset to default fill style
  }
}

/**
 * draw a circle on the current canvas
 * @param {int} x - x position from left wrt canvas
 * @param {int} y - y position from top wrt canvas
 * @param {int} r - radius of the circle
 * @param {boolean} highlighted - if true, fill the circle with color
 * @param {float} thickness - line width
 */
export function draw_cricle(x, y, r, highlighted=false, thickness=1) {
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.lineWidth = Math.round(thickness);
  ctx.stroke();
  if (highlighted) {
    ctx.fillStyle = consts.HIGHLIGHTED_VERTEX_COLOR;
    ctx.fill();
    ctx.fillStyle = 'black';  // reset to default for text and other drawings
  }
}

/**
 * draws a smaller concentric circle within the vertex
 * @param {Object} vertex - the vertex object in which we want to draw a circle
 */
export function draw_final_circle(vertex) {
  draw_cricle(vertex.x, vertex.y, vertex.r*consts.FINAL_CIRCLE_SIZE);
}

/**
 * given the name of the vertex, grab the vertex from graph and draw it on screen
 * @param {Object} vertex - the vertex we want to draw
 */
export function draw_vertex(vertex) {
  // draw the circle
  draw_cricle(vertex.x, vertex.y, vertex.r, vertex.highlighted);
  // find an appropriate text size and draw the text inside the vertex
  draw_text(vertex.name, [vertex.x, vertex.y], text_size_huristic(vertex.r, vertex.name));
  if (vertex.is_start) {  // it is the starting vertex
    const tip1 = [vertex.x-vertex.r, vertex.y],
      tip2 = linalg.sub(tip1, linalg.scale(consts.START_TRIANGLE_SCALE, [vertex.r, vertex.r])),
      tip3 = linalg.sub(tip1, linalg.scale(consts.START_TRIANGLE_SCALE, [vertex.r, -vertex.r]));
    draw_triangle(tip1, tip2, tip3);
  }
  if (vertex.is_final) {
    draw_final_circle(vertex);
  }
}

/**
 * draw a triangle with three tips provided
 * @param {Array<float>} tip1 
 * @param {Array<float>} tip2 
 * @param {Array<float>} tip3 
 */
export function draw_triangle(tip1, tip2, tip3) {
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(...tip1);
  ctx.lineTo(...tip2);
  ctx.lineTo(...tip3);
  ctx.fill();
}

/**
 * draw an curved array with start, end and a mid
 * @param {Array<float>} start - where to begin
 * @param {Array<float>} end - where to end
 * @param {Array<float>} mid - control point for quadratic bezier curve
 * @param {string} edge_text - the text to display on the edge
 * @param {float} text_size - the size of the text
 */
export function draw_arrow(start, end, mid, edge_text, text_size) {
  if (!mid) {
    mid = linalg.scale(1/2, linalg.add(start, end));
  }  // find mid if DNE
  const start_to_mid = linalg.sub(mid, start), mid_to_end = linalg.sub(end, mid), start_to_end = linalg.sub(end, start);
  const v1_on_v2 = linalg.proj(start_to_mid, start_to_end);
  const ortho_comp = linalg.scale(consts.EDGE_CURVATURE, linalg.sub(start_to_mid, v1_on_v2));
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(...start);
  // we boost the curve by the orthogonal component of v1 wrt v2
  ctx.quadraticCurveTo(...linalg.add(mid, ortho_comp), ...end);
  // drawSplit(start, end, mid, consts.DRAW_ARROW_RADIUS, "1", 10);
  ctx.stroke();
  const arrow_tip = linalg.normalize(linalg.sub(mid_to_end, ortho_comp), consts.ARROW_LENGTH);  
  const normal_to_tip = linalg.normalize(linalg.normal_vec(arrow_tip), consts.ARROW_WIDTH/2);  // half the total width
  const tip1 = end,
    tip2 = linalg.add(linalg.sub(end, arrow_tip), normal_to_tip),
    tip3 = linalg.sub(linalg.sub(end, arrow_tip), normal_to_tip);
  draw_triangle(tip1, tip2, tip3);
}

/**
 * draw a split arrow with start, end and a mid
 * do not draw points if the distance from point to mid is less than radius
 * @param {Array<float>} start - where to begin
 * @param {Array<float>} end - where to end
 * @param {Array<float>} mid - control point for quadratic bezier curve
 * @param {float} radius - radius of the midpoint text that we avoid
 * @param {string} edge_text - the text to display on the edge
 * @param {float} text_size - the size of the text
 */
function drawSplit(start, end, mid, radius, edge_text, text_size) {
  // alert(end);
  // alert(linalg.scale(t**2, end));
  // console.log(start);
  const iterations = 20;
  const ctx = get_canvas().getContext('2d');
  const estimated_pixels_of_text = edge_text.length * text_size * 0.6; 
  ctx.lineWidth = 0.1;
  for (let i = 0; i <= iterations; i++) {
    let t = i/iterations;
    let point = linalg.add(linalg.scale((1-t)**2, start), linalg.add(linalg.scale(2*(1-t)*t, mid), linalg.scale(t**2, end)));
    //alert(point);
    //if (linalg.vec_len(linalg.sub(point, mid)) > radius) 
    //if the x distance is less than estimated_pixels / 2 OR the y distance is less than radius, we dont draw
    if (Math.abs(point[0] - mid[0]) > estimated_pixels_of_text/2 || Math.abs(point[1] - mid[1]) > radius) {
      ctx.lineTo(...point);
      ctx.stroke();
    } else {
      ctx.moveTo(...point);
    }
  }
}


/**
 * checks if (x, y) wrt canvas is inside vertex v
 * @param {Object} graph - the graph of interest
 * @param {float} x - x position
 * @param {float} y - y position
 * @param {string} v - name of the vertex 
 * @returns {boolean} whether (x, y) is in v
 */
export function in_vertex(graph, x, y, v) {
  const vertex = graph[v];
  const diff = [x-vertex.x, y-vertex.y];
  return linalg.vec_len(diff) < vertex.r;
}

/**
 * detects if the current click is inside a vertex
 * @param {Object} graph - the graph of interest
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns {string} returns the first vertex in the graph that contains (x, y), null otherwise
 */
export function in_any_vertex(graph, x, y) {
  for (const v of Object.keys(graph)) {
    if (in_vertex(graph, x, y, v)) {
      return v;
    }
  }
  return null;
}

/**
 * detects if the current click is inside edge text
 * @param {Object} graph - the graph of interest
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns {Object} returns the first edge in the graph that contains (x, y), null otherwise
 */
export function in_edge_text(graph, x, y) {
  for (const vertex of Object.values(graph)) {
    for (const edge of vertex.out) {
      const [, , mid] = compute_edge_geometry(graph, edge);
      const diff = [x-mid[0], y-mid[1]];
      if (linalg.vec_len(diff) < consts.EDGE_TEXT_SACALING*vertex.r) {  // click within a certain radius
        return edge;
      }
    }
  }
  return null;
}

/**
 * computes the geometric start and end of the edge wrt canvas
 * @param {Object} graph - the graph containing the edge
 * @param {Object} edge - the edge we want to compute the start and end of
 * @returns {Array<Object>} [start, end], both 2d vectors
 */
export function compute_edge_start_end(graph, edge) {
  const {from, to} = edge;
  const s = graph[from], t = graph[to];
  let start, end;
  if (from === to) {
    const {angle1, angle2} = edge;  // additioanl attributes storing the start and end angle
    start = [s.x+s.r*Math.cos(angle1), s.y+s.r*Math.sin(angle1)];
    end = [t.x+t.r*Math.cos(angle2), t.y+t.r*Math.sin(angle2)];
  } else {
    const from_to = [t.x-s.x, t.y-s.y];
    const inner_vec = linalg.normalize(from_to, s.r);
    start = [s.x+inner_vec[0], s.y+inner_vec[1]];
    end = [t.x-inner_vec[0], t.y-inner_vec[1]];
  }
  return [start, end];
}

/**
 * computes the geometric start, end, and quadratic bezier curve control
 * @param {Object} graph - the graph containing the edge
 * @param {Object} edge - the edge we want to compute the start and end and mid of
 * @returns {Array<Object>} [start, end, mid], all 2d vectors
 */
export function compute_edge_geometry(graph, edge) {
  const {from, to, a1, a2} = edge;
  const s = graph[from];
  const [start, end] = compute_edge_start_end(graph, edge);
  // construct the two basis vectors
  const v1 = linalg.sub(end, start);
  let v2 = linalg.normalize(linalg.normal_vec(v1), s.r);
  let mid_vec = linalg.linear_comb(v1, v2, a1, a2);
  let mid = linalg.add(start, mid_vec);
  if (from === to && in_vertex(graph, ...mid, from)) {  // if edge falls inside the from vertex
    v2 = [-v2[0], -v2[1]];  // flip the second basis vector temporarily
    mid_vec = linalg.linear_comb(v1, v2, a1, a2);
    mid = [start[0]+mid_vec[0], start[1]+mid_vec[1]];
    edge.a2 = -edge.a2;  // also change the internal direction to make the flip permanent
  }
  return [start, end, mid];
}

/**
 * draws the edge object on the canvas
 * @param {Object} graph - the graph containing the edge
 * @param {Object} edge - the edge object you want to draw
 * @param {float} text_size - the font size of the transition label
 */
export function draw_edge(graph, edge, text_size) {
  let {transition, pop_symbol, push_symbol, move} = edge;
  const [start, end, mid] = compute_edge_geometry(graph, edge);
  let edge_text = transition;  // vanilla NFA only uses transition
  draw_arrow(start, end, mid, edge_text, text_size);
  
  if (menus.is_PDA()) {  // append pop and push if we have PDA
    edge_text += ','+pop_symbol+consts.ARROW_SYMBOL+push_symbol;
  } else if (menus.is_Turing()) {  // append push and left/right if we have turing
    edge_text += consts.ARROW_SYMBOL+push_symbol+','+move;
  }
  draw_text(edge_text, mid, text_size);
}

/* load the asset before it is drawn */
const normal_trash = new Image();
normal_trash.src = '../assets/icon-trash.svg';
const red_trash = new Image();
red_trash.src = '../assets/icon-hover-trash.svg';
let trash = normal_trash;
let trash_inited = false;

export function over_trash(e) {
  const [x, y] = event_position_on_canvas(e);
  const trash_dims = { X: 1830, Y: 740, Width: 50, Height: 50 };
  const [canvas_width, canvas_height] = canvas_size();
  if (
    x >= canvas_width - (trash.width + 30) &&
    x <= canvas_width - (trash.width + 30) + trash_dims.Width &&
    y >= canvas_height - (trash.height + 30) &&
    y <= canvas_height - (trash.width + 30) + trash_dims.Height
  ) {
    get_canvas().style.cursor = 'pointer';
    trash = red_trash;
    draw_trash();
    return true;
  } else {
    get_canvas().style.cursor = 'auto';
    trash = normal_trash;
    draw_trash();
    return false;
  }
}

export function draw_trash() {
  const canvas = get_canvas();
  const ctx = canvas.getContext('2d');
  const [canvas_width, canvas_height] = canvas_size();
  const x = canvas_width - (trash.width + 30);
  const y = canvas_height - (trash.height + 30);
  if (!trash_inited) {
    trash.onload = () => {
      ctx.drawImage(trash, x, y);
      canvas.addEventListener('mousemove', over_trash);  // constantly check if mouse is over trash
      trash_inited = true;
    }
  } else {
    ctx.drawImage(trash, x, y);
  }
}

/**
 * draw the entire graph on the canvas
 * @param {Object} graph - the graph object to draw on the canvas
 */
export function draw(graph) {
  const canvas = get_canvas();
  canvas.width = window.innerWidth*window.devicePixelRatio;
  canvas.height = window.innerHeight*window.devicePixelRatio;
  for (const vertex of Object.values(graph)) {
    draw_vertex(vertex);
    for (const edge of vertex.out) {
      draw_edge(graph, edge, consts.EDGE_TEXT_SACALING*vertex.r);
    }
  }
  draw_trash();
}

/**
 * Computes the total size taken by the graph drawing on the canvas
 * @param {Object} graph - target graph
 * @returns {Array<Array<float>>} - [[xmin, ymin], [xmax, ymax]] enclosing the graph
 */
function compute_machine_drawing_size(graph) {
  const canvas = get_canvas();
  let min_x = canvas.width, min_y = canvas.height, max_x = 0, max_y = 0;
  for (const vertex of Object.values(graph)) {
    min_x = Math.min(min_x, vertex.x-2*vertex.r);
    min_y = Math.min(min_y, vertex.y-2*vertex.r);
    max_x = Math.max(max_x, vertex.x+2*vertex.r);
    max_y = Math.max(max_y, vertex.y+2*vertex.r);
    for (const edge of vertex.out) {
      const [, , mid] = compute_edge_geometry(graph, edge);
      const pxl_per_letter = consts.PIXEL_PER_SIZE_1_LETTER*consts.EDGE_TEXT_SACALING*vertex.r;
      // 2 for delimiters btw transition and pop/push symbols
      const text_length = edge.transition.length + edge.push_symbol.length + edge.pop_symbol.length + 2;
      const text_pxls = text_length*pxl_per_letter;
      min_x = Math.min(min_x, mid[0]-text_pxls/2);
      min_y = Math.min(min_y, mid[1]-2*pxl_per_letter);
      max_x = Math.max(max_x, mid[0]+text_pxls/2);
      max_y = Math.max(max_y, mid[1]+2*pxl_per_letter);
    }
  }
  return [[min_x, min_y], [max_x, max_y]];
}

/** 
 * grab the current graph and download onto user's computer
 * @param {Object} graph - the graph object whose drawing is to be downloaded
 */
export function save_as_png(graph) {
  const [top_left, bottom_right] = compute_machine_drawing_size(graph);
  if (top_left[0] >= bottom_right[0] || top_left[1] >= bottom_right[1]) {
    alert('The graph is empty. Nothing to save.');
    return;
  }
  const width = bottom_right[0] - top_left[0], height = bottom_right[1] - top_left[1];
  const new_canvas = document.createElement('canvas');  // make a new canvas
  new_canvas.width = width, new_canvas.height = height;  // resize
  const new_ctx = new_canvas.getContext('2d');
  // copy the current canvas onto the new canvas
  new_ctx.drawImage(get_canvas(), top_left[0], top_left[1], width, height, 0, 0, width, height);
  const link = document.createElement('a');
  link.href = new_canvas.toDataURL('image/png');
  // GB date for sortability
  link.download = (new Date()).toLocaleString('en-GB').replace(' ', '')+'_machine.png';
  link.click();
}

/**
 * remove old highlited vertexes and mark current vertexes as highlited
 * @param {Object} graph 
 * @param {Iterable<string>} cur_states - vertex names
 */
export function highlight_states(graph, cur_states) {
  for (const vertex of Object.values(graph)) {  // eliminate all highlights
    vertex.highlighted = false;
  }
  for (const v of cur_states) {  // highlight only those we want to highlight
    graph[v].highlighted = true;
  }
  draw(graph);
}

/**
 * displays the input_str and highlight the character being processed at this step
 * @param {string} input_str - the machine input that is currently being run
 * @param {int} index - index of the input_str the machine is currently consuming
 */
export function viz_NFA_input(input_str, index) {
  const canvas = get_canvas();
  const pos = [canvas.width*consts.INPUT_VIZ_WIDTH_R, canvas.height*consts.INPUT_VIZ_HEIGHT_R];
  const color_map = [];
  for (let i = 0; i < input_str.length; ++i) {
    if (i < index) {
      color_map.push(consts.READ_INPUT_COLOR);
    } else if (i === index) {
      color_map.push(consts.CUR_INPUT_COLOR);
    } else {
      color_map.push(consts.DEFAULT_INPUT_COLOR);
    }
  }
  draw_text(input_str, pos, consts.DEFAULT_VIZ_SIZE, color_map);
}

/**
 * displays the relavant section of the Turing Machine tape as an overlay
 * @param {Map<int, string>} tape - tape contents indexed by position. Using map due to potentially neg index
 * @param {int} tape_idx - the current tape head position
 */
export function viz_TM_tape(tape, tape_idx) {
  const canvas = get_canvas();
  const pos = [canvas.width*consts.INPUT_VIZ_WIDTH_R, canvas.height*consts.INPUT_VIZ_HEIGHT_R];
  const color_map = [consts.DEFAULT_INPUT_COLOR];
  const tape_start = tape_idx-consts.TAPE_VIEW_RADIUS;
  const tape_end = tape_idx+consts.TAPE_VIEW_RADIUS;
  const tape_arr = [consts.TAPE_LEFT_ARROW];
  for (let i = tape_start; i <= tape_end; ++i) {
    if (i < tape_idx) {
      color_map.push(consts.DEFAULT_INPUT_COLOR);
    } else if (i === tape_idx) {
      color_map.push(consts.CUR_INPUT_COLOR);
    } else {
      color_map.push(consts.DEFAULT_INPUT_COLOR);
    }
    if (i in tape) {
      tape_arr.push(tape[i]);
    } else {
      tape_arr.push(consts.EMPTY_TAPE);
    }
  }
  color_map.push(consts.DEFAULT_INPUT_COLOR);
  tape_arr.push(consts.TAPE_RIGHT_ARROW);
  draw_text(tape_arr.join(''), pos, consts.DEFAULT_VIZ_SIZE, color_map);
}

/**
 * Displays each compute configuration near the vertex the non-deterministic branch is at
 * @param {Object} graph
 * @param {Map<string, Array<string>>} PDA_configs - set of PDA configurations. Using map to avoid duplicates
 *                                                   the key is the serialized configuration as a string
 */
export function viz_PDA_configs(graph, PDA_configs) {
  const vertex_to_info = new Map();  // map vertex name to the info to be displayed
  for (const [v, stack, remaining_input] of PDA_configs.values()) {
    const stack_str = stack.join('');
    const input_str = [...remaining_input].reverse().join('');  // remaining_input is in reverse order for speed
    const text = `${input_str};${stack_str}`;
    if (vertex_to_info.has(v)) {  // separate multiple configurations with a pipe
      vertex_to_info.set(v, `${vertex_to_info.get(v)}|${text}`);
    } else {
      vertex_to_info.set(v, text);
    }
  }
  for (const [v, text] of vertex_to_info.entries()) {
    const vertex = graph[v];
    const pos = [vertex.x+vertex.r, vertex.y+vertex.r];
    const color_map = new Array(text.length).fill(consts.PDA_CONF_COLOR);
    draw_text(text, pos, consts.DEFAULT_VIZ_SIZE, color_map);
  }
}
