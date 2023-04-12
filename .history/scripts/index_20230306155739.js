/** @module index */

import * as linalg from './linalg.js';
import * as consts from './consts.js';
import * as hist from './history.js';
import * as drawing from './drawing.js';
import * as compute from './compute.js';
import * as graph_ops from './graph_ops.js';
import * as menus from './menus.js';
import * as permalink from './permalink.js';

// if not in browser, don't run
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', () => drawing.draw(graph));
}

let graph = consts.EMPTY_GRAPH;  // global graph

/** handles double click */
function bind_double_click() {
  drawing.get_canvas().addEventListener('dblclick', e => {  // double click to create vertices
    if (e.movementX || e.movementY) {
      return;
    }  // shifted, don't create
    const [x, y] = drawing.event_position_on_canvas(e);
    const v = drawing.in_any_vertex(graph, x, y);
    if (v) {
      graph_ops.toggle_final(graph, v);
    } else {
      // use the default radius if there is no vertex for reference
      const radius = (Object.keys(graph).length) ? Object.values(graph)[0].r : consts.DEFAULT_VERTEX_RADIUS;
      graph_ops.create_vertex(graph, x, y, radius);
    }
  });
}

/**
 * shift the entire graph by dx and dy
 * @param {Object} e - mousemove event
 */
