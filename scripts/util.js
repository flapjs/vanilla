/** @module util */
export const OPEN = '(';
export const CLOSE = ')';
export const UNION = '\u222A';
export const CONCAT = '\u25E6';
export const KLEENE = '*';
export const PLUS = '\u207A';

export const EMPTY = '\u03B5';
export const SIGMA = '\u03A3';
export const EMPTY_SET = '\u2205';

import * as graph_components from './graph_components.js';
import { create_edge } from './graph_ops.js';


export class Queue {
  constructor() {
    this.arr = [];
    this.head_idx = 0;
    this.tail_idx = 0;
  }
  enqueue(item) {
    this.arr[this.tail_idx++] = item; 
  }
  front() {
    return this.arr[this.head_idx]; 
  }
  dequeue() {
    const val = this.arr[this.head_idx];
    if (val) {
      delete this.arr[this.head_idx++]; 
    }
    return val;
  }
  get entire_queue() {
    return this.arr.slice(this.head_idx, this.tail_idx-this.head_idx);
  }
  get length() {
    return this.tail_idx - this.head_idx; 
  }
}

export class Stack {
  constructor() {
    this.arr = [];
    //this.top_idx = 0;
  }
  push(item) {
    this.arr.push(item); 
  }
  peek() {
    return this.arr[this.arr.length - 1];
  }
  pop() {
    return this.arr.pop();
  }
  // get entire_queue() {
  //   return this.arr.slice(this.head_idx, this.tail_idx-this.head_idx);
  // }
  isEmpty() {
    return this.arr.length === 0;
  }
  get length() {
    return this.arr.length;
  }
}

/*
export class RegexNode {

  //Member variables 
  //accept: boolean whether node is an accept state or not
  //inputs: Dictionary where key:input character, value:List of connecting nodes
  constructor() {
    this.accept = false;
    this.inputs = {};
  }

  setAccept(val) {
    this.accept = val;
  }

  // just for debugging/printing purposes to identify node
  setId(id) {
    this.id = id;
  }

  // Return list of nodes connecting when given @input
  nodesFromInput(input) {
    return this.inputs[input];
  }

  // Add @node as connecting node when given @input
  addNode(input, node) {
    if (!(input in this.inputs) ) {
      this.inputs[input] = [];
    }

    this.inputs[input].push(node);
    
  }

}*/

export class RegexNFA {

  // Member Variables
  // start: Node to start at
  // acceptNodes: List of nodes that are accept state nodes.
  constructor(startNode, acceptNodes) {
    this.start = startNode;
    this.acceptNodes = acceptNodes;
  }

  get startNode() {
    return this.start;
  }

  get acceptNodes() {
    return this.acceptNodes;
  }
  
}

// is start: bool
// is final: bool
// out: dict, key is transition symbol, value is list of Nodes to connect to
export function createNode(name, is_start, is_final, out) {
  return {
    name: name,
    is_start: is_start,
    is_final: is_final,
    out: out
  };
}

// node1: start node
// node2: end node
// symbol: transition symbol as a string
export function addTransition(node1, node2, symbol) {
  if (!(symbol in node1.out)) {
    node1.out[symbol] = new Array(node2);
  }
  else {
    node1.out[String(symbol)].push(node2);
  }
}

// graph: list of Nodes in the graph
export function getStartNode(graph) {
  for (let node of graph) {
    if (node.is_start) return node;
  }
}

// graph: list of Nodes in the graph
export function getAcceptNodes(graph) {
  let result = new Array();
  for (let node of graph) {
    if (node.is_final) result.push(node);
  }
  return result;
}

// first: lsit of nodes, graph 1
// second: list of nodes, graph 2
export function union(first, second) {
  let start = createNode('union start', true, false, {} );
  let accept = createNode('union accept', false, true, {} );
  
  let firstStart = getStartNode(first);
  firstStart.is_start = false;
  addTransition(start, firstStart, EMPTY);
  
  let secondStart = getStartNode(second);
  secondStart.is_start = false;
  addTransition(start, secondStart, EMPTY);

  for (let node of getAcceptNodes(first)) {
    node.is_final = false;
    addTransition(node, accept, EMPTY);
  }

  for (let node of getAcceptNodes(second)) {
    node.is_final = false;
    addTransition(node, accept, EMPTY);
  }

  for (let node of second) {
    first.push(node);
  }

  first.push(start);
  first.push(accept);

  return first;
  
}

export function concat(first, second) {
  let secondStart = getStartNode(second);
  secondStart.is_start = false;
  for (let node of getAcceptNodes(first)) {
    node.is_final = false;
    addTransition(node, secondStart, EMPTY);
  }

  for (let node of second) {
    first.push(node);
  }

  return first;
}

