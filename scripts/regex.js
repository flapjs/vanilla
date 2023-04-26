/** @module regex */

import * as util from './util.js';
import * as permalink from './permalink.js';
import * as consts from './consts.js';
import * as graph_components from './graph_components.js';

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
      while (getPrecendence(stack.peek()) >= getPrecendence(ch)) {
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


export function union(graph1, graph2) {
  let graph = {};
  graph["q0"] = graph_components.make_vertex("q0", 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);

  let copy1 = {};
  let copy2 = {};

  let graph1start = "";
  let graph2start = "";

  // rename all nodes in graph1
  for (let node of Object.keys(graph1)) {
    // add a check for if the new name is already in the graph
    let new_name = node + ",1";
    if (new_name in graph1) {
      new_name = new_name + ",n";
    }

    copy1[new_name] = graph1[node];
    copy1[new_name].name = new_name;
    // delete graph1[node];

    // rename edges
    for (const inner of Object.values(copy1)) {
      for (const edge of inner.out) {
        if (edge.from === node) {
          edge.from = new_name;
        }
        if (edge.to === node) {
          edge.to = new_name;
        }
      }
    }

    // check if current node is graph1's start node
    if (copy1[new_name].is_start) {
      graph1start = new_name;
      copy1[new_name].is_start = false;
    }
  }

  // rename all nodes in graph2
  for (let node of Object.keys(graph2)) {
    let new_name = node + ",2";
    if (new_name in graph2) {
      new_name = new_name + ",n";
    }

    copy2[new_name] = graph2[node];
    copy2[new_name].name = new_name;
    delete graph2[node];

    // rename all edges
    for (const inner of Object.values(copy2)) {
      for (const edge of inner.out) {
        if (edge.from === node) {
          edge.from = new_name;
        }
        if (edge.to === node) {
          edge.to = new_name;
        }
      }
    }

    // check if current node is graph2's start node
    if (copy2[new_name].is_start) {
      graph2start = new_name;
      copy2[new_name].is_start = false;
    }
  }

  // add all nodes to new graph
  for (let node of Object.keys(copy1)) {
    graph[node] = copy1[node];
  }
  for (let node of Object.keys(copy2)) {
    graph[node] = copy2[node];
  }

  // add epsilon transitions from new start to old starts
  graph["q0"].out.push(graph_components.make_edge("q0", graph1start, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, 
                      consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
  graph["q0"].out.push(graph_components.make_edge("q0", graph2start, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, 
                      consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));

  return graph;
}

export function concat(graph1, graph2) {
  let graph1accept = [];
  let graph2start = "";

  let copy1 = {};
  let copy2 = {};

  // modify names of all nodes in graph1
  for (let node of Object.keys(graph1)) {
    let new_name = node + ",1";
    if (new_name in graph1) {
      new_name = new_name + ",n";
    }

    copy1[new_name] = graph1[node];
    copy1[new_name].name = new_name;
    // delete graph1[node];

    // rename all edges
    for (const inner of Object.values(copy1)) {
      for (const edge of inner.out) {
        if (edge.from === node) {
          edge.from = new_name;
        }
        if (edge.to === node) {
          edge.to = new_name;
        }
      }
    }

    // check if current node is an accept node for graph1
    if (copy1[new_name].is_final) {
      graph1accept.push(new_name);
      copy1[new_name].is_final = false;
    }
  }

  // modify names of all nodes in graph2
  for (let node of Object.keys(graph2)) {
    let new_name = node + ",2";
    if (new_name in graph2) {
      new_name = new_name + ",n";
    }

    copy2[new_name] = graph2[node];
    copy2[new_name].name = new_name;
    // delete graph2[node];

    // rename all edges
    for (const inner of Object.values(copy2)) {
      for (const edge of inner.out) {
        if (edge.from === node) {
          edge.from = new_name;
        }
        if (edge.to === node) {
          edge.to = new_name;
        }
      }
    }

    // check if current node is graph2's start node
    if (copy2[new_name].is_start) {
      graph2start = new_name;
      copy2[new_name].is_start = false;
    }
  }

  // add all nodes from graph1 and graph2 to a new graph
  let graph = {};
  for (let node of Object.keys(copy1)) {
    graph[node] = copy1[node];
  }
  for (let node of Object.keys(copy2)) {
    graph[node] = copy2[node];
  }

  // create edges from all accept nodes in graph1 to the start node in graph2
  for (let node of graph1accept) {
    graph[node].out.push(graph_components.make_edge(node, graph2start, consts.EMPTY_SYMBOL, 
                        0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
  }

  return graph;
}

export function kleene(graph) {
  // make new start and end states
  graph["new start"] = graph_components.make_vertex("new start", 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);
  graph["new end"] = graph_components.make_vertex("new end", 1000, 300, consts.DEFAULT_VERTEX_RADIUS, false, true, []);

  graph["new start"].out.push(graph_components.make_edge("new start", "new end", consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));

  let oldStart = "";

  for (let node of Object.keys(graph)) {
    // for each start state in original graph, create an edge from new start state to original start state
    // set node to not be a start state
    if (graph[node].is_start && node !== "new start") {
      oldStart = node;
      graph[node].is_start = false;
      graph["new start"].out.push(graph_components.make_edge("new start", node, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
    }
    // for each accept state in original graph, create an edge from that node to new accept state
    // set each node to not be an accept state
    if (graph[node].is_final && node !== "new end") {
      graph[node].is_final = false;
      graph[node].out.push(graph_components.make_edge(node, oldStart, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
      graph[node].out.push(graph_components.make_edge(node, "new end", consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
    }
  }

  return graph;
}

function single_transition(char) {
  let graph = {};
  graph["q0"] = graph_components.make_vertex("q0", 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);
  graph["q1"] = graph_components.make_vertex("q1", 300, 300, consts.DEFAULT_VERTEX_RADIUS, false, true, []);

  graph["q0"].out.push(graph_components.make_edge("q0", "q1", char, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));

  return graph;
}

export function thompson(regex) {
  // stack of NFA pieces
  let stack = new util.Stack();

  for (let c of regex) {
    if (c.match(/[a-z]/i) || c === consts.EMPTY) {
      // make graph of single vertex
      stack.push(single_transition(c));
    }
    else if (c === consts.UNION) {
      let g2 = stack.pop();
      let g1 = stack.pop();

      let res = union(g1, g2);

      stack.push(res);
    }
    else if (c === consts.CONCAT) {
      let g2 = stack.pop();
      let g1 = stack.pop();

      let res = concat(g1, g2);

      stack.push(res);
    }
    else if (c === consts.KLEENE) {
      let g = stack.pop();

      let res = kleene(g);

      stack.push(res);
    }
  }
  return stack.pop();
}

function test() {
  let graph1 = permalink.deserialize('NFAq0:321:500:40:1;q1:319:902:40:2;q2:539:934:40:2;0:1:aεεR:5:0:-1:29~0:2:bεεR:5:0:2:29~');
  let graph2 = permalink.deserialize('NFAq0:309:584:40:1;q1:363:1056:40:0;q2:381:1450:40:2;0:1:cεεR:5:0:2:27~1:2:dεεR:5:0:-4:-28~');

  // const kleene_result = kleene(graph1[1]);
  // const union_result = union(graph1[1], graph2[1]);
  // const concat_result = concat(graph1[1], graph2[1]);

  // console.log(kleene_result);
  // console.log(union_result);
  // console.log(concat_result);

  let graph3 = permalink.deserialize("NFAq0:300:300:40:1;q0,1:321:500:40:0;q1,1:319:902:40:2;q2,1:539:934:40:2;q0,2:309:584:40:0;q1,2:363:1056:40:0;q2,2:381:1450:40:2;0:1:εεεε:0:0:0:0~0:4:εεεε:0:0:0:0~1:2:aεεR:5:0:-1:29~1:3:bεεR:5:0:2:29~4:5:cεεR:5:0:2:27~5:6:dεεR:5:0:-4:-28~");
  const asdf = concat(graph3[1], graph1[1]);
  console.log(JSON.stringify(asdf));
  console.log(permalink.serialize(graph3[0], asdf));
}

//test();

function regexTest(regex) {
  let injectedConcat = injectConcatSymbols(regex);
  console.log(injectedConcat);
  let postfix = shunting_yard(injectedConcat);
  console.log(postfix);
  let finalGraph = thompson(postfix);

  console.log(JSON.stringify(finalGraph));
  // console.log(permalink.serialize('NFA', finalGraph))

}

//regexTest("a(a+b)*b")
regexTest("a"+consts.OPEN+"a"+consts.UNION+"b"+consts.CLOSE+consts.KLEENE+"b");

function scratchTest() {
  let a = union(single_transition('a'), single_transition('b'));
  console.log(permalink.serialize('NFA', a));
}

// scratchTest();