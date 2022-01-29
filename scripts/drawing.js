/** @module drawing */

import * as linalg from './linalg.js';
import * as consts from './consts.js';

/**
 * get the machine drawing canvas
 * @returns the canvas object on which the machine is drawn
 */
export function get_canvas() {
  return document.getElementById('machine_drawing');
}

/**
 * draw text on the canvas
 * @param {string} text - the text you want to draw on the screen
 * @param {Array<float>} pos - the position wrt canvas
 * @param {float} size - font size
 */
export function draw_text(text, pos, size) {
  const ctx = get_canvas().getContext('2d');
  ctx.font = `${size}px Sans-Serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, ...pos);
}

/**
 * draw a circle on the current canvas
 * @param {int} x - x position from left wrt canvas
 * @param {int} y - y position from top wrt canvas
 * @param {int} r - radius of the circle
 * @param {float} thickness - line width
 */
export function draw_cricle(x, y, r, thickness=1) {
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.lineWidth = Math.round(thickness);
  ctx.stroke();
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
  draw_cricle(vertex.x, vertex.y, vertex.r);
  // draw the text inside
  draw_text(vertex.name, [vertex.x, vertex.y], vertex.r);
  if (vertex.is_start) {  // it is the starting vertex
    const tip1 = [vertex.x-vertex.r, vertex.y],
      tip2 = linalg.sub(tip1, linalg.scale(consts.START_TRIANGLE_SCALE, [vertex.r, vertex.r])),
      tip3 = linalg.sub(tip1, linalg.scale(consts.START_TRIANGLE_SCALE, [vertex.r, -vertex.r]));
    draw_triangle(tip1, tip2, tip3);
  }
  if (vertex.is_final) {draw_final_circle(vertex);}
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
 */
export function draw_arrow(start, end, mid) {
  if (!mid) {mid = linalg.scale(1/2, linalg.add(start, end));}  // find mid if DNE
  const start_to_mid = linalg.sub(mid, start), mid_to_end = linalg.sub(end, mid), start_to_end = linalg.sub(end, start);
  const v1_on_v2 = linalg.proj(start_to_mid, start_to_end);
  const ortho_comp = linalg.scale(consts.EDGE_CURVATURE, linalg.sub(start_to_mid, v1_on_v2));
  const ctx = get_canvas().getContext('2d');
  ctx.beginPath();
  ctx.moveTo(...start);
  // we boost the curve by the orthogonal component of v1 wrt v2
  ctx.quadraticCurveTo(...linalg.add(mid, ortho_comp), ...end);
  ctx.stroke();
  const arrow_tip = linalg.normalize(linalg.sub(mid_to_end, ortho_comp), consts.ARROW_LENGTH);  
  const normal_to_tip = linalg.normalize(linalg.normal_vec(arrow_tip), consts.ARROW_WIDTH/2);  // half the total width
  const tip1 = end,
    tip2 = linalg.add(linalg.sub(end, arrow_tip), normal_to_tip),
    tip3 = linalg.sub(linalg.sub(end, arrow_tip), normal_to_tip);
  draw_triangle(tip1, tip2, tip3);
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
  if (from === to && in_vertex(...mid, from)) {  // if edge falls inside the from vertex
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
  const {transition} = edge;
  const [start, end, mid] = compute_edge_geometry(graph, edge);
  draw_arrow(start, end, mid);
  draw_text(transition, mid, text_size);
}

/**
 * draw the entire canvas based on the graph
 * @param {Object} graph - the graph object to draw on the canvas
 */
export function draw(graph) {
  const canvas = get_canvas();
  canvas.width = window.innerWidth*window.devicePixelRatio;
  canvas.height = window.innerHeight*window.devicePixelRatio;
  for (let vertex of Object.values(graph)) {
    draw_vertex(vertex);
    for (let edge of vertex.out) {draw_edge(graph, edge, vertex.r);}
  }
}