export function kleene(first) {
  let start = getStartNode(first);
  start.is_start = false;
  let acceptNodes = getAcceptNodes(first);
  
  let newStart = createNode('kleene start', true, false, {});
  let newAccept = createNode('kleene accept', false, true, {});

  addTransition(newStart, start, EMPTY);
  addTransition(newStart, newAccept, EMPTY);
  for (let node of acceptNodes) {
    node.is_final = false;
    addTransition(node, start, EMPTY);
    addTransition(node, newAccept, EMPTY);
  }

  first.push(newStart);
  first.push(newAccept);
  return first;
}

export function createNFA(symbol) {
  let start = createNode("st " + symbol, true, false, {});
  let end = createNode("accept" + symbol, false, true, {});
  
  addTransition(start, end, symbol);
  
  return new Array(start, end);
}

// returns NFA given postfix regex string
export function thompson(regex) {
  let stack = new Stack();
  for (let char of regex) {
    // case 1: character
    if (char.match(/[a-z]/i) || char === EMPTY) {
      let NFA = createNFA(char);
      stack.push(NFA);
    }
    // case 2: union
    else if (char === UNION) {
      let second = stack.pop();
      let first = stack.pop();
      let NFA = union(first, second);
      stack.push(NFA);
    }
    // case 3: concat
    else if (char === CONCAT) {
      let second = stack.pop();
      let first = stack.pop();
      let NFA = concat(first, second);
      stack.push(NFA);
    }
    // case 4: kl
    else if (char === KLEENE) {
      let first = stack.pop();

      let NFA = kleene(first);
      stack.push(NFA);
    }
    // all other cases
    else {
      //unknown character, error
    }
  }

  return stack.pop();
}


// Given an NFA (List of Nodes), currentState Node, and String where current input is at index 0
export function validateString(NFA, currentState, string) {
  // if empty string, check if current state is final and check all epsilon transitions
  if (string.length == 0) {
    if (currentState.is_final) return true;
    if (!currentState.out.hasOwnProperty(EMPTY) ) return false;
    for (let neighbor of currentState.out[EMPTY]) {
      if (validateString(NFA, neighbor, string ) ) return true;
    }
    return false;
  }
  // input
  let symbol = string.charAt(0);

  // check all epsilon transitions first
  if (currentState.out.hasOwnProperty(EMPTY) ) {
    for (let neighbor of currentState.out[EMPTY]) {
      if (validateString(NFA, neighbor, string ) ) return true;
    }
  }

  // check all transitions with current input symbol
  if (currentState.out.hasOwnProperty(symbol)) {
    for (let neighbor of currentState.out[symbol]) {
      if (validateString(NFA, neighbor, string.substring(1) ) ) return true;
    }
  }

  return returnVal;
}
// converts a NFA in our format to a graph in other format
export function convertToDrawing(nfa) {

  let graph = {};

  let i = 0;
  for (let node of nfa) {
    let vertex = graph_components.make_vertex("q" + i, 488, 788, 0, node.is_start, node.is_final, new Array() );
    graph["q"+i] = vertex;
    i++;
  }

  i = 0;
  for (let node of nfa) {
    let vertex = graph["q"+i];
    for (let symbol in node.out) {
      for (let neighbor of node.out[symbol]) {
        let neighborIndex = nfa.indexOf(neighbor);
        let edge = graph_components.make_edge_temp("q"+i, "q"+neighborIndex, symbol, 0, 0, 0, 0, EMPTY, EMPTY, EMPTY);
        vertex.out.push(edge);
      }
    }
    i++;
  }

  return ['NFA', graph];
}



// export function concatNFA(first, second) {
//   for (let node of first.acceptNodes()) {
//     node.is_final = false;
//     node.out.push(graph_components.make_edge(node, second.startNode(), EMPTY));
//   }

//   return new RegexNFA(first.startNode(), second.acceptNodes());
// }

// export function kleeneNFA(first) {
//   let start = graph_components.make_vertex("start", undefined, undefined, undefined, true, false, new Array() );
//   let accept = graph_components.make_vertex("end", undefined, undefined, undefined, false, true, new Array() );

//   start.out.push( graph_components.make_edge(start, first.startNode(), EMPTY) );
//   start.out.push( graph_components.make_edge(start, accept, EMPTY) );

//   for (let node of first.acceptNodes()) {
//     node.out.push( graph_components.make_edge(node, first.startNode(), EMPTY) );
//     node.out.push( graph_components.make_edge(node, accept, EMPTY) );
//   }
// }

/**
 * compare the equality of the two objects
 * @param {string|number|Object} obj1 - object 1
 * @param {string|number|Object} obj2 - object 2
 * @returns {boolean} true iff equal
 */
export function deep_equal(obj1, obj2) {
  if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1), keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {  // key length doesn't match
    return false;
  }
  for (const key of keys1) {
    if (!deep_equal(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}
