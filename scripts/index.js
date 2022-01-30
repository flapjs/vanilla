/** @module index */

import * as linalg from './linalg.js';
import * as consts from './consts.js';
import * as hist from './history.js';
import * as drawing from './drawing.js';
import * as compute from './compute.js';

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', () => drawing.draw(graph));

// this is the graph
let graph = consts.EMPTY_GRAPH;

/**
 * go through the list of used names for a vertex and find the smallest unused
 * @returns the smallest unused name for a vertex
 */
function find_unused_name() {
  const prefix = 'q';  // using standard notation
  let i;
  for (i = 0; i <= Object.keys(graph).length; i++) {  // we don't need to look further than how many elements in the set
    if (!(prefix+`${i}` in graph)) {break;}
  }
  return prefix+`${i}`;
}

/**
 * create a vertex at the place the user has clicked
 * @param {float} x - x position of the user mouse click wrt canvas
 * @param {float} y - y position of the user mouse click wrt canvas
 * @param {float} radius - the radius of the graphical element
 */
function create_vertex(x, y, radius) {
  const name = find_unused_name();
  const vertex = {
    name: name,
    x: x,
    y: y,
    r: radius,
    is_start: Object.keys(graph).length === 0,
    is_final: false,
    out: [],
  };
  graph[name] = vertex;  // add to the list
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * get the position of the mouseclick event wrt canvas
 * @param {Object} e 
 * @returns {Array<float>} x and y position of the mouseclick wrt canvas
 */
function get_position(e) {
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left)*window.devicePixelRatio;
  const y = (e.clientY - rect.top)*window.devicePixelRatio;
  return [x, y];
}

/**
 * mark a vertex as start
 * @param {string} v - name of the vertex
 */
