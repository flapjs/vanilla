/** @module regex */

import * as util from './util.js';
import * as consts from './consts.js';
import * as graph_components from './graph_components.js';
import * as graph_ops from './graph_ops.js';

/**
 * inserts omitted concatenation symbols in regular expression
 * @param {string} expressionString - the string to inject concatenation symbols in
 * @returns {string} the string with concatenation symbols inserted
 */
export function injectConcatSymbols(expressionString) {
  let result = '';
  for (let i = 0; i < expressionString.length; i++) {
    let currChar = expressionString.charAt(i);
    result += currChar;
    if (i + 1 < expressionString.length) {
      let nextChar = expressionString.charAt(i + 1);
      if (currChar != consts.OPEN && currChar != consts.UNION
                && currChar != consts.CONCAT && nextChar != consts.CLOSE
                && nextChar != consts.UNION && nextChar != consts.KLEENE
                && nextChar != consts.PLUS && nextChar != consts.CONCAT) {
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
    if (ch.match(/[a-zA-Z0-9]/i) || ch === consts.EMPTY || ch === consts.SIGMA) {
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
  let result = '';
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
  graph['q0'] = graph_components.make_vertex('q0', 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);

  let graph1start = '';
  let graph2start = '';

  // rename all nodes in graph1
  for (let node of Object.keys(graph1)) {
    // add a check for if the new name is already in the graph
    let new_name = node + ',1';
    if (new_name in graph1) {
      new_name = new_name + ',n';
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
    let new_name = node + ',2';
    if (new_name in graph2) {
      new_name = new_name + ',n';
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
  graph['q0'].out.push(graph_components.make_edge('q0', graph1start, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, 
    consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
  graph['q0'].out.push(graph_components.make_edge('q0', graph2start, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, 
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
  let graph2start = '';

  // modify names of all nodes in graph1
  for (let node of Object.keys(graph1)) {
    let new_name = node + ',1';
    if (new_name in graph1) {
      new_name = new_name + ',n';
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
    let new_name = node + ',2';
    if (new_name in graph2) {
      new_name = new_name + ',n';
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
  graph['new start'] = graph_components.make_vertex('new start', 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);
  graph['new end'] = graph_components.make_vertex('new end', 1000, 300, consts.DEFAULT_VERTEX_RADIUS, false, true, []);

  graph['new start'].out.push(graph_components.make_edge('new start', 'new end', consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));

  let oldStart = '';

  for (let node of Object.keys(graph)) {
    // for each start state in original graph, create an edge from new start state to original start state
    // set node to not be a start state
    if (graph[node].is_start && node !== 'new start') {
      oldStart = node;
      graph[node].is_start = false;
      graph['new start'].out.push(graph_components.make_edge('new start', node, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
    }
    // for each accept state in original graph, create an edge from that node to new accept state
    // set each node to not be an accept state
    if (graph[node].is_final && node !== 'new end') {
      graph[node].is_final = false;
      graph[node].out.push(graph_components.make_edge(node, oldStart, consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
      graph[node].out.push(graph_components.make_edge(node, 'new end', consts.EMPTY_SYMBOL, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));
    }
  }

  return graph;
}

function single_transition(char) {
  let graph = {};
  graph['q0'] = graph_components.make_vertex('q0', 300, 300, consts.DEFAULT_VERTEX_RADIUS, true, false, []);
  graph['q1'] = graph_components.make_vertex('q1', 300, 300, consts.DEFAULT_VERTEX_RADIUS, false, true, []);

  graph['q0'].out.push(graph_components.make_edge('q0', 'q1', char, 0.5, 0, 0, 0, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL, consts.EMPTY_SYMBOL));

  return graph;
}

export function thompson(regex) {
  // stack of NFA pieces
  let stack = new util.Stack();

  for (let c of regex) {
    if (c.match(/[a-zA-Z0-9]/i) || c === consts.EMPTY || c === consts.SIGMA) {
      // make graph of single vertex
      stack.push(single_transition(c));
    } else if (c === consts.UNION) {
      let g2 = stack.pop();
      let g1 = stack.pop();

      let res = union(g1, g2);

      stack.push(res);
    } else if (c === consts.CONCAT) {
      let g2 = stack.pop();
      let g1 = stack.pop();

      let res = concat(g1, g2);      

      stack.push(res);
    } else if (c === consts.KLEENE) {
      let g = stack.pop();

      let res = kleene(g);

      stack.push(res);
    }
  }
  return stack.pop();
}

export function create_buttons() {
  let input_field = document.getElementById('regex_string');

  const insertChar = (char) => {
    if (input_field.selectionStart || input_field.selectionStart == '0') {
      var startPos = input_field.selectionStart;
      var endPos = input_field.selectionEnd;
      input_field.value = input_field.value.substring(0, startPos)
          + char
          + input_field.value.substring(endPos, input_field.value.length);
    } else {
      input_field.value += char;
    }
  };

  const setCaretPosition = (ctrl, pos) => {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);
    
    // IE8 and below
    } else if (ctrl.createTextRange) {
      var range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  };

  let open_btn = document.getElementById('OPEN');
  open_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.OPEN);
    setCaretPosition(input_field, idx);
  });
  let close_btn = document.getElementById('CLOSE');
  close_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.CLOSE);
    setCaretPosition(input_field, idx);
  });
  let union_btn = document.getElementById('UNION');
  union_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.UNION);
    setCaretPosition(input_field, idx);
  });
  let concat_btn = document.getElementById('CONCAT');
  concat_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.CONCAT);
    setCaretPosition(input_field, idx);
  });
  let kleene_btn = document.getElementById('KLEENE');
  kleene_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.KLEENE);
    setCaretPosition(input_field, idx);
  });
  // const plus_btn = document.getElementById('PLUS');
  let sigma_btn = document.getElementById('SIGMA');
  sigma_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.SIGMA);
    setCaretPosition(input_field, idx);
  });
  let empty_btn = document.getElementById('EMPTY_SET');
  empty_btn.addEventListener('click', () => {
    const idx = input_field.selectionStart + 1;
    insertChar(consts.EMPTY_SET);
    setCaretPosition(input_field, idx);
  });
}

// add function to check for valid regex string
// 4. check for valid character, instant reject for non valid characters
// 5. handle case with empty set

// function taken from https://github.com/flapjs/webapp/blob/master/src/modules/re/machine/RegularExpression.js
export function areParenthesisBalanced(expressionString)
{
    let count = 0;
    for (let i = 0; i < expressionString.length; i++)
    {
        let symbol = expressionString.charAt(i);

        if (symbol == OPEN) count++;
        else if (symbol == CLOSE) count--;

        if (count < 0) return false;
    }
    return count == 0;
}

export function isValidRegex(string) {
  // remove spaces from input string
  string = string.replace(/\s+/g, '');

  // check for invalid parentheses and empty string
  if (!areParenthesisBalanced(string) || string === "") {
    return false;
  }
  let prev;

  for (const char of string) {
    // first character of string
    if (prev === undefined) {
      prev = char;
    }

    // check case that we have two operators in a row
    if ((char === consts.UNION || char === consts.KLEENE || char === consts.CONCAT) 
        && 
        (prev === consts.UNION || prev === consts.KLEENE || prev === consts.CONCAT)
      ) {
        return false;
      }

    prev = char;
  }

  return true;
}

export function process_string(string) {
  let injectedConcat = injectConcatSymbols(string);
  let postfix = shunting_yard(injectedConcat);
  let finalGraph = thompson(postfix);

  return finalGraph
}