function drag_scene(e) {
  const dx = e.movementX, dy = e.movementY;
  for (const vertex of Object.values(graph)) {
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
    if (moved) {
      hist.push_history(graph);
    }
  }, { once:true });  // save once only

  return e => {
    [vertex.x, vertex.y] = drawing.event_position_on_canvas(e);
    drawing.draw(graph);
    moved = true;
  };
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
    const [x, y] = drawing.event_position_on_canvas(e);
    const cur_v = drawing.in_any_vertex(graph, x, y);
    const cur_vertex = graph[cur_v];
    restore();
    if (cur_v && has_left_before) {
      angle2 = Math.atan2(y-cur_vertex.y, x-cur_vertex.x);
      graph_ops.create_edge(graph, v, cur_v, angle1, angle2);  // snap to the other vertex
    }
  }, { once:true });  // snap once only

  return e => {
    const [x, y] = drawing.event_position_on_canvas(e);
    if (drawing.in_any_vertex(graph, x, y) === v) {
      return;
    }  // haven't left the vertex yet
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
    if (moved) {
      hist.push_history(graph);
    }
  }, { once:true });  // save once only

  return e => {
    const mouse_pos = drawing.event_position_on_canvas(e);
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

/** binds callback functions to the mouse dragging behavior */
function bind_drag() {
  let mutex = false;  // drag lock not activiated
  // declare the callbacks as empty function so that intellisense recognizes them as function
  let edge_animation = consts.EMPTY_FUNCTION, drag_edge = consts.EMPTY_FUNCTION, drag_vertex = consts.EMPTY_FUNCTION;
  const canvas = drawing.get_canvas();
  canvas.addEventListener('mousedown', e => {
    if (mutex) {
      return;
    }  // something has already bind the mouse drag event
    mutex = true;  // lock
    const [x, y] = drawing.event_position_on_canvas(e);
    const clicked_vertex = drawing.in_any_vertex(graph, x, y);
    const clicked_edge = drawing.in_edge_text(graph, x, y);
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

/** replaces the default context menu */
function bind_context_menu() {
  const canvas = drawing.get_canvas();
  let last_time_mouse_press = 0;
  document.addEventListener('contextmenu', e => e.preventDefault());  // stop contextmenu from showing
  canvas.addEventListener('mousedown', e => {
    menus.remove_context_menu();  // remove old menu
    if (e.button === consts.RIGHT_BTN) {
      last_time_mouse_press = e.timeStamp;
    }
  });
  canvas.addEventListener('mouseup', e => {
    if (e.timeStamp - last_time_mouse_press > consts.CLICK_HOLD_TIME) {
      return;
    }  // hack
    const [x, y] = drawing.event_position_on_canvas(e);
    const v = drawing.in_any_vertex(graph, x, y);
    const edge = drawing.in_edge_text(graph, x, y);
    if (v) {
      menus.display_vertex_menu(graph, v, e.clientX, e.clientY);
    } else if (edge) {
      menus.display_edge_menu(graph, edge, e.clientX, e.clientY);
    }
  });
}

/** binds each machine input to the run_input function */
function bind_run_input() {
  const input_divs = document.getElementsByClassName('machine_input');
  const computations = Array(input_divs.length);  // stores generators of the computation half evaluated
  for (let i = 0; i < input_divs.length; i++) {
    const textbox = input_divs[i].querySelector('input');
    
    const run_btn = input_divs[i].querySelector('.run_btn');
    run_btn.addEventListener('click', () => {
      computations[i] = compute.run_input(graph, menus.machine_type(), textbox.value);  // noninteractive computation
      const { value, _ } = computations[i].next();  // second value is always true since it is noninteractive
      if(value) {
        alert(value);
      }
      computations[i] = undefined;
    });
    
    const step_btn = input_divs[i].querySelector('.step_btn');
    step_btn.addEventListener('click', () => {
      if (!computations[i]) {
        computations[i] = compute.run_input(graph, menus.machine_type(), textbox.value, true);  // true for interactive
      }
      const { value, done } = computations[i].next();
      if (done) {
        // whether true or false. We wrap this in timeout to execute after the vertex coloring is done
        setTimeout(() => {
          if(value) {
            alert(value);
          }
        });
        computations[i] = undefined;
      }
    });

    const reset_btn = input_divs[i].querySelector('.reset_btn');
    reset_btn.addEventListener('click', () => {
      computations[i] = undefined;
      drawing.highlight_states(graph, []);  // clear the highlighting
    });
  }
  // clear the partial computations when user switches machines
  document.getElementById('select_machine').addEventListener('change', () => computations.fill(undefined));
}

/** offers ctrl-z and ctrl-shift-z features */
function bind_undo_redo() {
  document.addEventListener('keydown', e => {
    if (e.code !== 'KeyZ' || e.metaKey || e.altKey) {
      return;
    }
    e.preventDefault();  // prevent input undo
    if (e.ctrlKey && e.shiftKey) {
      graph = hist.redo(); 
    } else if (e.ctrlKey) {
      graph = hist.undo(); 
    }
    drawing.draw(graph);
  });
}

/** zooming in and out */
function bind_scroll() {
  drawing.get_canvas().addEventListener('wheel', e => {
    e.preventDefault();  // prevent browser scrolling or zooming
    const [x, y] = drawing.event_position_on_canvas(e);
    const zoom_const = 1 - consts.ZOOM_SPEED*e.deltaY;
    for (const vertex of Object.values(graph)) {
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
      if (e.timeStamp-last_time < consts.DOUBLE_PRESS_TIME) {
        callback();
        last_time = 0;  // prevent triple click
      } else {
        last_time = e.timeStamp;
      }
    }
  });
}

/** press dd does delete */
function bind_dd() {
  on_double_press('KeyD', () => {
    if (!Object.keys(graph).length) {  // nothing to delete
      return;
    }
    graph = consts.EMPTY_GRAPH;
    drawing.draw(graph);
    hist.push_history(graph);
  });
}

function hash_change_handler() {
  if (window.location.hash.length > 1) {
    const graph_str = window.location.hash.slice(1);
    const select = document.getElementById('select_machine');
    if (permalink.serialize(select.value, graph) === graph_str) {
      // debounce two types of events
      // 1. the permalink generation will trigger a hash change event, which we do not want to handle
      // 2. the user might have inputed the same graph string, so we prevent duplicate history by not hanlding
      return;
    }

    let type;
    [type, graph] = permalink.deserialize(graph_str);
    select.value = type;
    hist.set_history_keys(type);  // set the history keys to the correct machine type
    hist.push_history(graph);     // save the graph to history
    menus.display_UI_for(type);   // change the UI elements manually
    refresh_graph();              // draw the graph
  }
}

/** draw the first graph (possibly by deserializing the permalink) */
function init_graph() {
  hash_change_handler();
  refresh_graph();
}

/** get the newest graph from history and draw it */
function refresh_graph() {
  graph = hist.retrieve_latest_graph();
  drawing.draw(graph);
}

/** handle switching machine type event */
function bind_switch_machine() {
  const select = document.getElementById('select_machine');
  select.value = consts.DEFAULT_MACHINE;  // set to default machine here too
  select.addEventListener('change', e => {
    hist.set_history_keys(e.target.value);
    refresh_graph();  // switching graph
    menus.display_UI_for(e.target.value);
    history.replaceState(undefined, undefined, '#');  // clear the permalink
  });
}

/** handles the NFA to DFA button */
function bind_machine_transform() {
  const NFA_2_DFA_btn = document.getElementById('NFA_2_DFA');
  NFA_2_DFA_btn.addEventListener('click', () => {
    graph = graph_ops.NFA_to_DFA(graph);
    drawing.draw(graph);
    hist.push_history(graph);
  });
}

/** hook up the save button */
function bind_save_drawing() {
  const save_btn = document.getElementById('save_machine');
  save_btn.addEventListener('click', () => drawing.save_as_png(graph));
}

/** dynamically change the length of textboxes */
export function bind_elongate_textbox() {
  const change_width_func = e => {  // minimum width of 4ch
    e.target.style.width = `${Math.max(4, e.target.value.length)}ch`;
  };
  document.querySelectorAll('input[type=text]').forEach(textbox => {
    textbox.addEventListener('input', change_width_func);
  });
}

/** button to generate permanent link */
function bind_permalink() {
  const permalink_btn = document.getElementById('permalink');
  permalink_btn.addEventListener('click', () => {
    const select = document.getElementById('select_machine');
    const graph_str = permalink.serialize(select.value, graph);
    history.replaceState(undefined, undefined, '#'+graph_str);
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Permalink copied to clipboard!'));
  });
  window.addEventListener('hashchange', hash_change_handler);
}

/** run after all the contents are loaded to hook up callbacks */
function init() {
  bind_switch_machine();
  bind_double_click();
  bind_drag();
  bind_context_menu();
  bind_run_input();
  bind_machine_transform();
  bind_save_drawing();
  bind_undo_redo();
  bind_scroll();
  bind_dd();
  bind_elongate_textbox();
  bind_permalink();
  init_graph();  // leave this last since we want it to override some of the above
}