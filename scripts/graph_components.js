/** @module graph_components */

import * as consts from './consts.js';

/**
 * making a new vertex
 * @param {string} name - name of the vertex
 * @param {float} x - x cooridnate w.r.t. canvas
 * @param {float} y - y cooridnate w.r.t. canvas
 * @param {float} r - radius in pixels
 * @param {boolean} is_start - is the vertex a start state?
 * @param {boolean} is_final - is the vertex an accept state?
 * @param {Array<Object>} out - neighbors, more specifically array of edges to neighbors
 * @returns {Object} the vertex as a json object
 */
export function make_vertex(name, x, y, r, is_start, is_final, out) {
  return {
    name: name,
    x: x,
    y: y,
    r: r ? r : consts.DEFAULT_VERTEX_RADIUS,
    is_start: is_start ? is_start : false,
    is_final: is_final ? is_final : false,
    out: out ? out : []
  };
}

/**
 * making a new edge
 * @param {string} from - from vertex
 * @param {string} to - to vertex
 * @param {string} transition - transition symbol
 * @param {float} a1 - first coordinate for the edge basis
 * @param {float} a2 - second cooridnate for the edge basis
 * @param {float} angle1 - start angle for self loop
 * @param {float} angle2 - end angle for self loop
 * @param {string} pop_symbol - the read symbol
 * @param {string} push_symbol - the write symbol
 * @param {string} move - whether move left of right
 * @returns {Object} the edge as a json object
 */
export function make_edge(from, to, transition, a1, a2, angle1, angle2, pop_symbol, push_symbol, move) {
  if (from === to && (angle1 === undefined || angle2 === undefined)) {
    angle1 = 0, angle2 = Math.PI/2, a1 = 0.5, a2 = 1;
  } else if (a1 === undefined || a2 === undefined) {
    a1 = 0.5, a2 = 0;
  }  // making sure edges are properly drawn
  return {
    from: from,
    to: to,
    transition: transition ? transition : consts.EMPTY_SYMBOL,
    a1: a1,
    a2: a2,
    angle1: angle1,
    angle2: angle2,
    pop_symbol: pop_symbol ? pop_symbol : consts.EMPTY_SYMBOL,
    push_symbol: push_symbol ? push_symbol : consts.EMPTY_SYMBOL,
    move: move ? move : consts.RIGHT
  };
}

/**
 * check if the two edges are equal up to graphical representation
 * @param {Object} e1 - edge 1
 * @param {Object} e2 - edge 2
 * @returns {boolean} true iff equal
 */
export function edge_equal(e1, e2) {
  return e1.from === e2.from &&
         e1.to === e2.to &&
         e1.transition === e2.transition &&
         e1.pop_symbol === e2.pop_symbol &&
         e1.push_symbol === e2.push_symbol &&
         e1.move === e2.move;
}
