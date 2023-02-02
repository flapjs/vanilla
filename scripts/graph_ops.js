/** @module graph_ops */

import * as hist from './history.js';
import * as drawing from './drawing.js';
import * as consts from './consts.js';
import * as compute from './compute.js';
import * as linalg from './linalg.js';
import { Queue } from './util.js';
import * as menus from './menus.js';  // I know this is a circular dep, but it makes more sense this way
import * as graph_components from './graph_components.js';

/**
 * go through the list of used names for a vertex and find the smallest unused
 * @param {Object} graph - the graph in which we are looking for an unused name
 * @returns the smallest unused name for a vertex
 */
export function find_unused_name(graph) {
  const prefix = 'q';  // using standard notation
  let i;
  for (i = 0; i <= Object.keys(graph).length; i++) {  // we don't need to look further than how many elements in the set
    if (!(prefix+`${i}` in graph)) {
      break;
    }
  }
  return prefix+`${i}`;
}

/**
 * create a vertex at the place the user has clicked
 * @param {Object} graph - the graph in which we are creating a new vertex
 * @param {float} x - x position of the user mouse click wrt canvas
 * @param {float} y - y position of the user mouse click wrt canvas
 * @param {float} radius - the radius of the graphical element
 */
export function create_vertex(graph, x, y, radius) {
  const name = find_unused_name(graph);
  const vertex = graph_components.make_vertex(name, x, y, radius, !Object.keys(graph).length);
  graph[name] = vertex;
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * deletes a vertex by its name as well as its associated edges
 * @param {Object} graph - the graph containing the vertex v
 * @param {string} v - the vertex you want to delete
 */
export function delete_vertex(graph, v) {
  menus.remove_context_menu();
  if (graph[v].is_start) {  // we will need a start replacement
    for (const u of Object.keys(graph)) {
      if (u === v) {
        continue;
      }
      set_start(graph, u);
      break;
    }
  }
  delete graph[v];  // remove this vertex
  for (const vertex of Object.values(graph)) {
    vertex.out = vertex.out.filter(edge => edge.to !== v);
  }
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * renames the vertex with the new name, if name exists, nothing will be changed and user will be prompted
 * @param {Object} graph - the graph containing the vertex v
 * @param {string} v - the vertex to rename
 * @param {*} new_name - new name of the vertex
 * @param {string} new_moore_output - side effect of entering the state
 */
export function rename_vertex(graph, v, new_name, new_moore_output) {
  menus.remove_context_menu();
  if (v === new_name && graph[v].moore_output === new_moore_output) {  // nothing to do
    return;
  } else if (new_name in graph && new_moore_output === undefined) {  // not moore and name already exists
    alert(new_name + ' already exists');
  } else if (new_name === '') {
    alert('vertex name cannot be empty');
  } else if (new_moore_output === '') {
    alert('vertex name cannot be empty');
  } else {
    if (v !== new_name) {  // purely renaming
      graph[new_name] = graph[v];  // duplicate
      graph[new_name].name = new_name;
      delete graph[v];  // remove old
      for (const vertex of Object.values(graph)) {
        for (const edge of vertex.out) {
          if (edge.from === v) {
            edge.from = new_name;
          }
          if (edge.to === v) {
            edge.to = new_name;
          }
        }
      }
    }
  
    if (new_moore_output !== undefined) {  // purely changing the moore output
      graph[new_name].moore_output = new_moore_output;
    }
  
    drawing.draw(graph);
    hist.push_history(graph);
  }
}

/**
 * mark a vertex as start
 * @param {Object} graph - the graph containing the vertex v
 * @param {string} v - name of the vertex
 */
export function set_start(graph, v) {
  for (const vertex of Object.values(graph)) {
    vertex.is_start = false;
  }
  graph[v].is_start = true;
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * toggle whether a vertex is accept
 * @param {Object} graph - the graph containing the vertex v
 * @param {string} v - name of the vertex
 */
export function toggle_final(graph, v) {
  const vertex = graph[v];
  vertex.is_final = !vertex.is_final;
  if (vertex.is_final) {  // adding a circle
    drawing.draw_final_circle(vertex);
  } else {  // removing the circle, requires drawing
    drawing.draw(graph);
  }
  hist.push_history(graph);
}

/**
 * check if edge has proper name and is not already in the graph
 * @param {Object} graph - the graph to check the edge against
 * @param {Object} edge - the edge to validate
 * @returns {boolean} true iff edge valid
 */
export function validate_edge(graph, edge) {
  edge.transition = (edge.transition === '') ? consts.EMPTY_SYMBOL : edge.transition;
  edge.pop_symbol = (edge.pop_symbol === '') ? edge.pop_symbol : consts.EMPTY_SYMBOL;
  edge.push_symbol = (edge.push_symbol === '') ? edge.push_symbol : consts.EMPTY_SYMBOL;
  edge.move = (edge.move === '') ? edge.move : consts.RIGHT;  // fill in default if user erased the input
  for (const vertex of Object.values(graph)) {
    for (const e of vertex.out) {
      if (graph_components.edge_equal(edge, e)) {
        alert('the edge you are creating already exists');
        return false;  // same edge is already in graph
      }
    }
  }
  return true;
}

/**
 * creates an edge between two vertices and draw it on the screen
 * @param {Object} graph - the graph in which we are creating a new edge
 * @param {string} u - from vertex
 * @param {string} v - to vertex
 * @param {float} angle1 - the angle which the cursor left the from vertex
 * @param {float} angle2 - the angle which the cursor entered the to vertex
 * @param {string} pop_symbol - the symbol to pop on top of the stack
 * @param {string} push_symbol - the symbol to push on top of the stack
 */
export function create_edge(graph, u, v, angle1, angle2) {
  const a1 = 0.5, a2 = (u === v) ? 1 : 0;  // determine if self loop, then put the text somewhere else
  // make edge with undefined transition to be modified by user
  const edge = graph_components.make_edge(u, v, undefined, a1, a2, angle1, angle2);
  const [, , mid] = drawing.compute_edge_geometry(graph, edge);
  // context menu to modify the edge right after
  menus.display_edge_menu(graph, edge, ...drawing.canvas_px_to_window_px(mid));
  // Note: the edge is not added right away; instead it will be added after the user press enter to rename the edge
}

/**
 * delete an edge of the graph and draw
 * @param {Object} graph - the graph containing the edge we want to delete
 * @param {Object} edge the edge we want to get rid of
 */
export function delete_edge(graph, edge) {
  menus.remove_context_menu();
  for (const vertex of Object.values(graph)) {
    vertex.out = vertex.out.filter(e => !graph_components.edge_equal(e, edge));
  }
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * rename the transition of an edge
 * @param {Object} graph - the graph containing the edge we want to rename
 * @param {Object} edge the edge object of which we want to rename the transition
 * @param {string} new_transition - new transition symbol
 * @param {string} new_pop - new pop symbol
 * @param {string} new_push - new push symbol
 * @param {string} new_left_right - new move (left or right)
 */
export function rename_edge(graph, edge, new_transition, new_pop, new_push, new_left_right) {
  menus.remove_context_menu();
  const new_edge = {...edge,
    transition: new_transition ? new_transition : graph_components.get_empty_symbol(),
    pop_symbol: new_pop ? new_pop : graph_components.get_empty_symbol(),
    push_symbol: new_push ? new_push : graph_components.get_empty_symbol(),
    move: new_left_right};
  if (compute.edge_has_equiv_edge_in_graph(graph, new_edge)) {  // new edge clashes with old
    alert('an equivalent edge already exists');
    return;
  }
  Object.assign(edge, new_edge);  // change in place
  if (!compute.edge_in_graph(graph, edge)) {  // edge was not part of the graph
    graph[edge.from].out.push(edge);
  }
  drawing.draw(graph);
  hist.push_history(graph);
}

/**
 * 
 * @param {Array<string>} states - a list of state labels that are to be combined
 * @returns {string} [q3, q0, q5] -> '{q0,q3,q5}'
 */
function combine_state_labels(states) {
  // convert to array and sort
  states = [...states].sort((u, v) => {
    // u, v of the form qn, qm where n, m integers
    if (u.substring(0, 1) === v.substring(0, 1) && !isNaN(u.substring(1)) && !isNaN(v.substring(1))) {
      return parseInt(u.substring(1)) - parseInt(v.substring(1));  // return the numeric comparison
    } else {
      return u < v;  // use the string comparisn
    }
  });
  return '{'+ states.join(',') +'}';
}

/**
 * Converts a graph of an NFA to a DFA
 * @param {Object} NFA - graph of an NFA to be converted to DFA
 * @returns {Object} - graph of a DFA equivalent to the NFA
 */
export function NFA_to_DFA(NFA) {
  //TODO if (is already an DFA) return;
  // initialize graph and make trap state
  const alphabet = compute.compute_alphabet(NFA); // these will be all transitions symbols
  let vertex_position = [200, 200];  // initial position of a new state
  const DFA = {};  // new graph to populate
  DFA[consts.TRAP_STATE] = graph_components.make_vertex(
    consts.TRAP_STATE, ...vertex_position, consts.DEFAULT_VERTEX_RADIUS);  // add a trap state
  vertex_position = linalg.add(3*consts.DEFAULT_VERTEX_RADIUS, vertex_position);  // increment vertex position
  let trap_state_used = false;  // assume we haven't used the trap state yet
  for (const letter of alphabet) {
    DFA[consts.TRAP_STATE].out.push(graph_components.make_edge(consts.TRAP_STATE, consts.TRAP_STATE, letter));
  }

  // make start state
  let NFA_states = compute.closure(NFA, new Set([compute.find_start(NFA)]));  // find the start states
  let DFA_state = combine_state_labels(NFA_states);  // merge them
  DFA[DFA_state] = graph_components.make_vertex(
    DFA_state, ...vertex_position, consts.DEFAULT_VERTEX_RADIUS, true, compute.contains_final(NFA, NFA_states));
  vertex_position = linalg.add(3*consts.DEFAULT_VERTEX_RADIUS, vertex_position);  // increment vertex position

  // start BFS searching
  const q = new Queue();
  q.enqueue(NFA_states);
  while (q.length) {  // while still something to explore
    NFA_states = q.dequeue();
    DFA_state = combine_state_labels(NFA_states);
    for (const letter of alphabet) {  // for each letter, we add an edge
      const new_NFA_states = compute.NFA_step(NFA, NFA_states, letter);  // new states
      if (!new_NFA_states.size) {  // send to trap
        DFA[DFA_state].out.push(graph_components.make_edge(DFA_state, consts.TRAP_STATE, letter));
        trap_state_used = true;  // mark it used so we don't delete the trap state later
        continue;  // done
      }
      const new_DFA_state = combine_state_labels(new_NFA_states);
      if (!(new_DFA_state in DFA)) {  // if we don't have that state yet, create one
        DFA[new_DFA_state] = graph_components.make_vertex(new_DFA_state,
          ...vertex_position, consts.DEFAULT_VERTEX_RADIUS, false, compute.contains_final(NFA, new_NFA_states));
        vertex_position = linalg.add(3*consts.DEFAULT_VERTEX_RADIUS, vertex_position);  // increment vertex position
        q.enqueue(new_NFA_states);  // add this to be explored
      }
      DFA[DFA_state].out.push(graph_components.make_edge(DFA_state, new_DFA_state, letter));  // make edge
    }
  }
  
  // clean up
  if (!trap_state_used) {
    delete_vertex(DFA, consts.TRAP_STATE);
  }
  return DFA;
}
