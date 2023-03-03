import * as util from './util.js';
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
  let PRECEDENCE = [UNION, CONCAT, KLEENE, PLUS];

  let opStack = new util.Stack();
  let outQueue = new util.Queue();
  for (let ch of regex) {
    // case if ch is an alphanumeric character or epsilon
    if (ch.match(/[a-z]/i) || ch === EMPTY) {
      outQueue.enqueue(ch);
    }
    // case if ch is an operator and ( is on the top of the stack
    else if ((ch === KLEENE || ch ===  CONCAT || ch === UNION || ch === PLUS) && opStack.peek() === OPEN)  {
      opStack.push(ch);
    }
    // case if 
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
  
  let graph = util.convertToDrawing(result);
  console.log(permalink.serialize(graph[0], graph[1]) );

  //console.log(JSON.stringify(result));
  //console.log(result);
}
function testConcat() {
  let start1 = util.createNode('start1', true, false, {} );
  let end1 = util.createNode('end1', false, true, {} );
  util.addTransition(start1, end1, '\u03A3');
  
  let graph1 = new Array(start1, end1);

  let start2 = util.createNode('start2', true, false, {} );
  let end2 = util.createNode('end2', false, true, {} );
  util.addTransition(start2, end2, "B");
  let graph2 = new Array(start2, end2);

  let result = util.concat(graph1, graph2);
  
  let graph = util.convertToDrawing(result);
  console.log(permalink.serialize(graph[0], graph[1]) );

  //console.log(JSON.stringify(result));
  //console.log(result);
}

function testKleene() {  
  let graph1 = util.createNFA(a);

  let result = util.kleene(graph1);
  
  let graph = util.convertToDrawing(result);
  console.log(permalink.serialize(graph[0], graph[1]) );

  //console.log(JSON.stringify(result));
  //console.log(result);
}

function test(string) {
  string = injectConcatSymbols(string);
  string = convertToPostFix(string);
  let NFA = util.thompson(string);
  let graph = util.convertToDrawing(NFA);
  let link = permalink.serialize(graph[0], graph[1]);
  return link
}

//console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+"b"));
//console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE));
//console.log(testConcat());

console.log(convertToPostFix(EMPTY+UNION+"a"+KLEENE+"b"));

//testUnion();
// console.log(injectConcatSymbols("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+"b"));
// console.log(injectConcatSymbols("abc"+UNION+"de"));

//console.log(this.convertToPostFix("a"+CONCAT+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+CONCAT+"b"));

// plus is union, ? is concat


// convert regex to postfix notation using shunting yard algorithm
// convert to nfa using thompson's construction algorithm for NFAs

// since we already have code for building NFAs, we can use that
// also already have a string testing feature for NFAs, can use that to test the regular expression