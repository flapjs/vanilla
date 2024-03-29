/** @module history */

import * as consts from './consts.js';

// default keys and their pointers
let hist_key = consts.HIST_KEYS[consts.DEFAULT_MACHINE],
  hist_ptr_key = consts.HIST_PTR_KEYS[consts.DEFAULT_MACHINE],
  hist_tip_key = consts.HIST_TIP_KEYS[consts.DEFAULT_MACHINE];
let hist_ptr = -1, hist_tip = -1;

/**
 * sets the localstore key for history retrival and writing
 * MUST be used before get_history, push_history, etc.
 * @param {String} machine - type of machine from ['NFA', 'PDA', 'Turing']
 */
export function set_history_keys(machine) {
  hist_key = consts.HIST_KEYS[machine];
  hist_ptr_key = consts.HIST_PTR_KEYS[machine];
  hist_tip_key = consts.HIST_TIP_KEYS[machine];
}

/**
 * get history array from localstore and parse
 * @returns {Array<Object>} an array of graphs
 */
export function get_history() {
  if (!localStorage.getItem(hist_key)) {
    hist_ptr = -1, hist_tip = -1;  // initialize ptrs
    push_history({}, []);  // initialize history
  }
  // otherwise, already have history written to localstore
  hist_tip = localStorage.getItem(hist_tip_key);
  hist_ptr = localStorage.getItem(hist_ptr_key);
  return JSON.parse(localStorage.getItem(hist_key));
}

/**
 * get the latest graph object from localstore
 * @returns {Object} the latest graph object
 */
export function retrieve_latest_graph() {
  return get_history().at(hist_ptr);
}

/**
 * Some information of the graph should not be saved to the history. Remove them here.
 * @param {Object} graph 
 * @returns {Object} the graph without the unnecessary information
 */
function remove_ignores(graph) {
  const copy = structuredClone(graph);
  for (const vertex of Object.values(copy)) {
    vertex.highlighted = false;  // remove highlight
  }
  return copy;
}

/**
 * push the current state of the graph onto history
 * @param {Object} graph - the graph you want to add to history
 * @param {Array<Object>} history - array of graphs, force rewrite
 */
export function push_history(graph, history = null) {
  if (!history) {
    history = get_history(); 
  }
  history[++hist_ptr] = remove_ignores(graph);
  hist_tip = hist_ptr;  // we just pushed, so that is the new tip
  const hist_str = JSON.stringify(history);
  localStorage.setItem(hist_key, hist_str);
  localStorage.setItem(hist_tip_key, hist_tip);
  localStorage.setItem(hist_ptr_key, hist_ptr);
}

/**
 * undos the last operation
 * @returns {Object} the last graph
 */
export function undo() {
  const history = get_history();
  if (hist_ptr <= 0) {
    return history[hist_ptr]; 
  }  // can't go backward
  const graph = history[--hist_ptr];
  localStorage.setItem(hist_ptr_key, hist_ptr);
  return graph;
}

/**
 * redo the last undo
 * @returns {Object} the next graph
 */
export function redo() {
  const history = get_history();
  if (hist_ptr === hist_tip) {
    return history[hist_ptr]; 
  }  // can't go forward
  const graph = history[++hist_ptr];
  localStorage.setItem(hist_ptr_key, hist_ptr);
  return graph;
}
