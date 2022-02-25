/** @module compute */

import * as consts from './consts.js';
import * as graph_ops from './graph_ops.js';
import { Queue } from './util.js';

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
  for (let v of cur_states) {  // sets are interated in insertion order, so is BFS by default
    for (let edge of graph[v].out) {
      if (edge.transition === consts.EMPTY_TRANSITION) {cur_states.add(edge.to);}
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
function run_input_NFA(graph, input) {
  let cur_states = closure(graph, new Set([find_start(graph)]));  // find closure of start
  for (let c of input) {
    const new_states = new Set();
    for (let v of cur_states) {
      for (let edge of graph[v].out) {
        if (edge.transition === c) {new_states.add(edge.to);}
      }
    }
    cur_states = closure(graph, new_states);
    if (!cur_states.size) {return false;}  // can't go anywhere
  }
  return contains_final(graph, cur_states);
}

function BFS_step(graph, v, stack, remaining_input, allowed_steps=512) {
  const q = new Queue();
  q.enqueue([v, stack, remaining_input]);
  while (q.length && allowed_steps --> 0) {
    [v, stack, remaining_input] = q.dequeue();
    if (graph[v].is_final && !remaining_input.length) {return true;}  // found a path to accept
    for (let edge of graph[v].out) {  // otherwise add all valid neighbors to queue and keep searching
      const {transition, to, pop_symbol, push_symbol} = edge;
      const stack_copy = [...stack], input_copy = [...remaining_input];  // deep clone the input and stack for enqueuing
      if (transition !== consts.EMPTY_TRANSITION && transition !== input_copy.pop()) {continue;}  // input mismatch
      if (pop_symbol !== consts.EMPTY_SYMBOL && pop_symbol !== stack_copy.pop()) {continue;}  // stack mismatch
      // now we can go since both transition and stack match
      if (push_symbol !== consts.EMPTY_SYMBOL) {stack_copy.push(push_symbol);}  // add to the stack
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
  const stack = [];  // empty
  const remaining_input = input.split('').reverse();
  return BFS_step(graph, v, stack, remaining_input);
}

/**
 * check if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} input - input string
 * @returns {boolean} true iff the input is accepted by the machine
 */
function run_input_Turing(graph, input) {
  const v = find_start(graph);
  const stack = [];  // empty
  const remaining_input = input.split('').reverse();
  return BFS_step(graph, v, stack, remaining_input);
}

/**
 * determines whether the machine is Pushdown or normal NFA and checks if the input is accepted
 * @param {Object} graph - machine graph
 * @param {string} machine_type - type of machine the graph represents
 * @param {string} input - input string
 * @returns {boolean} true iff the input is accepted by the machine
 */
export function run_input(graph, input) {
  if (!Object.keys(graph).length) {return false;}  // empty graph
  else if (graph_ops.is_NFA()) {return run_input_NFA(graph, input);}
  else if (graph_ops.is_Pushdown()) {return run_input_Pushdown(graph, input);}
  // else if (machine_type === 'Turing') {return run_input_Turing(graph, input);}
}
