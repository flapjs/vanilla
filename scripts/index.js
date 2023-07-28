/** @module index */

import * as linalg from './linalg.js';
import * as consts from './consts.js';
import * as hist from './history.js';
import * as drawing from './drawing.js';
import * as compute from './compute.js';
import * as graph_ops from './graph_ops.js';
import * as menus from './menus.js';
import * as permalink from './permalink.js';
// import * as home from './home.js';

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

/** binds callback functions to the mouse dragging behavior and deletes if event is dropped over trash*/
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
        trash_color();  // change color if edge is over trash
      } else if (clicked_vertex) {  // vertex has lower priority than edge
        drag_vertex = higher_order_drag_vertex(clicked_vertex);  // create the function
        canvas.addEventListener('mousemove', drag_vertex);
        trash_color();  // change color if vertex is over trash
      } else {  // left drag scene
        canvas.addEventListener('mousemove', drag_scene);
      } 
    }
  });
  canvas.addEventListener('mouseup', e => {
    const [x, y] = drawing.event_position_on_canvas(e);
    const drop_vertex = drawing.in_any_vertex(graph, x, y);
    const drop_edge = drawing.in_edge_text(graph, x, y);
    if (drop_vertex && drawing.over_trash(e)) { // if we release a vertex over the trash
      graph_ops.delete_vertex(graph, drop_vertex);
    }
    else if (drop_edge && drawing.over_trash(e)) { // if we release an edge over the trash
      graph_ops.delete_edge(graph, drop_edge);
    }
    else { // not dropped over trash can and release drag
      canvas.removeEventListener('mousemove', drag_scene);
      canvas.removeEventListener('mousemove', drag_vertex);
      canvas.removeEventListener('mousemove', drag_edge);
      canvas.removeEventListener('mousemove', edge_animation);
      mutex = false;  // release the resource
    }
  });
}

