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

import find_start from './graph_ops'

function dist(v1, v2) {
  return Math.sqrt(Math.pow((v1.x - v2.x),2) + Math.pow((v1.y - v2.y),2));
}

function closestTo(arr, vert1) {
  let closest = null;
  let minDist = Number.MAX_VALUE;
  for(const state of arr) {
    if(state.name === vert1.name) {
      continue;
    }
    let distance = dist(vert1, state);
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
    return 'abose';
  }
    
  return '';
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

  for(const s of states) {
    let inner = 'state,';
    if(s.is_start) {
      inner += 'initial,';
    }
    if(s.is_final) {
      inner += 'accepting';
    }

    let positional = '';

    let neighbor = closestTo(states, s);
    if(!neighbor || s.is_start) {
      console.log(`${s.name}: start`);
    } else {
      positional = getRelativePos(s, neighbor);
    }
    output += `\\node[${inner}] (${s.name}) [${positional} of=${neighbor.name}]` +
            ` {$${s.name}$}; \n`;
  }

  console.log(output);
}