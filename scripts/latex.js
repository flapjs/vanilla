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

//----------------------------------------------
// Current TODO:
// 1. Self loops only go above
// 2. Horizontally bend angles have label on the left
// 3. Fix more complicated state names
// 4. Overlapping labels for self loops
//----------------------------------------------

import * as consts from './consts.js';
import * as linalg from './linalg.js';

let debug = false; // change this to enable/disable logging

/**
 * compresses graph to tikz space 
 * @param {String} type - type of graph (DFA, NFA, ...)
 * @param {Array<Object>} states - the states of the graph
 * @returns {Array<String>} formatted positions of states
 */
function compressPlanar(states) {
  const distance = 8;

  let centroidX = 0, centroidY = 0;
  let n = states.length;

  let output = Array(n);

  for(let i = 0; i < n; i++) {
    let state = states[i];
    centroidX += state.x;
    centroidY += state.y;
    output[i] = [state.x, state.y];
  }
  if(debug) {
    console.log(output);
  }

  centroidX /= n;
  centroidY /= n;
  let center = [centroidX, centroidY];

  let maxDist = Number.MIN_VALUE;
  for(let i = 0; i < n; i++) {
    output[i] = linalg.sub(output[i], center);
    maxDist = Math.max(maxDist, linalg.vec_len(output[i]));
  }

  let scaleFactor = distance / (2 * maxDist);
  let formatted = output.map((v) => {
    let scaled = linalg.scale(scaleFactor, v);
    return `(${scaled[0].toFixed(2)},${-1 * scaled[1].toFixed(2)})`;
  });

  if(debug) {
    console.log(formatted);
  }
  return formatted;
}

/**
 * Computes the type of a given state 
 * @param {Object} state
 * @returns {String} tikz labels for the type of state
 */
function getStateType(state) {
  let inner = 'state,';
  if(state.is_start) {
    inner += 'initial,';
  }
  if(state.is_final) {
    inner += 'accepting,';
  }

  return inner;
}

/**
 * converts an edge to tikz string representation
 * @param {String} type - type of graph (DFA, NFA, ...)
 * @param {Object} edge - edge to convert to string
 * @param {String} labelPos - where to position label on edge
 * @returns {String} - tikz string representaiton of edge
 */
function edgeToString(type, edge, labelPos) {
  if(debug) {
    console.log(edge);
  }
  let bendAngle = Math.floor(edge.a2) * consts.LATEX_ANGLE_SCALE;
  let inner = `bend right=${bendAngle}`;
  let label = `${edge.transition}`; 

  if(bendAngle > consts.LATEX_ANGLE_SCALE) {
    labelPos = 'right';
  } else if(bendAngle < 0) {
    labelPos = 'left';
  }

  if(edge.from === edge.to) {
    inner = 'loop above';
    labelPos = 'above';
  }

  switch (type) {
  case 'PDA':
    label += `,${edge.pop_symbol} \\rightarrow ${edge.push_symbol}`.replaceAll('$', '\\$');
    break;
  case 'Turing':
    label += ` \\rightarrow ${edge.push_symbol}, ${edge.move}`.replaceAll('$', '\\$');
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
  let distance = 2;

  let output = `\\begin{tikzpicture}[->,>=stealth\',shorten >=1pt, auto, node distance=${distance}cm, semithick]\n`;
  output += '\\tikzstyle{every state}=[text=black, fill=none]\n';

  // initializing nodes
  let states = Object.values(graph);
  states.sort((a,b) => a.x - b.x); // sorts the states from left to right

  let statePositions = compressPlanar(states);

  let start = states[0];
  let inner = getStateType(start);

  for(let i = 0; i < states.length; i++) {
    let current = states[i];
    inner = getStateType(current);
    let position = statePositions[i];
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