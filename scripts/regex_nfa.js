import { Queue, Stack } from './util.js';

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

class regex 
{
  constructor() {
    
  }
  convertToPostFix(regex) {
    let opStack = new Stack();
    let outQueue = new Queue();
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
}

let test = new regex();
console.log(test.convertToPostFix("a"+CONCAT+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+CONCAT+"b"));

// plus is union, ? is concat

// convert regex to postfix notation using shunting yard algorithm
// convert to nfa using thompson's construction algorithm for NFAs

// since we already have code for building NFAs, we can use that
// also already have a string testing feature for NFAs, can use that to test the regular expression