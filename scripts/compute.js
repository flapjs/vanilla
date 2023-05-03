/** @module compute */

import * as consts from './consts.js';
import * as graph_ops from './graph_ops.js';
import * as drawing from './drawing.js';
import * as graph_components from './graph_components.js';

/**
 * finds all letters used in the transitions
 * @param {Object} graph - the graph whose alphebet is to be computed
 * @returns {Set<string>} a set of letters used in the transitions
 */

export function compute_alphabet(graph) {
  const alphabet = new Set();
  for (const vertex of Object.values(graph)) {
    for (const edge of vertex.out) {
      alphabet.add(edge.transition);
    }
  }
  alphabet.delete(consts.EMPTY_SYMBOL);  // exclude epsilon
  return alphabet;
}

/**
 * finds the start vertex
 * @param {Object} graph - the graph whose starting vertex is to be computed
 * @returns {string} the start of the graph, null of graph empty
 */
export function find_start(graph) {
  for (const [v, vertex] of Object.entries(graph)) {
    if (vertex.is_start) {
      return v;
    }
  }
  return null;
}

/**
 * compute the set of closure of current states (in-place and returns)
 * @param {Object} graph - the graph containing the cur_states
 * @param {Set<string>} cur_states - current states the machine is in
 * @returns {Set<string>} the closure of cur_states
 */
export function closure(graph, cur_states) {
  for (const v of cur_states) {  // sets are interated in insertion order, so is BFS by default
    for (const edge of graph[v].out) {
      if (edge.transition === consts.EMPTY_SYMBOL) {
        cur_states.add(edge.to);
      }
    }
  }
  return cur_states;
}

/**
 * checks if the set of states provided contains a final state
 * @param {Object} graph - the graph containing the cur_states
 * @param {Set<string>} cur_states - the set of current states we want to check if any is a final state
 * @returns {boolean} true iff some state in cur_states is a final state
 */
export function contains_final(graph, cur_states) {
  for (const v of cur_states) {
    if (graph[v].is_final) {
      return true;
    }
  }
  return false;
}

/**
 * a single step of the NFA running algorithm
 * @param {Object} graph - the NFA of interest
 * @param {Set<string>} cur_states - all possible states the machine is in
 * @param {string} symbol - the transition symbol
 * @returns {Set<string>} a new set of states after the transition
 */
