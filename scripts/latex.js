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
/**
 * normalizes two vectors and places them based on given distance 
 * @param {Object} s1 - the state to be positioned
 * @param {Object} s2 - the state to position around
 * @returns {String} (x,y) position of s1
 */
function getRelativePos(s1, s2, distance) {
  function compress(x) {
    let numer = Math.log(Math.abs(x) + 1);
    let denom = Math.log(scaleFactor + 1);
    return numer / denom * distance;
  }

  let xDiff = s2.x - s1.x, yDiff = s2.y - s1.y;

  let mapped = [compress(xDiff), compress(yDiff)];
  console.log(`mapped: ${mapped}`);

  return `(${mapped[0].toFixed(2)}, ${-1 * mapped[1].toFixed(2)})`;
}

function compressPlanar(states, distance) {
  let centroidX = 0, centroidY = 0;
  let n = states.length;

  let output = Array(n);

  for(let i = 0; i < n; i++) {
    let state = states[i];
    centroidX += state.x;
    centroidY += state.y;
    output[i] = [state.x, state.y];
  }
  console.log(output);

  centroidX /= n;
  centroidY /= n;
  let center = [centroidX, centroidY];

  let maxDist = Number.MIN_VALUE;
  for(let i = 0; i < n; i++) {
    output[i] = linalg.sub(output[i], center);
    maxDist = Math.max(maxDist, linalg.vec_len(output[i]));
  }

  let scaleFactor = 8 / (2 * maxDist);
  let formatted = output.map((v) => {
    let scaled = linalg.scale(scaleFactor, v);
    return `(${scaled[0].toFixed(2)},${-1 * scaled[1].toFixed(2)})`;
  });

  console.log(formatted);
  return formatted;
}

/**
 * Computes the type of a given state 
 * @param {Object} state
 * @returns {String} tikz labels for the type of state
 */
function getStateType(state) {
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
  let distance = 2;
  switch(type) {
    case "PDA":
    case "Turing":
      distance = 5;
      break;
    default:
      distance = 2;
  }

  let output = `\\begin{tikzpicture}[->,>=stealth\',shorten >=1pt, auto, node distance=${distance}cm, semithick]\n`;
  output += '\\tikzstyle{every state}=[text=black, fill=none]\n';

  // initializing nodes
  let states = Object.values(graph);
  states.sort((a,b) => a.x - b.x); // sorts the states from left to right

  let statePositions = compressPlanar(states, distance);

  let start = states[0];
  let inner = getStateType(start);
  //output += `\\node[${inner}] (${start.name}) at (0,0) {$${start.name}$};\n`; // start as (0,0)

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