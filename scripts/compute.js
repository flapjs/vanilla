/** @module compute */

import * as consts from './consts.js';
import * as menus from './menus.js';
import { Queue } from './util.js';
import { edge_equal } from './graph_components.js';

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
 * @returns {boolean} true iff the input is accepted by the machine
 */
function run_input_NFA(graph, input) {
  let cur_states = closure(graph, new Set([find_start(graph)]));  // find closure of start
  for (const c of input) {
    cur_states = NFA_step(graph, cur_states, c);
    if (!cur_states.size) {
      return false;
    }  // can't go anywhere
  }
  return contains_final(graph, cur_states);
}

/**
 * step through the the computation of PDA with BFS
 * @param {Object} graph - machine graph
 * @param {string} v - starting vertex
 * @param {Array<string>} remaining_input - input string split into char array
 * @param {int} allowed_steps - the computation will halt and return false if the step limit is reached
 * @returns {boolean} true iff the input is accepted by the machine
 */
function BFS_step(graph, v, remaining_input, allowed_steps=512) {
  let stack = [];  // the computational stack
  const q = new Queue();
  q.enqueue([v, stack, remaining_input]);
  while (q.length && allowed_steps --> 0) {
    [v, stack, remaining_input] = q.dequeue();
    if (graph[v].is_final && !remaining_input.length) {
      return true;
    }  // found a path to accept
    for (const edge of graph[v].out) {  // otherwise add all valid neighbors to queue and keep searching
      const {transition, to, pop_symbol, push_symbol} = edge;
      const stack_copy = [...stack], input_copy = [...remaining_input];  // deep clone the input and stack for enqueuing
      if (transition !== consts.EMPTY_SYMBOL && transition !== input_copy.pop()) {
        continue;
      }  // input mismatch
      if (pop_symbol !== consts.EMPTY_SYMBOL && pop_symbol !== stack_copy.pop()) {
        continue;
      }  // stack mismatch
      // now we can go since both transition and stack match
      if (push_symbol !== consts.EMPTY_SYMBOL) {
        stack_copy.push(push_symbol);
      }  // add to the stack
      q.enqueue([to, stack_copy, input_copy]);
    }
  }
  return false;  // either stuck or exhausted step limit
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @returns {boolean} true iff the input is accepted by the machine
 */
function run_input_Pushdown(graph, input) {
  const v = find_start(graph);
  const remaining_input = input.split('').reverse();
  return BFS_step(graph, v, remaining_input);
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @param {int} allowed_steps - the computation will halt and return false if the step limit is reached
 * @returns {boolean} true iff the input is accepted by the machine
 */
function run_input_Turing(graph, input, allowed_steps=512) {
  const tape = {};  // we use an object instead of array to have negative index
  for (let i = 0; i < input.length; i++) {
    tape[i] = input[i];  // copy all input over
  }
  let tape_idx = 0;  // starting tape index
  let cur_state = find_start(graph);
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
  }
  return graph[cur_state].is_final;
}

/**
 * determines whether the machine is Pushdown or normal NFA and checks if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} machine_type - type of machine the graph represents
 * @param {string} input - input string
 * @returns {boolean} true iff the input is accepted by the machine
 */
export function run_input(graph, input) {
  if (!Object.keys(graph).length) {  // empty graph
    return false;
  } else if (menus.is_NFA()) {
    return run_input_NFA(graph, input);
  } else if (menus.is_Pushdown()) {
    return run_input_Pushdown(graph, input);
  } else if (menus.is_Turing()) {
    return run_input_Turing(graph, input);
  }
}

/**
 * given an NFA, check if it is in fact deterministic
 */
export function is_DFA(NFA) {

}

/**
 * computes if the edge is the same as another one already in graph up to graphical representation
 * @param {Object} graph 
 * @param {Object} edge 
 * @returns {boolean} true iff edge \in graph
 */
export function edge_has_equiv_edge_in_graph(graph, edge) {
  for (const vertex of Object.values(graph)) {
    for (const e of vertex.out) {
      if (edge_equal(e, edge)) {
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
 * @returns {boolean} true iff edge \in graph
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
