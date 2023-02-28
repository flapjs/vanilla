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

// Union two NFA's
// Creates a start node that has epsilon transitions to start nodes of @first and @second
// and creates epsilon transitions from accept nodes of @first and @second to a new accept node
// Returns newly created NFA
export function unionNFA(first, second) {

  let start = graph_components.make_vertex("start", undefined, undefined, undefined, true, false, new Array() );
  let accept = graph_components.make_vertex("end", undefined, undefined, undefined, false, true, new Array() );

  start.out.push( graph_components.make_edge(start, first.startNode(), EMPTY) );
  start.out.push( graph_components.make_edge(start, second.startNode(), EMPTY) );
  
  for (let node of first.acceptNodes()) {
    node.is_final = false;
    node.out.push( graph_components.make_edge(node, accept, EMPTY) );
  }

  for (let node of second.acceptNodes()) {
    node.is_final = false;
    node.out.push( graph_components.make_edge(node, accept, EMPTY) );
  }

  return new RegexNFA(start, new Array(accept) );
}

export function concatNFA(first, second) {
  for (let node of first.acceptNodes()) {
    node.is_final = false;
    node.out.push(graph_components.make_edge(node, second.startNode(), EMPTY));
  }

  return new RegexNFA(first.startNode(), second.acceptNodes());
}

export function kleeneNFA(first) {
  let start = graph_components.make_vertex("start", undefined, undefined, undefined, true, false, new Array() );
  let accept = graph_components.make_vertex("end", undefined, undefined, undefined, false, true, new Array() );

  start.out.push( graph_components.make_edge(start, first.startNode(), EMPTY) );
  start.out.push( graph_components.make_edge(start, accept, EMPTY) );

  for (let node of first.acceptNodes()) {
    node.out.push( graph_components.make_edge(node, first.startNode(), EMPTY) );
    node.out.push( graph_components.make_edge(node, accept, EMPTY) );
  }
}

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