export function NFA_step(graph, cur_states, symbol) {
  const new_states = new Set();
  for (const v of cur_states) {
    for (const edge of graph[v].out) {
      if (edge.transition === symbol) {
        new_states.add(edge.to);
      }
    }
  }
  return closure(graph, new_states);
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @returns {Iterable} a generator that evaluates to true iff the input is accepted by the machine
 */
function* run_input_NFA(graph, input, interactive=false) {
  let cur_states = closure(graph, new Set([find_start(graph)]));  // find closure of start
  if (interactive) {
    drawing.highlight_states(graph, cur_states);
    drawing.viz_NFA_input(input, 0);
    yield;
  }
  for (let i = 0; i < input.length; ++i) {
    cur_states = NFA_step(graph, cur_states, input.charAt(i));
    if (!cur_states.size) {  // can't go anywhere
      break;
    }
    
    if (interactive) {
      drawing.highlight_states(graph, cur_states);
      drawing.viz_NFA_input(input, i+1);
      if (i === input.length-1) {  // last step
        break;
      } else {
        yield;
      }
    }
  }
  return contains_final(graph, cur_states);
}

/**
 * Compute the (almost) closure of PDA states stored inside the queue q and add them to the queue
 * Note that we only evaluate all the epsilon transitions once to speed up computation
 * @param {Object} graph 
 * @param {Map<string, Array>} cur_configs - an array of configurations [vertex_name, stack, remaining_input]
 *                                           we package it in a set to deduplicate
 */
function PDA_closure(graph, cur_configs) {
  let original_len = cur_configs.size;
  for (const [v, stack, remaining_input] of cur_configs.values()) {
    for (const edge of graph[v].out) {
      const {transition, to, pop_symbol, push_symbol} = edge;
      const stack_copy = [...stack], input_copy = [...remaining_input];  // deep clone the input and stack
      if (transition !== consts.EMPTY_SYMBOL) {  // not spontaneous transition
        continue;
      }
      if (pop_symbol !== consts.EMPTY_SYMBOL && pop_symbol !== stack_copy.pop()) {  // stack mismatch
        continue;
      }
      if (push_symbol !== consts.EMPTY_SYMBOL) {  // add to the stack
        stack_copy.push(push_symbol);
      }
      cur_configs.set(JSON.stringify([to, stack_copy, input_copy]), [to, stack_copy, input_copy]);
    }
    --original_len;
    if (!original_len) {  // we have evaluated all the original configurations
      break;              // break to prevent infinite loop after adding new configurations
    }
  }
}

/**
 * Extract a list of vertices from a map of configurations
 * @param {Map<string, Array>} cur_configs - a map of whose values are [vertex_name, stack, remaining_input]
 * @returns Set<string> a set of vertex names
 */
function config_to_vertices(cur_configs) {
  const cur_vertices = new Set();
  for (const [v, _, __] of cur_configs.values()) {
    cur_vertices.add(v);
  }
  return cur_vertices;
}

/**
 * step through the the computation of PDA with BFS
 * @param {Object} graph - machine graph
 * @param {string} v - starting vertex
 * @param {Array<string>} remaining_input - input string split into char array
 * @param {int} allowed_depth - the computation will halt and return false if the BFS tree is deeper than this
 * @returns {Iterable} a generator that evaluates to true iff the input is accepted by the machine
 */
function* BFS_step(graph, v, remaining_input, interactive=false, allowed_depth=64) {
  let stack = [];  // the computational stack
  let cur_configs = new Map(), nxt_configs = new Map();  // the current configurations [vertex, stack, remaining_input]
  cur_configs.set(JSON.stringify([v, stack, remaining_input]), [v, stack, remaining_input]);
  PDA_closure(graph, cur_configs);
  if (interactive) {
    drawing.highlight_states(graph, config_to_vertices(cur_configs));
    drawing.viz_PDA_configs(graph, cur_configs);
    yield;
  }
  
  while (cur_configs.size && allowed_depth --> 0) {
    // process all configurations on a single depth of the BFS tree
    for (const [v, stack, remaining_input] of cur_configs.values()) {
      for (const edge of graph[v].out) {
        const {transition, to, pop_symbol, push_symbol} = edge;
        const stack_copy = [...stack], input_copy = [...remaining_input];  // deep clone the input and stack
        if (transition !== consts.EMPTY_SYMBOL && transition !== input_copy.pop()) {
          continue;  // input mismatch
        }
        if (pop_symbol !== consts.EMPTY_SYMBOL && pop_symbol !== stack_copy.pop()) {
          continue;  // stack mismatch
        }
        // now we can go since both transition and stack match
        if (push_symbol !== consts.EMPTY_SYMBOL) {  // add to the stack
          stack_copy.push(push_symbol);
        }
        if (graph[to].is_final && !input_copy.length) {  // final state + exhausted input
          if (interactive) {
            const cur_vertices = config_to_vertices(cur_configs);
            cur_vertices.add(to);
            drawing.highlight_states(graph, cur_vertices);
          }
          return true;
        }
        nxt_configs.set(JSON.stringify([to, stack_copy, input_copy]), [to, stack_copy, input_copy]);
      }
    }
    PDA_closure(graph, nxt_configs);
    if (interactive) {
      if (nxt_configs.size) {  // not the last step
        drawing.highlight_states(graph, config_to_vertices(nxt_configs));
        drawing.viz_PDA_configs(graph, nxt_configs);
        yield;
      } else {
        return false;
      }
    }
    cur_configs = nxt_configs;
    nxt_configs = new Map();  // swap the buffers
  }
  return false;  // either stuck or exhausted step limit
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @param {boolean} interactive - whether to show the computation step by step
 * @returns {Iterable} a generator that evaluates to true iff the input is accepted by the machine
 */
function run_input_PDA(graph, input, interactive) {
  const v = find_start(graph);
  const remaining_input = input.split('').reverse();
  return BFS_step(graph, v, remaining_input, interactive);
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @param {int} allowed_steps - the computation will halt and return false if the step limit is reached
 * @returns {Iterable} a generator that evaluates to true iff the input is accepted by the machine
 */
function* run_input_Turing(graph, input, interactive=false, allowed_steps=512) {
  const tape = {};  // we use an object instead of array to have negative index
  for (let i = 0; i < input.length; i++) {
    tape[i] = input[i];  // copy all input over
  }
  let tape_idx = 0;  // starting tape index
  let cur_state = find_start(graph);
  if (interactive) {
    drawing.highlight_states(graph, [cur_state]);
    drawing.viz_TM_tape(tape, tape_idx);
    yield;
  }

  let stuck = false;  // whether we are out of legal transitions
  while (!stuck && !graph[cur_state].is_final && allowed_steps --> 0) {
    stuck = true;  // assume we are stuck and change to not stuck in the loop
    for (const edge of graph[cur_state].out) {
      if (!tape[tape_idx]) {  // fill in empty if tape null/undefined
        tape[tape_idx] = consts.EMPTY_SYMBOL;
      }
      if (edge.transition !== tape[tape_idx]) {  // cannot take this transition
        continue;
      }
      cur_state = edge.to;  // go to next state
      tape[tape_idx] = edge.push_symbol;  // write to tape
      tape_idx += (edge.move === consts.LEFT) ? -1 : 1;  // move tape needle
      stuck = false;  // we just moved, so not stuck
      break;  // determinism, so can't multi-branch
    }
    if (interactive) {
      drawing.highlight_states(graph, [cur_state]);
      drawing.viz_TM_tape(tape, tape_idx);
      if (cur_state.is_final) {
        return true;
      } else if (stuck) {
        return false;
      } else {
        yield;
      }
    }
  }
  return graph[cur_state].is_final;
}

/**
 * determines whether the machine is PDA or normal NFA and checks if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} machine_type - type of machine the graph represents
 * @param {string} input - input string
 * @param {boolean} interactive - whether to step through and highlight the computation
 * @returns {Iterable} return a generator that
 *                     if noninteractive, evaluates to immediately in one step
 *                     if interactive, evaluates step by step with highlight
 */
export function run_input(graph, machine_type, input, interactive=false) {
  if (interactive) {
    drawing.highlight_states(graph, []);  // clear all highlights
  }

  if (!Object.keys(graph).length) {  // empty graph
    return false;
  } else if (machine_type === consts.MACHINE_TYPES.NFA) {
    return run_input_NFA(graph, input, interactive);
  } else if (machine_type === consts.MACHINE_TYPES.PDA || machine_type == consts.MACHINE_TYPES.CFG) {
    return run_input_PDA(graph, input, interactive);
  } else if (machine_type === consts.MACHINE_TYPES.Turing) {
    return run_input_Turing(graph, input, interactive);
  }
}

/** given an NFA, check if it is in fact deterministic */
export function is_DFA(NFA) {

}

/**
 * computes if the edge is the same as another one already in graph up to graphical representation
 * @param {Object} graph 
 * @param {Object} edge 
 * @returns {boolean} true iff edge in graph
 */
export function edge_has_equiv_edge_in_graph(graph, edge) {
  for (const vertex of Object.values(graph)) {
    for (const e of vertex.out) {
      if (graph_components.edge_equal(e, edge)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * computes if the edge IS already in graph
 * @param {Object} graph 
 * @param {Object} edge 
 * @returns {boolean} true iff edge in graph
 */
export function edge_in_graph(graph, edge) {
  for (const vertex of Object.values(graph)) {
    for (const e of vertex.out) {
      if (edge === e) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Runs a search on a graph starting at a vertex
 * @param {Object} graph the input graph
 * @param {Object} vertex the starting vertex
 * @returns {Object[]} a list of all vertices reachable from the start vertex (excluding start unless there is a loop)
 */
export function search(graph, vertex, arr) {
  arr = arr? arr : [];
  if (vertex.out == undefined) {
    return arr;
  }
  for (const e of vertex.out) {
    let vout = e.to;
    arr.push(vout);
    //note: this process is slow, could optimize
    if (arr.indexOf(vout) >= 0) {
      let arr2 = search(graph, vout, arr);
      arr = arr.concat(arr2);
    }
  }
  return arr;
}

/**
 * Derives a CFG with an equivalent language to that of the input PDA
 * @param {Object} graph The PDA to convert
 * @returns {HTMLUlistElement} An equivalent CFG
 */
export function PDA_to_CFG(graph) {
  const alphabet = compute_alphabet(graph);
  //Modify graph to satisfy required conditions for conversion
  const PLACEHOLDER_SYMB = '|'; //TODO: figure out better placeholder
  const STACK_MARKER = '\\'; //TODO: figure out better placeholder
  const EMPTY_SYMBOL = consts.EMPTY_SYMBOL;
  let name = graph_ops.find_unused_name(graph);
  const start_vertex = graph_components.make_vertex(name,0,0); //new start state to push stack marker
  start_vertex.is_start = true;
  graph[name] = start_vertex;
  name = graph_ops.find_unused_name(graph);
  const final_vertex_empty = graph_components.make_vertex(name,0,0); //state used to empty stack after computation
  graph[name] = final_vertex_empty;
  name = graph_ops.find_unused_name(graph);
  const final_vertex = graph_components.make_vertex(name,0,0); //unique accept state
  graph[name] = final_vertex
  for (const vertex of Object.values(graph)) {
    for (const edge of vertex.out) {
      //if edge does nothing to stack, add transition state to push/pop placeholder
      if (edge.push_symbol == consts.EMPTY_SYMBOL && edge.pop_symbol == consts.EMPTY_SYMBOL) {
        name = graph_ops.find_unused_name(graph);
        const newVertex = graph_components.make_vertex(name,0,0);
        graph[name] = newVertex;
        let e1 = graph_components.make_edge(vertex, newVertex, edge.transition, 0.5, 0, 0, 0, EMPTY_SYMBOL, PLACEHOLDER_SYMB);
        vertex.out.push(e1);
        let e2 = graph_components.make_edge(newVertex, edge.to, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, PLACEHOLDER_SYMB, EMPTY_SYMBOL);
        newVertex.out.push(e2);
        vertex.out = vertex.out.filter(e => !graph_components.edge_equal(e, edge)); //TODO: find better algorithm
      }
      //if edge both pushes and pops, add transition state to separate the two
      else if (edge.push_symbol != consts.EMPTY_SYMBOL && edge.pop_symbol != consts.EMPTY_SYMBOL) {
        const name = graph_ops.find_unused_name(graph);
        const newVertex = graph_components.make_vertex(name,0,0);
        graph[name] = newVertex;
        let e1 = graph_components.make_edge(vertex, newVertex, edge.transition, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, edge.push_symbol);
        vertex.out.push(e1);
        let e2 = graph_components.make_edge(newVertex, edge.to, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, edge.pop_symbol, consts.EMPTY_SYMBOL);
        vertex.out.push(e2);
        vertex.out = vertex.out.filter(e => !graph_components.edge_equal(e, edge));
      }
    }
    //change start state + push stack marker
    if (vertex.is_start && vertex != start_vertex) {
      let e = graph_components.make_edge(start_vertex, vertex, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, STACK_MARKER);
      vertex.out.push(e);
      vertex.is_start = false;
    }
    //Funnel all accept states into one state
    if (vertex.is_final) {
      let e = graph_components.make_edge(vertex, final_vertex_empty, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, PLACEHOLDER_SYMB);
      vertex.out.push(e);
    }
  }
  //empty stack
  final_vertex.is_final = true;
  for (const c in alphabet) {
    let e = graph_components.make_edge(final_vertex_empty, final_vertex_empty, EMPTY_SYMBOL, 0.5, 0, 0, 0, c, EMPTY_SYMBOL);
    final_vertex_empty.out.push(e);
  }
  let e = graph_components.make_edge(final_vertex_empty, final_vertex_empty, EMPTY_SYMBOL, 0.5, 0, 0, 0, PLACEHOLDER_SYMB, EMPTY_SYMBOL);
  final_vertex_empty.out.push(e);
  e = graph_components.make_edge(final_vertex_empty, final_vertex, EMPTY_SYMBOL, 0.5, 0, 0, 0, STACK_MARKER, EMPTY_SYMBOL);
  final_vertex_empty.out.push(e);

  //create CFG rule matrix + array of vertices to index
  let i = 0;
  let vertex_array = [];
  for (const vertex in graph) {
    i++;
    vertex_array.push(vertex);
  }
  let rule_matrix = [];
  const NULL = null; //symbol for rule cannot be fully evaluated
  const EMPTY = "\0"; //symbol for rule that must only contain empty string
  for (let j = 0; j < i; j++) {
    let rule_row = [];
    //find reachable vertices
    let reachable = search(graph, vertex_array[j]);
    for (let k = 0; k < i; k++) {
      //note: inefficient process, should be optimized
      if (reachable.indexOf(vertex_array[k]) == -1) {
        //vertex is unreachable
        if (j == k) {
          //rule will only contain empty string in this case
          rule_row.push(EMPTY);
        } else {
          //rule cannot be evaluated
          rule_row.push(NULL);
        }
      } else {
        rule_row.push("");
      }
    }
    rule_matrix.push(rule_row);
  }

  //create reverse graph, helpful for computation
  let graph_reverse = consts.EMPTY_GRAPH;
  for (const vertex in graph) {
    graph_reverse[vertex.name] = graph_components.make_vertex(vertex.name, 0, 0);
  }
  for (const vertex in graph) {
    for (const edge in vertex.out) {
      //copy each edge from the graph, then reverse the direction
      let e = graph_components.make_edge(graph_reverse[edge.to.name], graph_reverse[edge.from.name], edge.transition, edge.a1, edge.a2, edge.angle1, edge.angle2, edge.pop_symbol, edge.push_symbol);
      graph_reverse[edge.to.name].out.push(e);
    }
  }

  //compute rules
  for (let j = 0; j < i; j++) {
    for (let k = 0; k < i; k++) {
      //replace known constants
      if (rule_matrix[j][k] == NULL || rule_matrix[j][k] == EMPTY) {
        continue;
      }
      //compute rules that split into two rules
      for (let l = 0; l < i; l++) {
        //make sure rules can be evaluated
        if (j != l && k != l && rule_matrix[j][l] != NULL && rule_matrix[l][k] != NULL) {
          if (rule_matrix[j][k] != "") {
            rule_matrix[j][k] = rule_matrix[j][k] + " | ";
          }
          if (rule_matrix[j][l] != EMPTY) {
            rule_matrix[j][k] += "(" + j + "," + l + ")";
          }
          if (rule_matrix[l][k] != EMPTY) {
            rule_matrix[j][k] += "(" + l + "," + k + ")";
          }
          if (rule_matrix[j][l] == EMPTY && rule_matrix[l][k] == EMPTY) {
            rule_matrix[j][k] += EMPTY_SYMBOL;
          }
        }
      }
      //compute rules that add characters
      for (const e1 in vertex_array[j].out) {
        //make sure it's a push edge
        if (e1.push_symbol = EMPTY_SYMBOL) {
          continue;
        }
        let c = e1.push_symbol;
        //check output for incoming edges with same pop symbol (outgoing in reverse graph)
        for (const e2 in graph_reverse[vertex_array[k].name].out) {
          if (e2.pop_symbol == c) {
            //get intermediate rule, evaluate known cases
            let mid_rule = rule_matrix[e1.to][e2.to];
            if (mid_rule == NULL) {
              continue;
            }
            if (mid_rule == EMPTY) {
              if (rule_matrix[j][k] != "") {
                rule_matrix[j][k] = rule_matrix[j][k] + " | ";
              }
              rule_matrix[j][k] += e1.transition;
              rule_matrix[j][k] += e2.transition;
            } else {
              if (rule_matrix[j][k] != "") {
                rule_matrix[j][k] = rule_matrix[j][k] + " | ";
              }
              rule_matrix[j][k] += e1.transition + "(" + e1.to + "," + e2.to + ")" + e2.transition;
            }
          }
        }
      }
    }
  }
  console.log(rule_matrix);
}
