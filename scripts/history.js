/** @module history */

import * as consts from './consts.js';

// history pointers
let hist_ptr = -1, hist_tip = -1;

/**
 * get history array from localstore and parse
 * @returns {Array<Object>} an array of graphs
 */
export function get_history() {
  if (!localStorage.getItem(consts.HIST_KEY)) {push_history(consts.EMPTY_GRAPH, []);}  // push empty history
  // otherwise, already have history written to localstore
  hist_tip = localStorage.getItem(consts.HIST_TIP_KEY);
  hist_ptr = localStorage.getItem(consts.HIST_PTR_KEY);
  return JSON.parse(localStorage.getItem(consts.HIST_KEY));
}

/**
 * get the latest graph object from localstore
 * @returns {Object} the latest graph object
 */
export function retrieve_latest_graph() {
  return get_history().at(hist_ptr);
}

/**
 * push the current state of the graph onto history
 * @param {Object} graph - the graph you want to add to history
 * @param {Array<Object>} history - array of graphs, force rewrite
 */
export function push_history(graph, history=null) {
  if (!history) {history = get_history();}
  history[++hist_ptr] = graph;
  hist_tip = hist_ptr;  // we just pushed, so that is the new tip
  const hist_str = JSON.stringify(history);
  localStorage.setItem(consts.HIST_KEY, hist_str);
  localStorage.setItem(consts.HIST_TIP_KEY, hist_tip);
  localStorage.setItem(consts.HIST_PTR_KEY, hist_ptr);
}

/**
 * undos the last operation
 * @returns {Object} the last graph
 */
export function undo() {
  const history = get_history();
  if (hist_ptr <= 0) {return history[hist_ptr];}  // can't go backward
  const graph = history[--hist_ptr];
  localStorage.setItem(consts.HIST_PTR_KEY, hist_ptr);
  return graph;
}

/**
 * redo the last undo
 * @returns {Object} the next graph
 */
export function redo() {
  const history = get_history();
  if (hist_ptr === hist_tip) {return history[hist_ptr];}  // can't go forward
  const graph = history[++hist_ptr];
  localStorage.setItem(consts.HIST_PTR_KEY, hist_ptr);
  return graph;
}
