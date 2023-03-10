import * as util from './util.js';
import * as permalink from './permalink.js';
import * as consts from './consts.js';
import * as graph_components from './graph_components.js';

let nameCount = 0;

/**
 * inserts omitted concatenation symbols in regular expression
 * @param {string} expressionString - the string to inject concatenation symbols in
 * @returns {string} the string with concatenation symbols inserted
 */
export function injectConcatSymbols(expressionString)
{
    let result = '';
    for (let i = 0; i < expressionString.length; i++)
    {
        let currChar = expressionString.charAt(i);
        result += currChar;
        if (i + 1 < expressionString.length)
        {
            let nextChar = expressionString.charAt(i + 1);
            if (currChar != consts.OPEN && currChar != consts.UNION
                && currChar != consts.CONCAT && nextChar != consts.CLOSE
                && nextChar != consts.UNION && nextChar != consts.KLEENE
                && nextChar != consts.PLUS && nextChar != consts.CONCAT)
            {
                result += consts.CONCAT;
            }
        }
    }
    return result;
}

/**
 * given an operator, gets the operator's precedence
 * @param {string} key - the operator to get the predecence of
 * @returns {Number} the predecence of the operator as an int
 */
export function getPrecendence(key) {
  switch (key) {
    case consts.KLEENE:
      return 3;
    case consts.CONCAT:
      return 2;
    case consts.UNION:
      return 1;
    default:
      return 0;         
  }
}

/**
 * applies the shunting-yard algorithm to convert regular expression to postfix notation
 * @param {string} string - the string to convert to postfix
 * @returns {string} the string in postfix notation
 */
export function shunting_yard(string) {
  let stack = new util.Stack();
  let queue = new util.Queue();

  for (let ch of string) {
    // case if ch is a character or epsilon
    if (ch.match(/[a-z]/i) || ch === consts.EMPTY) {
      queue.enqueue(ch);
    }
    // case if ch is an operator
    else if (ch === consts.UNION || ch === consts.KLEENE || ch === consts.CONCAT) {
      //while (precedence[stack.peek()] > precedence[ch]) {
      while (getPrecendence(stack.peek()) > getPrecendence(ch)) {
        queue.enqueue(stack.pop());
      }
      stack.push(ch);
    }
    // case if ch is (
    else if (ch === consts.OPEN) {
      stack.push(ch);
    }
    // case if ch is )
    else if (ch === consts.CLOSE) {
      while (stack.peek() != consts.OPEN) {
        queue.enqueue(stack.pop());
      }
      stack.pop();
    }
  }

  //empty remaining elements from stack
  while (!stack.isEmpty()) {
    queue.enqueue(stack.pop());
  }

  // put resulting string together
  let result = "";
  while (queue.length > 0) {
    result += queue.dequeue();
  }

  return result;
}

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

/**
 * creates a new vertex in the graph
 * @param {boolean} is_start - true if this vertex is the start state
 * @param {boolean} is_start - true if this vertex is an end state
 * @param {Object} out - dict where key is transition symbol, value is list of connected vertices
 * @returns {Object} the object representing the vertex
 */
export function createNode(is_start, is_final, out) {
  nameCount++;
  return {
    name: "q" + nameCount,
    is_start: is_start,
    is_final: is_final,
    out: out
  };
}

/**
 * creates a new edge from node1 to node2
 * @param {boolean} node1 - start vertex
 * @param {boolean} node2 - end vertex
 * @param {Object} symbol - transition symbol
 */
export function addTransition(node1, node2, symbol) {
  if (!(symbol in node1.out)) {
    node1.out[symbol] = new Array(node2);
  }
  else {
    node1.out[String(symbol)].push(node2);
  }
}

/**
 * Gets the start node from a graph
 * @param {Object} graph - list of vertices representing a graph
 * @returns the start node
 */
export function getStartNode(graph) {
  for (let node of graph) {
    if (node.is_start) return node;
  }
}

/**
 * Returns an array of accept nodes
 * @param {Object} graph - list of vertices representing a graph
 * @returns an Array of accept nodes
 */
export function getAcceptNodes(graph) {
  let result = new Array();
  for (let node of graph) {
    if (node.is_final) result.push(node);
  }
  return result;
}

/**
 * Applies the union operator on two graphs
 * @param {Object} first - the first graph
 * @param {Object} second - the second graph
 * @returns a new graph where it is a union of the two inputted graphs
 */
export function union(first, second) {
  let start = createNode(true, false, {} );
  let accept = createNode( false, true, {} );
  
  let firstStart = getStartNode(first);
  firstStart.is_start = false;
  addTransition(start, firstStart, consts.EMPTY);
  
  let secondStart = getStartNode(second);
  secondStart.is_start = false;
  addTransition(start, secondStart, consts.EMPTY);

  for (let node of getAcceptNodes(first)) {
    node.is_final = false;
    addTransition(node, accept, consts.EMPTY);
  }

  for (let node of getAcceptNodes(second)) {
    node.is_final = false;
    addTransition(node, accept, consts.EMPTY);
  }

  for (let node of second) {
    first.push(node);
  }

  first.push(start);
  first.push(accept);

  return first;
  
}

/**
 * Performs the concatenation operation on two graphs
 * @param {Object} first - the first graph
 * @param {Object} second - the second graph
 * @returns a new graph after performing the concatenation operation
 */
export function concat(first, second) {
  let secondStart = getStartNode(second);
  secondStart.is_start = false;
  let listOfNodes = getAcceptNodes(first);
  for (let node of listOfNodes) {
    node.is_final = false;
    addTransition(node, secondStart, consts.EMPTY);
  }

  for (let node of second) {
    first.push(node);
  }

  return first;
}

