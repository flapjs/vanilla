/** @module regex */

import * as util from './util.js';
import * as permalink from './permalink.js';
import * as consts from './consts.js';
import * as graph_components from './graph_components.js';
import * as graph_ops from './graph_ops.js';

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
    if (ch.match(/[a-z]/i) || ch === consts.EMPTY || ch === consts.SIGMA) {
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

/**
 * performs the union operation on two graphs
 * @param {string} graph1 - the first graph
 * @param {string} graph2 - the second graph
 * @returns {string} the new resulting graph of the union operation
 */
export function union(graph1, graph2) {
  let graph = {};
  graph["q0"] = graph_components.make_vertex("q0", 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);

  let graph1start = "";
  let graph2start = "";

  // rename all nodes in graph1
  for (let node of Object.keys(graph1)) {
    // add a check for if the new name is already in the graph
    let new_name = node + ",1";
    if (new_name in graph1) {
      new_name = new_name + ",n";
    }

    graph_ops.rename_vertex(graph1, node, new_name, true);

    // check if current node is graph1's start node
    if (graph1[new_name].is_start) {
      graph1start = new_name;
      graph1[new_name].is_start = false;
    }
  }

  // rename all nodes in graph2
  for (let node of Object.keys(graph2)) {
    let new_name = node + ",2";
    if (new_name in graph2) {
      new_name = new_name + ",n";
    }

    graph_ops.rename_vertex(graph2, node, new_name, true);

    // check if current node is graph2's start node
    if (graph2[new_name].is_start) {
      graph2start = new_name;
      graph2[new_name].is_start = false;
    }
  }

  // add all nodes to new graph
  for (let node of Object.keys(graph1)) {
    graph[node] = structuredClone(graph1[node]);
  }
  for (let node of Object.keys(graph2)) {
    graph[node] = structuredClone(graph2[node]);
  }

  // add epsilon transitions from new start to old starts
  graph["q0"].out.push(graph_components.make_edge("q0", graph1start, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, 
                      consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
  graph["q0"].out.push(graph_components.make_edge("q0", graph2start, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, 
                      consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));

  return graph;
}

/**
 * performs the concatenation operation on two graphs
 * @param {string} graph1 - the first graph
 * @param {string} graph2 - the second graph
 * @returns {string} the new resulting graph of the concatenation operation
 */
export function concat(graph1, graph2) {
  let graph1accept = [];
  let graph2start = "";

  // modify names of all nodes in graph1
  for (let node of Object.keys(graph1)) {
    let new_name = node + ",1";
    if (new_name in graph1) {
      new_name = new_name + ",n";
    }

    graph_ops.rename_vertex(graph1, node, new_name, true);

    // check if current node is an accept node for graph1
    if (graph1[new_name].is_final) {
      graph1accept.push(new_name);
      graph1[new_name].is_final = false;
    }
  }

  // modify names of all nodes in graph2
  for (let node of Object.keys(graph2)) {
    let new_name = node + ",2";
    if (new_name in graph2) {
      new_name = new_name + ",n";
    }

    graph_ops.rename_vertex(graph2, node, new_name, true);

    // check if current node is graph2's start node
    if (graph2[new_name].is_start) {
      graph2start = new_name;
      graph2[new_name].is_start = false;
    }
  }

  // add all nodes from graph1 and graph2 to a new graph
  let graph = {};
  for (let node of Object.keys(graph1)) {
    graph[node] = structuredClone(graph1[node]);
  }
  for (let node of Object.keys(graph2)) {
    graph[node] = structuredClone(graph2[node]);
  }

  // create edges from all accept nodes in graph1 to the start node in graph2
  for (let node of graph1accept) {
    graph[node].out.push(graph_components.make_edge(node, graph2start, consts.EMPTY_SYMBOL, 
                        0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
  }

  return graph;
}

/**
 * performs the union operation on two graphs
 * @param {string} graph - the graph
 * @returns {string} the new resulting graph of the kleene operation
 */
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
    if (c.match(/[a-z]/i) || c === consts.EMPTY || c === consts.SIGMA) {
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

export function create_buttons() {
  let input_field = document.getElementById('regex_string');

  let open_btn = document.getElementById('OPEN');
  open_btn.addEventListener('click', () => {
    input_field.value += consts.OPEN;
    input_field.focus();
  });
  let close_btn = document.getElementById('CLOSE');
  close_btn.addEventListener('click', () => {
    input_field.value += consts.CLOSE;
    input_field.focus();
  });
  let union_btn = document.getElementById('UNION');
  union_btn.addEventListener('click', () => {
    input_field.value += consts.UNION;
    input_field.focus();
  });
  let concat_btn = document.getElementById('CONCAT');
  concat_btn.addEventListener('click', () => {
    input_field.value += consts.CONCAT;
    input_field.focus();
  });
  let kleene_btn = document.getElementById('KLEENE');
  kleene_btn.addEventListener('click', () => {
    input_field.value += consts.KLEENE;
    input_field.focus();
  });
  // const plus_btn = document.getElementById('PLUS');
  let sigma_btn = document.getElementById('SIGMA');
  sigma_btn.addEventListener('click', () => {
    input_field.value += consts.SIGMA;
    input_field.focus();
  });
  let empty_btn = document.getElementById('EMPTY_SET');
  empty_btn.addEventListener('click', () => {
    input_field.value += consts.EMPTY_SET;
    input_field.focus();
  });

  let submit_btn = document.getElementById('regex_submit');
  submit_btn.addEventListener('click', () => {
    let result = process_string(input_field.value);
    console.log(result);
  });

  let convert = document.getElementById("convert_to_nfa");
  convert.addEventListener('click', () => {

  })

  return [input_field, open_btn, close_btn, union_btn, concat_btn, kleene_btn, sigma_btn, empty_btn, submit_btn, convert];
}

export function add_test_string() {

}

export function process_string(string) {
  let injectedConcat = injectConcatSymbols(string);
  let postfix = shunting_yard(injectedConcat);
  let finalGraph = thompson(postfix);

  return permalink.serialize('NFA', finalGraph)
}

function regexTest(regex) {
  let injectedConcat = injectConcatSymbols(regex);
  // console.log(injectedConcat);
  let postfix = shunting_yard(injectedConcat);
  // console.log(postfix);
  let finalGraph = thompson(postfix);

  // console.log(JSON.stringify(finalGraph));
  console.log(permalink.serialize('NFA', finalGraph))
}

// a(a∪b)*b
// last concat for the last b is broken still, no edge connecting it to the class
// regexTest("a"+consts.OPEN+"a"+consts.UNION+"b"+consts.CLOSE+consts.KLEENE+"b");

// (abc)*
// regexTest(consts.OPEN+"abc"+consts.CLOSE+consts.KLEENE)

// Σ*(bc)*
regexTest(consts.SIGMA+consts.KLEENE+consts.OPEN+"bc"+consts.CLOSE+consts.KLEENE)

// regexTest(consts.SIGMA)

// console.log(JSON.stringify(single_transition(consts.SIGMA)))

// regexTest("ab");