function trash_color() {
  const canvas = drawing.get_canvas();
  canvas.addEventListener('mousemove', e => {
    if (drawing.over_trash(e)) {
      drawing.recolor_trash(true);
    }
    else {
      drawing.recolor_trash(false);
    }
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

/** binds the run button to the run function */
function bind_plus_minus() {
  const plus_button = document.getElementById('plus_button');
  const minus_button = document.getElementById('minus_button');

  plus_button.addEventListener('click', () => {
    const machine_inputs = document.querySelector('.machine_inputs');
    //first, check if there is a hidden machine input
    for (let i = 0; i < machine_inputs.children.length; i++) {
      if (machine_inputs.children.item(i).classList.contains('machine_input') && machine_inputs.children.item(i).hidden) {
        machine_inputs.children.item(i).hidden = false;
        return;
      }
    }
    // create a new machine input
    add_input_bar();
    bind_run_input();
  });

  // event listener for minus button
  minus_button.addEventListener('click', () => {
    // remove the last machine input
    const machine_inputs = document.querySelector('.machine_inputs');
    //iterate backwards through machine inputs, hide the first one that is not hidden
    for (let i = machine_inputs.children.length - 1; i >= 0; i--) {
      if (machine_inputs.children.item(i).classList.contains('machine_input') && !machine_inputs.children.item(i).hidden) {
        machine_inputs.children.item(i).hidden = true;
        break;
      }
    }
  });
}

/** Generates a new input bar using the DOM
 * I tried using HTML to generate the first one
 * but ran into inconsistent spacing issue I couldn't figure out,
 * so this will be used to generate all for consistency's sake
 */
function add_input_bar(){
  const machine_inputs = document.querySelector('.machine_inputs');
  const new_machine_input = document.createElement('div');
  new_machine_input.classList.add('machine_input');

  // create a new textarea box
  const new_textarea = document.createElement('textarea');
  new_textarea.classList.add("machineInput");
  // create a new run button under the original one
  const new_run_button = document.createElement('button');
  new_run_button.classList.add('run_btn');
  new_run_button.innerHTML = 'R';

  // create a new step button
  const new_step_button = document.createElement('button');
  new_step_button.classList.add('step_btn');
  new_step_button.innerHTML = 'S';

  // create a new reset button
  const new_reset_button = document.createElement('button');
  new_reset_button.classList.add('reset_btn');
  new_reset_button.innerHTML = 'X';

  new_machine_input.appendChild(new_textarea);
  new_machine_input.appendChild(new_run_button);
  new_machine_input.appendChild(new_step_button);
  new_machine_input.appendChild(new_reset_button);

  // append the new button to the body
  machine_inputs.appendChild(new_machine_input);
}

/** binds each machine input to the run_input function */
function bind_run_input() {
  const input_divs = document.getElementsByClassName('machine_input');
  const computations = Array(input_divs.length);  // stores generators of the computation half evaluated
  for (let i = 0; i < input_divs.length; i++) {
    const textbox = input_divs[i].querySelector('.machineInput');
    
    const run_btn = input_divs[i].querySelector('.run_btn');
    run_btn.addEventListener('click', () => {
      input_divs[i].style.backgroundColor = consts.SECOND_BAR_COLOR;
      computations[i] = compute.run_input(graph, menus.machine_type(), textbox.value);  // noninteractive computation
      // eslint-disable-next-line no-unused-vars
      const { value: accepted, _ } = computations[i].next();  // second value is always true since it is noninteractive
      // alert(accepted ? 'Accepted' : 'Rejected');
      input_divs[i].style.backgroundColor = accepted ? consts.ACCEPT_COLOR : consts.REJECT_COLOR;
      computations[i] = undefined;
    });
    
    const step_btn = input_divs[i].querySelector('.step_btn');
    step_btn.addEventListener('click', () => {
      input_divs[i].style.backgroundColor = consts.SECOND_BAR_COLOR;
      if (!computations[i]) {
        computations[i] = compute.run_input(graph, menus.machine_type(), textbox.value, true);  // true for interactive
      }
      const { value: accepted, done } = computations[i].next();
      if (done) {
        // whether true or false. We wrap this in timeout to execute after the vertex coloring is done
        setTimeout(() => input_divs[i].style.backgroundColor = accepted ? consts.ACCEPT_COLOR : consts.REJECT_COLOR);
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
  document.getElementById('dropdown-content').addEventListener('change', () => computations.fill(undefined));
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
    const select = document.getElementById('dropdown-content');
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
  const select = document.getElementById('dropdown-content');
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
  const NFA_2_DFA_btn = document.getElementById('NFA_to_DFA');
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

  // /** dynamically change the height of textbox */
  // const resizeTextArea = textarea => {
  //   const { style, value } = textarea;

  //   // The 4 corresponds to the 2 2px borders (top and bottom):
  //   // style.height = style.minHeight = 'auto';
  //   // style.minHeight = `${ Math.min(textarea.scrollHeight + 4, parseInt(textarea.style.maxHeight)) }px`;
  //   // style.height = `${ textarea.scrollHeight + 4 }px`;
  //   // style.maxHeight = `100px`

  // }

  // const textarea = document.getElementById('machineInput');

  // textarea.addEventListener('input', () => {
  //   resizeTextArea(textarea);
  // }); /* dynamically change the height of textbox */
}




// const textarea = document.getElementById('machineInput');

// textarea.addEventListener('input', () => {
//   resizeTextArea(textarea);
// });

/** button to generate permanent link */
function bind_permalink() {
  const permalink_btn = document.getElementById('permalink');
  permalink_btn.addEventListener('click', () => {
    const select = document.getElementById('dropdown-content');
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
  bind_plus_minus();
  add_input_bar(); // called so one input bar appears on opening of homepage
  bind_run_input();
  bind_machine_transform();
  bind_save_drawing();
  bind_undo_redo();
  bind_scroll();
  bind_dd();
  bind_elongate_textbox();
  bind_permalink();
  trash_color(); // link mouse event to appropriate trash color
  htmlSetUp(); // initiate eventlisteners for sidenavbar, second sidenavbar, and popup tutorial
  init_graph();  // leave this last since we want it to override some of the above
}

/** moved basic set up from index.html and combined into one function */
function htmlSetUp(){
  // first time pop up implementation
  // Check if the user is a first-time visitor
  if (!localStorage.getItem('visitedBefore')) {
  // User is a first-time visitor
  openPopup();

  // Set flag to indicate the user has visited before
  localStorage.setItem('visitedBefore', true);
  } 

  const closeButton = document.getElementById('closeButton');
  closeButton.addEventListener('click',function(){
    closetheButton();
  })

  const homeIcon = document.getElementById('homeIcon');
  const machineIcon = document.getElementById('machineIcon');
  const saveIcon = document.getElementById('saveIcon');
  const bugIcon = document.getElementById('bugIcon');
  const helpIcon = document.getElementById('helpIcon');
  const tutorial_close_btn = document.getElementById('tutorial_close_btn');
  const tutorial_finish_btn = document.getElementById('tutorial_finish_btn');

  homeIcon.addEventListener("click", () => {expandIcon('home')});
  machineIcon.addEventListener("click", () => {expandIcon('settings')});
  saveIcon.addEventListener("click", () => {expandIcon('save')});
  bugIcon.addEventListener("click", () => {redirectToBugReport()});
  helpIcon.addEventListener("click", () => {
    openPopup();
    closetheButton();
  }); 
  tutorial_close_btn.addEventListener("click",() => {closePopup();})
  tutorial_finish_btn.addEventListener("click",() => {closePopup();})

  const nextBtn_1to2 = document.getElementById('nextBtn_1to2');
  const nextBtn_2to3 = document.getElementById('nextBtn_2to3');
  const nextBtn_3to4 = document.getElementById('nextBtn_3to4');
  const nextBtn_4to5 = document.getElementById('nextBtn_4to5');

  const prevBtn_2to1 = document.getElementById('prevBtn_2to1');
  const prevBtn_3to2 = document.getElementById('prevBtn_3to2');
  const prevBtn_4to3 = document.getElementById('prevBtn_4to3');
  const prevBtn_5to4 = document.getElementById('prevBtn_5to4');

  nextBtn_1to2.addEventListener("click", () => {pgAtoB(1,2)});
  nextBtn_2to3.addEventListener("click", () => {pgAtoB(2,3)});
  nextBtn_3to4.addEventListener("click", () => {pgAtoB(3,4)});
  nextBtn_4to5.addEventListener("click", () => {pgAtoB(4,5)});

  prevBtn_2to1.addEventListener("click", () => {pgAtoB(2,1)});
  prevBtn_3to2.addEventListener("click", () => {pgAtoB(3,2)});
  prevBtn_4to3.addEventListener("click", () => {pgAtoB(4,3)});
  prevBtn_5to4.addEventListener("click", () => {pgAtoB(5,4)});
}

let homeToggle = false;
let machineToggle = false;
let saveToggle = false;

function closetheButton() {
  let secondbar = document.getElementById('secondbar');
  if (homeToggle || machineToggle || saveToggle) {
    secondbar.style.transform = "translate(-20vw)";
    homeToggle = false;
    machineToggle = false;
    saveToggle = false;
  }
  var i;
  var x = document.getElementsByClassName('dropdown');
  for (i = 0; i < x.length; i++) {  
    x[i].hidden = true;
  }
  document.querySelector('.active')?.classList.remove('active');
}

function clearMenu() {
  var i;
  var x = document.getElementsByClassName('dropdown');
  for (i = 0; i < x.length; i++) {  
    x[i].hidden = true;
  }
  document.querySelector('.active')?.classList.remove('active');
}

function togglesidebar(classname) {
  let secondbar = document.getElementById('secondbar');
  // if closed, open the appropriate menu, or close if clicked on the same icon
  if (classname === 'home' && !homeToggle) {
    secondbar.style.transform = "translate(0vw)"; 
    document.getElementById('secondbar').hidden = false;
    var x = document.getElementsByClassName(classname);
    for (var i = 0; i < x.length; i++) {
      x[i].hidden = false;
    }
    homeToggle = true;
    machineToggle = false;
    saveToggle = false;
    return true;
  }
  else if (classname === 'settings' && !machineToggle) {
    secondbar.style.transform = "translate(0vw)"; 
    document.getElementById('secondbar').hidden = false;
    var i;
    var x = document.getElementsByClassName(classname);
    for (i = 0; i < x.length; i++) {
      x[i].hidden = false;
    }
    homeToggle = false;
    machineToggle = true;
    saveToggle = false;
    return true;
  }
  else if (classname === 'save' && !saveToggle) {
    secondbar.style.transform = "translate(0vw)"; 
    document.getElementById('secondbar').hidden = false;
    var i;
    var x = document.getElementsByClassName(classname);
    for (i = 0; i < x.length; i++) {
      x[i].hidden = false;
    }
    homeToggle = false;
    machineToggle = false;
    saveToggle = true;
    return true;
  }
  else {
    closetheButton();
    homeToggle = false;
    machineToggle = false;
    saveToggle = false;
    return false;
  }
}


/** Global variable that records current page number of tutorial
 *  Used for funtions openOpoup() closePopup() and pgAtoB() */
var currentPg = 1;
// Function to open the pop-up
function openPopup() {
  //set this to the total number of pages to avoid bug
  //updated to 5 pages tutorial 7/24/2023
  currentPg = 5;
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'block';
  const popup = document.querySelector('.popup');
  popup.style.display = 'block';
  for(let i=currentPg; i>1 ; i--){
    pgAtoB(i,i-1);
  }
}

// Function to close the pop-up
function closePopup() {
  pgAtoB(currentPg,1);
  var popup = document.querySelector('.popup');
  popup.style.display = 'none';
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
}

//updated on function when clicking on an icon 5/16/2023
function expandIcon(nameOfClass){
  clearMenu();
  var headerName = 'none';
  var currIcon;
  switch(nameOfClass){
    case 'home':
      headerName = 'Home';
      currIcon = document.getElementById("homeIcon");
      break;
    case 'settings':
      headerName = 'Machines';
      currIcon = document.getElementById('machineIcon');
      break;
    case 'save':
      headerName = 'Save';
      currIcon = document.getElementById('saveIcon');
      break;
    case 'bug':
      headerName = 'Bug';
      currIcon = document.getElementById('bugIcon');
      break;
    }
   if (togglesidebar(nameOfClass)) {
    var header = document.getElementById('secondBarHeader');
    header.innerHTML = headerName;
    currIcon.classList.add('active');
  }
  else {
    document.querySelector('.active')?.classList.remove('active');
  }
}

// const navLinks = document.querySelectorAll('.sidenavBtn');
// navLinks.forEach(act => {
//   act.addEventListener('click', () => {
//     document.querySelector('.active')?.classList.remove('active');
//     this.classList.add('active');
//   })
// });
function pgAtoB(a,b){
  var pgName = 'pg';
  var nameA = pgName + a;
  var nameB = pgName + b;
  const pgA = document.getElementById(nameA);
  const pgB = document.getElementById(nameB);
  pgA.style.display = "none";
  pgB.style.display = "block";
  currentPg = b;
}

function redirectToBugReport() {
  window.open('https://github.com/flapjs/vanilla/issues', '_blank');
  //below is code for opening bug report in current tab of browser
  //window.location.href = 'https://github.com/flapjs/vanilla/issues';
}