/**
 * performs the kleene star operation on a graph
 * @param {Object} first - the graph
 * @returns a new graph with the kleene star operation applied
 */
export function kleene(first) {
  let start = getStartNode(first);
  start.is_start = false;
  let acceptNodes = getAcceptNodes(first);
  
  let newStart = createNode(true, false, {});
  let newAccept = createNode(false, true, {});

  addTransition(newStart, start, consts.EMPTY);
  addTransition(newStart, newAccept, consts.EMPTY);
  for (let node of acceptNodes) {
    node.is_final = false;
    addTransition(node, start, consts.EMPTY);
    addTransition(node, newAccept, consts.EMPTY);
  }

  first.push(newStart);
  first.push(newAccept);
  return first;
}

/**
 * takes a symbol and converts it into an NFA - used to build intermediate NFAs
 * in Thompson's NFA algorithm
 * @param {string} symbol transition symbol
 * @returns a new NFA created from a single character
 */
export function createNFA(symbol) {
  let start = createNode(true, false, {});
  let end = createNode(false, true, {});
  addTransition(start, end, symbol);
  
  return new Array(start, end);
}

/**
 * Converts a regular expression in postfix notation into an NFA
 * @param {string} regex - the regular expression in postfix notation
 * @returns the regular expression's corresponding NFA
 */
export function thompson(regex) {
  let stack = new util.Stack();
  for (let char of regex) {
    // case 1: character
    if (char.match(/[a-z]/i) || char === consts.EMPTY) {
      let NFA = createNFA(char);
      stack.push(NFA);
    }
    // case 2: union
    else if (char === consts.UNION) {
      let second = stack.pop();
      let first = stack.pop();
      let NFA = union(first, second);
      stack.push(NFA);
    }
    // case 3: concat
    else if (char === consts.CONCAT) {
      let second = stack.pop();
      let first = stack.pop();
      let NFA = concat(first, second);
      stack.push(NFA);
    }
    // case 4: kleene
    else if (char === consts.KLEENE) {
      let first = stack.pop();

      let NFA = kleene(first);
      stack.push(NFA);
    }
    // all other cases
    else {
      //unknown character, error?
    }
  }

  return stack.pop();
}

/**
 * Converts the wrapper class NFA into the object representation used by the 
 * rest of the codebase
 * @param {Array} nfa Array of node objects representing an NFA
 * @returns the object representation of the NFA
 */
export function convertToDrawing(nfa) {
  let graph = {};

  let i = 0;
  for (let node of nfa) {
    //node.name = "q" + i;
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
        let edge = graph_components.make_edge("q"+i, "q"+neighborIndex, symbol, 0, 0, 0, 0, consts.EMPTY, consts.EMPTY, consts.EMPTY);
        vertex.out.push(edge);
      }
    }
    i++;
  }

  return ['NFA', graph];
}

// Given an NFA (List of Nodes), currentState Node, and String where current input is at index 0
export function validateString(NFA, currentState, string) {
  // if empty string, check if current state is final and check all epsilon transitions
  if (string.length == 0) {
    if (currentState.is_final) return true;
    if (!currentState.out.hasOwnProperty(consts.EMPTY) ) return false;
    for (let neighbor of currentState.out[consts.EMPTY]) {
      if (validateString(NFA, neighbor, string ) ) return true;
    }
    return false;
  }
  // input
  let symbol = string.charAt(0);

  // check all epsilon transitions first
  if (currentState.out.hasOwnProperty(consts.EMPTY) ) {
    for (let neighbor of currentState.out[consts.EMPTY]) {
      if (validateString(NFA, neighbor, string ) ) return true;
    }
  }

  // check all transitions with current input symbol
  if (currentState.out.hasOwnProperty(symbol)) {
    for (let neighbor of currentState.out[symbol]) {
      if (validateString(NFA, neighbor, string.substring(1) ) ) return true;
    }
  }

  return false;
}

export function test_input(NFA, input) {
  return compute.run_input(NFA, input);
}

function test(string) {
  string = injectConcatSymbols(string);
  string = shunting_yard(string);
  console.log("POST FIX: " + string);
  let NFA = thompson(string);
  
  //console.log(util2.inspect(NFA, {depth: 6 }) );
  //console.log(util2.inspect(NFA, ));

  let graph = convertToDrawing(NFA);
  let link = permalink.serialize(graph[0], graph[1]);
  return link
}

function testValidate() {
  let string = "a"+consts.OPEN+"a"+consts.UNION+"b"+consts.CLOSE+consts.KLEENE;
  string = injectConcatSymbols(string);
  string = shunting_yard(string);
  console.log("POST FIX: " + string);
  let NFA = util.thompson(string);
  
  let input = ["a", "aa", "ab", "ac", "aba", "abba", "abbbc"];
  let graph = util.convertToDrawing(NFA);
  let link = permalink.serialize(graph[0], graph[1]);
  console.log(link);
  let startNode = util.getStartNode(NFA);
  for (let i of input) {
    console.log("For input " + i + " returned " + util.validateString(NFA, startNode, i));
  }
  //console.log(util2.inspect(NFA, {depth: 4 }));
  // 
  //let graph = util.convertToDrawing(NFA);
  //let link = permalink.serialize(graph[0], graph[1]);
  //return link
}

function test_run_input() {
  let string = "a"+consts.OPEN+"a"+consts.UNION+"b"+consts.CLOSE+consts.KLEENE;
  string = injectConcatSymbols(string);
  string = shunting_yard(string);

  let NFA = util.thompson(string);
  NFA = util.convertToDrawing(NFA);

  console.log(NFA);

  return util.test_input(NFA[1], "abc");
}

console.log(test("a"+consts.OPEN+"a"+consts.UNION+"b"+consts.CLOSE+consts.KLEENE+"b"));
