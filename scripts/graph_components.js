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
 * @returns 
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
 * @param {float} a1 - first coordinate for the edge basis
 * @param {float} a2 - second cooridnate for the edge basis
 * @param {float} angle1 - start angle for self loop
 * @param {float} angle2 - end angle for self loop
 * @param {string} transition - transition symbol
 * @param {string} pop_symbol - the read symbol
 * @param {string} push_symbol - the write symbol
 * @param {string} move - whether move left of right
 * @returns 
 */
export function make_edge(from, to, a1, a2, angle1, angle2, transition, pop_symbol, push_symbol, move) {
  return {
    from: from,
    to: to,
    a1: a1,
    a2: a2,
    angle1: angle1,
    angle2: angle2,
    transition: transition ? transition : consts.EMPTY_SYMBOL,
    pop_symbol: pop_symbol ? pop_symbol : consts.EMPTY_SYMBOL,
    push_symbol: push_symbol ? push_symbol : consts.EMPTY_SYMBOL,
    move: move ? move : consts.RIGHT
  };
}
