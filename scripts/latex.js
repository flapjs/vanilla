/** @module latex */

// -------------------------------------------------------------
// @author Meruzhan Sargsyan
//
// A module used to export the graph as text used in tikzpicture
// for easily exporting graphs into latex files
// -------------------------------------------------------------

//----------------------------------------------
// Testing Notes:
// - clipboard only available in secure contexts
//----------------------------------------------

import * as graph_ops from './graph_ops.js';

function dist(v1, v2) {
  return Math.sqrt(Math.pow((v1.x - v2.x),2) + Math.pow((v1.y - v2.y),2));
}

function closestTo(arr, state1) {
  let closest = null;
  let minDist = Number.MAX_VALUE;
  for(const state of arr) {
    if(state.name === state.name) {
      continue;
    }
    let distance = dist(state1, state);
    if(distance < minDist) {
      closest = state;
      minDist = distance;
    }
  }

  return closest;
}

/**
 * 
 * @param {Object} s1 - the state to be positioned
 * @param {Object} s2 - the state to position around
 * @returns {String} relation of s1's position to v2
 */
function getRelativePos(s1, s2) {
  let xDiff = s2.x - s1.x; 
  let yDiff = s2.y - s1.y;

  if(xDiff < 0) {
    return 'right';
  }
  if(xDiff > 0) {
    return 'left';
  }
  if(yDiff < 0) {
    return 'below';
  }
  if(yDiff > 0) {
    return 'above';
  }
    
  return '';
}

/**
 * 
 * @param {Array<Object>} comareTo - the states which can be used for positional comparison
 * @param {Object} state - the state which will be converted to string
 * @returns Touple (neighbor, String) which is detoupled to iterate through all states 
 */
function stateToString(comareTo, state) {
  let inner = 'state,';
  if (current.is_start) {
    inner += 'initial,';
  }
  if (current.is_final) {
    inner += 'accepting';
  }

  if (state.is_start) {
    return `\\node[${inner}] (${current.name}) {$${current.name}$};\n`;
  }

  let neighbor = closestTo(comareTo, state);
  let positional = getRelativePos(state, neighbor);
  if(mutatable) mutatable.push(neighbor);

  return  (neighbor, `\\node[${inner}] (${current.name}) [${positional} of=${neighbor.name}]` +
    `{$${current.name}$};\n`);
}

/**
 * @param {Object} graph - graph to be converted to latex
 * @return {String} representation of graph in latex tikzpicture
 */
export function serialize(graph) {
  // setup
  let output = '\\begin{tikzpicture}[->,>=stealth\',shorten >=1pt, auto, node distance=2cm, semithick]\n';
  output += '\\tikzstyle{every state}=[text=black, fill=none]\n';

  const states = Object.values(graph); 
  let current = graph_ops.find_start(graph);
  let checked = [current];

  let neighbor, asStr = stateToString(states, current);
  output += asStr;
  checked.push(neighbor);

  while(checked.length !== states.length) {
    neighbor, asStr = stateToString(checked, neighbor)
  }

  console.log(output);
}