import * as util from './util.js';

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

// copied over code from previous implementation
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
            if (currChar != OPEN && currChar != UNION
                && currChar != CONCAT && nextChar != CLOSE
                && nextChar != UNION && nextChar != KLEENE
                && nextChar != PLUS && nextChar != CONCAT)
            {
                result += CONCAT;
            }
        }
    }
    return result;
}

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

function testUnion() {
  let start1 = util.createNode('start1', true, false, {} );
  let end1 = util.createNode('end1', false, true, {} );
  util.addTransition(start1, end1, '\u03A3');
  
  let graph1 = new Array(start1, end1);

  let start2 = util.createNode('start2', true, false, {} );
  let end2 = util.createNode('end2', false, true, {} );
  util.addTransition(start2, end2, "B");
  let graph2 = new Array(start2, end2);

  let result = util.union(graph1, graph2);

  console.log(JSON.stringify(result));
  //console.log(result);
}

//testUnion();
console.log(injectConcatSymbols("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+"b"));
console.log(injectConcatSymbols("abc"+UNION+"de"));

//console.log(this.convertToPostFix("a"+CONCAT+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+CONCAT+"b"));

// plus is union, ? is concat


// convert regex to postfix notation using shunting yard algorithm
// convert to nfa using thompson's construction algorithm for NFAs

// since we already have code for building NFAs, we can use that
// also already have a string testing feature for NFAs, can use that to test the regular expression