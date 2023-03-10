import * as util from './util.js';
import * as util2 from 'util'
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

export function getPrecendence(key) {
  switch (key) {
    case KLEENE:
      return 3;
    case CONCAT:
      return 2;
    case UNION:
      return 1;
    default:
      return 0;         
  }
}
export function shunting_yard(string) {
  let precedence = {};
  precedence[KLEENE] = 3;
  precedence[CONCAT] = 2;
  precedence[UNION] = 1;
  

  let stack = new util.Stack();
  let queue = new util.Queue();

  for (let ch of string) {
    // case if ch is a character or epsilon
    if (ch.match(/[a-z]/i) || ch === EMPTY) {
      queue.enqueue(ch);
    }
    // case if ch is an operator
    else if (ch === UNION || ch === KLEENE || ch === CONCAT) {
      //while (precedence[stack.peek()] > precedence[ch]) {
      while (getPrecendence(stack.peek()) > getPrecendence(ch)) {
        queue.enqueue(stack.pop());
      }
      stack.push(ch);
    }
    // case if ch is (
    else if (ch === OPEN) {
      stack.push(ch);
    }
    // case if ch is )
    else if (ch === CLOSE) {
      while (stack.peek() != OPEN) {
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
  string = shunting_yard(string);
  console.log("POST FIX: " + string);
  let NFA = util.thompson(string);
  
  //console.log(util2.inspect(NFA, {depth: 6 }) );
  //console.log(util2.inspect(NFA, ));
  // 
  let graph = util.convertToDrawing(NFA);
  let link = permalink.serialize(graph[0], graph[1]);
  return link
}

function testValidate() {
  let string = "a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE;
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
  let string = "a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE;
  string = injectConcatSymbols(string);
  string = shunting_yard(string);

  let NFA = util.thompson(string);
  NFA = util.convertToDrawing(NFA);

  console.log(NFA);

  return util.test_input(NFA[1], "abc");
}


//console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+"b"));
//console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE));

//console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE));
//console.log(testConcat());

//console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE));
//testValidate();
//console.log(test_run_input());

//testUnion();
// console.log(injectConcatSymbols("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+"b"));
// console.log(injectConcatSymbols("abc"+UNION+"de"));

//console.log(this.convertToPostFix("a"+CONCAT+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+CONCAT+"b"));

function demo() {
  /**
   * process:
   * 1. inject concatenation symbols into input 
   * 2. use Shunting-Yard algorithm to convert input to postfix notation
   * 3. build the corresponding NFA using Thompson's NFA algorithm
   * 
   * From here, we have the corresponding NFA of the given regular expression, so:
   * We can test if a given string is in the language of the NFA
   * We can visualize the NFA as a drawing on the webpage
   * 
   * problems:
   * Our implementation of Thompson's NFA algorithm doesn't always generate the simplest NFA
   *    often has many extra epsilon transitions
   * When we draw the graph on the webpage, all the elements are stacked together
   *    this is another feature to be added in the future: auto graph layouts
   * Our implementation currently utilizes a wrapper class, which causes some duplicate code
   *    also introduces the issue of converting between our NFA class and the graph object used
   *    by the rest of the code base
   */

  console.log(test("a"+OPEN+"a"+UNION+"b"+CLOSE+KLEENE+"b"));
}

demo();