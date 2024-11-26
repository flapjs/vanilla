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

import * as consts from './consts.js';
import * as linalg from './linalg.js';

function dist(v1, v2) {
  return Math.sqrt(Math.pow((v1.x - v2.x),2) + Math.pow((v1.y - v2.y),2));
}

function closestTo(arr, stateIn) {
  let closest = null;
  let minDist = Number.MAX_VALUE;
  for(const state of arr) {
    if(state.name === stateIn.name) {
      continue;
    }
    let distance = dist(stateIn, state);
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

  if (Math.abs(yDiff) > Math.abs(xDiff)) {
    if (yDiff < 0) {
      return 'below';
    }
    if (yDiff > 0) {
      return 'above';
    }
  }

  if(xDiff < 0) {
    return 'right';
  }
  if(xDiff > 0) {
    return 'left';
  }
   
  return '';
}

function getInner(state) {
  let inner = 'state,';
  if(state.is_start) inner += 'initial,'
  if(state.is_final) inner += 'accepting,'

  return inner;
}

function edgeToString(type, edge, labelPos) {
  let inner = '';
  let label = `${edge.transition}`; 

  switch (type) {
    case "PDA":
      label += `,${edge.pop_symbol} \\rightarrow ${edge.push_symbol}`;
      break;
    case "Turing":
      label += ` \\rightarrow ${edge.push_symbol}, ${edge.move}`;
      break;
    default:
      break;
  }

  let output = `(${edge.from}) edge [${inner}] node[${labelPos}] {$${label}$} (${edge.to})\n`;
  return output.replaceAll(consts.EMPTY_SYMBOL, '\\epsilon').replaceAll(consts.EMPTY_TAPE, '\\square');
}

/**
 * @param {Object} graph - graph to be converted to latex
 * @return {String} representation of graph in latex tikzpicture
 */
export function serialize(type, graph) {
  // setup
  let distance = '2cm';
  switch(type) {
    case "PDA":
    case "Turing":
      distance = '5cm';
      break;
    default:
      distance = '2cm';
  }

  let output = `\\begin{tikzpicture}[->,>=stealth\',shorten >=1pt, auto, node distance=${distance}, semithick]\n`;
  output += '\\tikzstyle{every state}=[text=black, fill=none]\n';

  let states = Object.values(graph);
  states.sort((a,b) => a.x - b.x); // sorts the states from left to right
  let start = states[0];
  let xFactor = start.x;
  let yFactor = start.y;

  for(const state of states) {
    state.x = (state.x * 4/ xFactor).toFixed(2);
    state.y = (state.y * 4/ yFactor).toFixed(2);
  }

  for(let i = 0; i < states.length; i++) {
    let current = states[i];
    let inner = getInner(current);
    let position = `(${current.x},${current.y})`;
    output += `\\node[${inner}] (${current.name}) at ${position} {$${current.name}$};\n`;
  }

  output += '\n';
  output += '\\path\n';

  for(let i = 0; i < states.length; i++) {
    let current = states[i];
    let edges = current.out; // array of edges

    for(let j = 0; j < edges.length; j++) {
      let edge = edges[j];
      let labelPosition = 'above';

      let startState = graph[edge.from];
      let endState = graph[edge.to];
      let angle = linalg.angle([startState.x, startState.y], [endState.x, endState.y]);

      if(angle <= -80 && angle >= -110) {
        labelPosition = 'left';
      } else if(angle >= 80 && angle <= 110) {
        labelPosition = 'right';
      }

      output += edgeToString(type, edge, labelPosition);
    }
  }
  output += ';\n';

  output += '\\end{tikzpicture}';
  console.log(output);
}