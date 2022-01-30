/** @module compute */

import * as consts from './consts.js';

/**
 * finds all letters used in the transitions
 * @param {Object} graph - the graph whose alphebet is to be computed
 * @returns {Set<string>} a set of letters used in the transitions
 */
export function compute_alphabet(graph) {
  const alphabet = new Set();
  for (let vertex of Object.values(graph)) {
    for (let edge of vertex.out) {alphabet.add(edge.transition);}
  }
  return alphabet;
}

/**
 * finds the start vertex
 * @param {Object} graph - the graph whose starting vertex is to be computed
 * @returns {string} the start of the graph, null of graph empty
 */
export function find_start(graph) {
  for (let [v, vertex] of Object.entries(graph)) {
    if (vertex.is_start) {return v;}
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
  let old_size = 0;  // initialize size to be zero
  while (cur_states.size > old_size) {  // if we have added new state to the mix, then keep going
    old_size = cur_states.size;
    for (let v of cur_states) {
      for (let edge of graph[v].out) {
        if (edge.transition === consts.EMPTY_TRANSITION) {cur_states.add(edge.to);}
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
  for (let v of cur_states) {
    if (graph[v].is_final) {return true;}
  }
  return false;
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @returns {boolean} true iff the input is accepted by the machine
 */
export function run_input(graph, input) {
  if (!Object.keys(graph).length) {return false;}  // empty graph
  let cur_states = closure(new Set([find_start()]));  // find closure of start
  for (let c of input) {
    const new_states = new Set();
    for (let v of cur_states) {
      for (let edge of graph[v].out) {
        if (edge.transition === c) {new_states.add(edge.to);}
      }
    }
    cur_states = closure(new_states);
    if (!cur_states.size) {return false;}  // can't go anywhere
  }
  return contains_final(cur_states);
}