function set_start(v) {
  for (let vertex of Object.values(graph)) {vertex.is_start = false;}
  graph[v].is_start = true;
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * toggle whether a vertex is accept
 * @param {string} v - name of the vertex
 */
function toggle_final(v) {
  const vertex = graph[v];
  vertex.is_final = !vertex.is_final;
  if (vertex.is_final) {drawing.draw_final_circle(vertex);}  // adding a circle
  else {drawing.draw(graph);}  // removing the circle, requires drawing
  hist.push_history(graph);
}

/**
 * binds double click behavior
 */
function bind_double_click() {
  drawing.get_canvas().addEventListener('dblclick', e => {  // double click to create vertices
    if (e.movementX || e.movementY) {return;}  // shifted, don't create
    const [x, y] = get_position(e);
    const v = in_any_vertex(x, y);
    if (v) {toggle_final(v);}
    else {create_vertex(x, y, (Object.keys(graph).length) ? Object.values(graph)[0].r : consts.DEFAULT_VERTEX_RADIUS);}
  });
}

/**
 * checks if (x, y) wrt canvas is inside vertex v
 * @param {float} x - x position
 * @param {float} y - y position
 * @param {string} v - name of the vertex 
 * @returns {boolean} whether (x, y) is in v
 */
function in_vertex(x, y, v) {
  const vertex = graph[v];
  const diff = [x-vertex.x, y-vertex.y];
  return linalg.vec_len(diff) < vertex.r;
}

/**
 * detects if the current click is inside a vertex
 * @param {float} x - x position wrt canvas 
 * @param {float} y - y position wrt canvas
 * @returns {string} returns the first vertex in the graph that contains (x, y), null otherwise
 */
function in_any_vertex(x, y) {
  for (let v of Object.keys(graph)) {
    if (in_vertex(x, y, v)) {return v;}
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
  for (let vertex of Object.values(graph)) {
    for (let edge of vertex.out) {
      const [, , mid] = drawing.compute_edge_geometry(graph, edge);
      const diff = [x-mid[0], y-mid[1]];
      if (linalg.vec_len(diff) < vertex.r/2) {return edge;}
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
  for (let vertex of Object.values(graph)) {
    vertex.x += dx;
    vertex.y += dy;
  }
  drawing.draw(graph);
}

/**
 * builds a drag vertex callback function
 * @param {string} v - name of the vertex to be dragged 
 * @returns {function} a callback function to handle dragging a vertex
 */
function higher_order_drag_vertex(v) {
  const vertex = graph[v];
  let moved = false;
  drawing.get_canvas().addEventListener('mouseup', () => {  // additional event listener to hist.push_history
    if (moved) {hist.push_history(graph);}
  }, { once:true });  // save once only

  return e => {
    [vertex.x, vertex.y] = get_position(e);
    drawing.draw(graph);
    moved = true;
  };
}

/**
 * creates an edge between two vertices and draw it on the screen
 * @param {string} u - from vertex
 * @param {string} v - to vertex
 * @param {float} angle1 - the angle which the cursor left the from vertex
 * @param {float} angle2 - the angle which the cursor entered the to vertex
 * @param {string} pop_symbol - the symbol to pop on top of the stack
 * @param {string} push_symbol - the symbol to push on top of the stack
 */
function create_edge(u, v, angle1, angle2) {
  const transition = prompt('Please input the transition', consts.EMPTY_TRANSITION);
  let pop_symbol = prompt('Please input the pop symbol', consts.EMPTY_SYMBOL);
  let push_symbol = prompt('Please input the push symbol', consts.EMPTY_SYMBOL);
  if (!transition) {return;}  // can't have null transition
  else if (!pop_symbol) {pop_symbol = null;}
  else if (!push_symbol) {push_symbol = null;}
  const vertex = graph[u];
  for (let existing_edge of vertex.out) {
    if (existing_edge.to === v && existing_edge.transition === transition) {return;}  // already has it
  }
  // now we add the edge to the graph and draw it
  let edge;
  if (u !== v) {  // easy case since start and end are different
    const a1 = 0.5, a2 = 0;  // right in the center
    edge = { transition: transition, from: u, to: v, a1: a1, a2: a2,
             pop_symbol: pop_symbol, push_symbol: push_symbol };
  } else {  // self loop
    const a1 = 0.5, a2 = 1;
    edge = { transition: transition, from: u, to: v, a1: a1, a2: a2, angle1: angle1, angle2: angle2,
             pop_symbol: pop_symbol, push_symbol: push_symbol };
  }
  vertex.out.push(edge);
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * creates a callback function to handle edge creation animation
 * @param {string} v - the vertex from which the edge is stemmed from
 * @returns {function} a function that handles drawing an edge from v on mousedrag
 */
function higher_order_edge_animation(v) {
  const vertex = graph[v];  // convert name of vertex to actual vertex
  const canvas = drawing.get_canvas();
  const ctx = canvas.getContext('2d');
  const cached_canvas = canvas.cloneNode();
  cached_canvas.getContext('2d').drawImage(canvas, 0, 0);  // save the original image
  const restore = () => {  // helper to restore to the orignal canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // clear
    ctx.drawImage(cached_canvas, 0, 0);  // restore
  };
  let has_left_before = false;
  let angle1, angle2;

  canvas.addEventListener('mouseup', e => {  // additional event listener to restore canvas and snap to vertex
    const [x, y] = get_position(e);
    const cur_v = in_any_vertex(x, y);
    const cur_vertex = graph[cur_v];
    restore();
    if (cur_v && has_left_before) {
      angle2 = Math.atan2(y-cur_vertex.y, x-cur_vertex.x);
      create_edge(v, cur_v, angle1, angle2);  // snap to the other vertex
    }
  }, { once:true });  // snap once only

  return e => {
    const [x, y] = get_position(e);
    if (in_any_vertex(x, y) === v) {return;}  // haven't left the vertex yet
    // now we are away from the vertex
    if (!has_left_before) {
      has_left_before = true;
      angle1 = Math.atan2(y-vertex.y, x-vertex.x);
    }
    restore();
    const [truncate_x, truncate_y] = linalg.normalize([x-vertex.x, y-vertex.y], vertex.r);
    drawing.draw_arrow([vertex.x+truncate_x, vertex.y+truncate_y], [x, y]);
  };
}

/**
 * creates a callback function that handles dragging an edge
 * @param {Object} edge - the edge you are dragging
 * @returns {function} a callback function that handles dragging an edge
 */
function higher_order_drag_edge(edge) {
  const s = graph[edge.from];
  let moved = false;
  drawing.get_canvas().addEventListener('mouseup', () => {  // additional event listener to hist.push_history
    if (moved) {hist.push_history(graph);}
  }, { once:true });  // save once only

  return e => {
    const mouse_pos = get_position(e);
    const [start, end] = drawing.compute_edge_start_end(graph, edge);
    const mid = linalg.sub(mouse_pos, start);
    const v1 = linalg.sub(end, start);
    const v2 = linalg.normalize(linalg.normal_vec(v1), s.r);  // basis
    const [inv_v1, inv_v2] = linalg.inv(v1, v2);
    [edge.a1, edge.a2] = linalg.linear_comb(inv_v1, inv_v2, ...mid);  // matrix vector product
    drawing.draw(graph);
    moved = true;
  };
}

/**
 * binds callback functions to the mouse dragging behavior
 */
function bind_drag() {
  let mutex = false;  // drag lock not activiated
  // declare the callbacks as empty function so that intellisense recognizes them as function
  let edge_animation = consts.EMPTY_FUNCTION, drag_edge = consts.EMPTY_FUNCTION, drag_vertex = consts.EMPTY_FUNCTION;
  const canvas = drawing.get_canvas();
  canvas.addEventListener('mousedown', e => {
    if (mutex) {return;}  // something has already bind the mouse drag event
    mutex = true;  // lock
    const [x, y] = get_position(e);
    const clicked_vertex = in_any_vertex(x, y);
    const clicked_edge = in_edge_text(x, y);
    if ((e.button === consts.RIGHT_BTN || e.ctrlKey) && clicked_vertex) {  // right create edge
      edge_animation = higher_order_edge_animation(clicked_vertex);
      canvas.addEventListener('mousemove', edge_animation);
    } else if (e.button === consts.LEFT_BTN) {  // left drag
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
    mutex = false;  // release the resource
  });
}

/**
 * deletes a vertex by its name as well as its associated edges
 * @param {string} v - the vertex you want to delete
 */
function delete_vertex(v) {
  remove_context_menu();
  delete graph[v];  // remove this vertex
  for (let vertex of Object.values(graph)) {
    for (let [i, edge] of vertex.out.entries()) {
      if (edge.to === v) {vertex.out.splice(i, 1);}  // remove all edges leading to it
    }
  }
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * renames the vertex with the new name, if name exists, nothing will be changed and user will be prompted
 * @param {string} v - the vertex to rename
 * @param {*} new_name - new name of the vertex
 */
function rename_vertex(v, new_name) {
  remove_context_menu();
  if (v === new_name) {return;}  // nothing to do
  else if (new_name in graph) {alert(new_name + ' already exists');}
  else {
    graph[new_name] = graph[v];  // duplicate
    delete graph[v];  // remove old
    for (let vertex of Object.values(graph)) {
      for (let edge of vertex.out) {
        if (edge.from === v) {edge.from = new_name;}
        if (edge.to === v) {edge.to = new_name;}
      }
    }
  }
  drawing.draw(graph);
  hist.push_history(graph);
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
  delete_div.addEventListener('click', () => delete_vertex(v));
  container.appendChild(rename_div);
  container.appendChild(buttons_div);
  container.appendChild(delete_div);
  const rename = document.createElement('input');
  rename.value = v;  // prepopulate vertex name
  rename.addEventListener('keyup', e => {
    if (e.key === 'Enter') {rename_vertex(v, rename.value);}
  });
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

/**
 * delete an edge of the graph and draw
 * @param {Object} edge the edge we want to get rid of
 */
function delete_edge(edge) {
  remove_context_menu();
  for (let vertex of Object.values(graph)) {
    for (let [i, e] of vertex.out.entries()) {
      if (e.from === edge.from && e.to === edge.to && e.transition === edge.transition) {
        vertex.out.splice(i, 1);
        break;
      }
    }
  }
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * rename the transition of an edge
 * @param {Object} edge the edge object of which we want to rename the transition
 * @param {string} new_transition - new transition symbol
 */
function rename_edge(edge, new_transition) {
  remove_context_menu();
  edge.transition = new_transition;
  drawing.draw(graph);
  hist.push_history(graph);
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
  delete_div.addEventListener('click', () => delete_edge(edge));
  container.appendChild(rename_div);
  container.appendChild(delete_div);
  const rename = document.createElement('input');
  rename.value = edge.transition;  // prepopulate
  rename.addEventListener('keyup', e => {
    if (e.key === 'Enter') {rename_edge(edge, rename.value);}
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
  if (!menu) {return;}
  document.querySelector('body').removeChild(menu);
}

/**
 * replaces the default context menu
 */
function bind_context_menu() {
  const canvas = drawing.get_canvas();
  let last_time_mouse_press;
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();  // stop the context from showing
    remove_context_menu();  // remove old
    if (e.timeStamp - last_time_mouse_press > consts.CLICK_HOLD_TIME) {return;}  // hack
    const [x, y] = get_position(e);
    const v = in_any_vertex(x, y);
    const edge = in_edge_text(x, y);
    if (v) {display_vertex_menu(v, e.clientX, e.clientY);}
    else if (edge) {display_edge_menu(edge, e.clientX, e.clientY);}
  });
  canvas.addEventListener('mousedown', e => {
    if (e.button === consts.LEFT_BTN) {remove_context_menu();}
    else if (e.button === consts.RIGHT_BTN) {last_time_mouse_press = e.timeStamp;}
  });
}

/**
 * binds each machine input to the run_input function
 */
function bind_run_input() {
  const input_divs = document.getElementsByClassName('machine_input');
  for (let i = 0; i < input_divs.length; i++) {
    const textbox = input_divs[i].querySelector('input');
    const run_btn = input_divs[i].querySelector('button');
    run_btn.addEventListener('click', () => alert(compute.run_input(textbox.value)));
  }
}

/**
 * offers ctrl-z and ctrl-shift-z features
 */
function bind_undo_redo() {
  document.addEventListener('keypress', e => {
    if (e.code !== 'KeyZ' || e.metaKey || e.altKey) {return;}
    if (e.ctrlKey && e.shiftKey) { graph = hist.redo(); }
    else if (e.ctrlKey) { graph = hist.undo(); }
    drawing.draw(graph);
  });
}

/**
 * zooming in and out
 */
function bind_scroll() {
  drawing.get_canvas().addEventListener('wheel', e => {
    e.preventDefault();  // prevent browser scrolling or zooming
    const [x, y] = get_position(e);
    const zoom_const = 1 - consts.ZOOM_SPEED*e.deltaY;
    for (let vertex of Object.values(graph)) {
      vertex.x = x + zoom_const*(vertex.x-x);
      vertex.y = y + zoom_const*(vertex.y-y);
      vertex.r *= zoom_const;
    }
    drawing.draw(graph);
  });
}

/**
 * helper function to abstract away double clicking
 * @param {string} key - ex. KeyZ, KeyA
 * @param {Function} callback - a function to be called when double click happens
 */
function on_double_press(key, callback) {
  let last_time = 0;
  document.addEventListener('keypress', e => {
    if (e.code === key) {
      if (e.timeStamp-last_time < consts.DOUBLE_CLICK_TIME) {
        callback();
        last_time = 0;  // prevent triple click
      } else {
        last_time = e.timeStamp;
      }
    }
  });
}

/**
 * press dd does delete
 */
function bind_dd() {
  on_double_press('KeyD', () => {
    if (!Object.keys(graph).length) return;  // nothing to delete
    graph = EMPTY_GRAPH;
    drawing.draw(graph);
    hist.push_history(graph);
  });
}

/**
 * get the lastest graph from localstore and display
 */
function init_graph() {
  graph = hist.retrieve_latest_graph();
  drawing.draw(graph);
}

/**
 * run after all the contents are loaded
 */
function init() {
  init_graph();
  bind_double_click();
  bind_drag();
  bind_context_menu();
  bind_run_input();
  bind_undo_redo();
  bind_scroll();
  bind_dd();
}
