import * as util from './util.js';
import * as graph_components from './graph_components.js';
import * as permalink from './permalink.js';

export const OPEN = '(';
export const CLOSE = ')';
export const UNION = '\u222A';
export const CONCAT = '\u25E6';
export const KLEENE = '*';
export const PLUS = '\u207A';

export const EMPTY = '\u03B5';
export const SIGMA = '\u03A3';
export const EMPTY_SET = '\u2205';

export const PRECEDENCE = [UNION, CONCAT, KLEENE, PLUS];

export function convertToPostFix(regex) {
  let opStack = new util.Stack();
  let outQueue = new util.Queue();
  for (let ch of regex) {
    //console.log(ch + " " + opStack.peek());
    // i means case insensitive
    if (ch.match(/[a-z]/i)) {
      outQueue.enqueue(ch);
    }
    else if ((ch === KLEENE || ch ===  CONCAT || ch === UNION || ch === PLUS) && opStack.peek() === OPEN)  {
      opStack.push(ch);
    }
    else if (ch === KLEENE || ch ===  CONCAT || ch === UNION || ch === PLUS) {
      while (!opStack.isEmpty() && PRECEDENCE.indexOf(opStack.peek()) >= PRECEDENCE.indexOf(ch) ) {
        outQueue.enqueue(opStack.pop());
      }
      opStack.push(ch);
    }
    else if (ch === OPEN) {
      opStack.push(ch);
    }
    else if (ch === CLOSE) {
      while (!opStack.isEmpty() && opStack.peek() !== OPEN) {
        outQueue.enqueue(opStack.pop());
      }
      opStack.pop();
    }
  }
  
  // empty out remaining items from stack
  while (!opStack.isEmpty()) {
    outQueue.enqueue(opStack.pop());
  }

  let result = "";
  while (outQueue.length > 0) {
    result += outQueue.dequeue();
  }

  return result;
}


console.log(this.convertToPostFix("a"+CONCAT+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+CONCAT+"b"));


function testUnion(str1, str2) {
  let decode1 = permalink.deserialize(str1)[1];
  let decode2 = permalink.deserialize(str2)[1];

  let firstNFAStartNode;
  let firstNFAAcceptNodes = new Array();
  for (node in decode1) {
    if (node.is_start) firstNFAStartNode = node;
    if (node.is_final) firstNFAAcceptNodes.push(node);
  }
  let firstNFA = new RegexNFA(firstNFAStartNode, firstNFAAcceptNodes);
  
}
startNode.push.out( graph_components.make_edge(start, first.startNode(), EMPTY) )

let graph1 = new RegexNFA(startNode, )

// plus is union, ? is concat


// convert regex to postfix notation using shunting yard algorithm
// convert to nfa using thompson's construction algorithm for NFAs

// since we already have code for building NFAs, we can use that
// also already have a string testing feature for NFAs, can use that to test the regular expression