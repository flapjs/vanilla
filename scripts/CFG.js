/** @module CFG */

import * as consts from './consts.js';
import * as hist from './history.js';
import * as graph_components from './graph_components.js';

let div = document.createElement("DIV"); //Line divider

const list_of_rules = []; // Array that keeps track of symbols and their rules
const to_push_rules = {}; // Array that keeps track of symbols and their rules to push to history
let graph = consts.EMPTY_GRAPH;

const clear_to_reload = 0;
const clear_to_undo_redo = 1;
const clear_everything_mode = 2;

export function CFG_switch(){
  load_rules();
}

/**
 * make the basic vertices for the PDA that checks if the stack is empty by the end of the input
 */
function make_start_and_final_edges(){
  graph = consts.EMPTY_GRAPH;
  graph["final"] = graph_components.make_vertex("final", 3*consts.CFG_EDGE_X_DISTANCE + 50, 0, consts.DEFAULT_VERTEX_RADIUS, false, true);
  graph["loop"] = graph_components.make_vertex("loop", 2*consts.CFG_EDGE_X_DISTANCE + 50, 0, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                  [graph_components.make_edge("loop", "final", undefined, undefined, undefined, undefined,
                  undefined, "$", undefined, undefined)]);

  graph["push$"] = graph_components.make_vertex("push$", consts.CFG_EDGE_X_DISTANCE + 50, 0, consts.DEFAULT_VERTEX_RADIUS, false, false);
  graph["start"] = graph_components.make_vertex("start", 50, 0, consts.DEFAULT_VERTEX_RADIUS, true, false, 
                  [graph_components.make_edge("start", "push$", undefined, undefined, undefined, undefined,
                  undefined, undefined, "$")]);
}

/**
 * Creates the elements that will be used to create/delete rules
 * @returns [plus_btn, minus_btn, symbol_input, rule_input] - [Plus button, Minus button, Symbol Input Box, Rule Input Box]
 */
function create_text_elements(){
  let plus_btn = document.createElement("button");
  plus_btn.id = "Add rule";
  plus_btn.textContent = " + ";

  let minus_btn = document.createElement("button");
  minus_btn.id = "Delete rule";
  minus_btn.textContent = " - ";

  let symbol_input = document.createElement("Input");
  symbol_input.id = "Symbol" + (list_of_rules.length + 1);
  symbol_input.addEventListener("change",function () {
    load_rules();
  })

  let rule_input = document.createElement("Input");
  rule_input.id = "Rule " + 1;
  rule_input.value = consts.EMPTY_SYMBOL;
  rule_input.addEventListener("change",function () {
    load_rules();
  })
  return [plus_btn, minus_btn, symbol_input, rule_input];
}

/** 
 * add the symbol input box, the rule input box, and buttons to add/delete input box
 */
export function create_rule(){
  let [plus_btn, minus_btn, symbol_input, rule_input] = create_text_elements();
  let list = document.querySelector('ul');
  let li = document.createElement('li');

  li.appendChild(symbol_input);
  li.append(document.createTextNode("→"));
  li.append(rule_input);

  let rule = {
    symbol : symbol_input,
    rules_list : [rule_input]
  }
  list_of_rules.push(rule);

  // Button to add a new rule input textbox
  plus_btn.addEventListener('click',() => {
    let new_rule_input = document.createElement("Input");
    new_rule_input.id = "Rule " + rule.rules_list.length;
    new_rule_input.value = consts.EMPTY_SYMBOL;
    new_rule_input.addEventListener("change",function () {
      load_rules();
    })
    // Remove "+ / -"
    for(let i = 0; i < 3; i++){li.removeChild(li.lastChild);}
    li.append(document.createTextNode(" | "));
    li.append(new_rule_input);
    rule.rules_list.push(new_rule_input);
    load_rules();
    add_btns(li, plus_btn, minus_btn);
  });

  // Button to remove last rule input textbox
  minus_btn.addEventListener('click',() => {
    // Remove "|", last text box, "+ / -"
    if(rule.rules_list.length > 1){
      for(let i = 0; i < 5; i++){li.removeChild(li.lastChild);}
      rule.rules_list.pop();
      add_btns(li, plus_btn, minus_btn);
    }
    load_rules();
  });
  add_btns(li, plus_btn, minus_btn);

  list.append(li);
  load_rules();
}

export function delete_rule(){
  let list = document.querySelector('ul');
    if(list_of_rules.length > 1){
      list.removeChild(list.lastChild);
      list_of_rules.pop();
    }
  load_rules();
}

export function submit_rules(){
  make_start_and_final_edges();
  let starting_symbol = document.getElementById("starting_symbol").value;
  graph["push$"].out.push(graph_components.make_edge("push$", "loop", undefined,
                          undefined, undefined, undefined, undefined, undefined, starting_symbol));
  const terminal_symbols = new Set();

  //Invalid input checking.
  for (let i = 0; i < list_of_rules.length; i++){
    if(list_of_rules[i].symbol.value.length != 1){
      alert("One of the terminal symbols input do not have 1 character");
      return;
    }
    terminal_symbols.add(list_of_rules[i].symbol.value);
  }
  if(!terminal_symbols.has(starting_symbol)){
    alert("Starting terminal symbol does not have a rule");
    return;
  }

  if(starting_symbol == ""){
    alert("No starting terminal symbol");
    return;
  }
  load_rules();
  create_edges(terminal_symbols);
}
/**
 * creates a graph using list_of_rules
 * @param {Set} terminal_symbols - keeps track of the symbols alphabet
 */
function create_edges(terminal_symbols){
  let index = 0; // Counter used to keep track of the new vertex's name
  let alphabet = new Set();
  let longest = 0; // Longest string to base x position of empty vertex
  let row = 0;

  for(let i = 0; i < list_of_rules.length; i++){
    let symbol = list_of_rules[i].symbol.value;
    let rules = list_of_rules[i].rules_list;
    for(let r   = 0; r < rules.length; r++){
      let str = rules[r].value;
      index += str.length - 1;
      if (str.length > longest) {
        longest = str.length;
      }

      if(!alphabet.has(str[str.length-1]) && !terminal_symbols.has(str[str.length-1])){
        alphabet.add(str[str.length-1]);
      }
      if(str.length == 0){
        // Case where there is nothing/empty symbol
        continue;
      }else if (str.length == 1){
        // Case where string is length 1: self-loop
        graph["loop"].out.push(graph_components.make_edge("loop", "loop", undefined, undefined,
                                undefined, undefined, undefined, symbol, str[0], undefined));
      }else{
        // Case where string is greater than 1: create new vertexes and edges for every
        // char, and at the end make an edge back to loop vertex.

        // Last edge back to loop/First letter
        graph["q" + index] = graph_components.make_vertex("q" + index, 2*consts.CFG_EDGE_X_DISTANCE + str.length*consts.CFG_EDGE_X_DISTANCE,
                              consts.CFG_EDGE_Y_DISTANCE + row*consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                              [graph_components.make_edge("q" + index, "empty", undefined, undefined, undefined, undefined,
                              undefined, undefined, str[0])]);
        index--;

        // Create edges and vertexes until the second character in the string
        for(let i = 1; i < str.length; i++){
          graph["q" + index] = graph_components.make_vertex("q" + index,  2*consts.CFG_EDGE_X_DISTANCE + consts.CFG_EDGE_X_DISTANCE*(str.length - i),
                                consts.CFG_EDGE_Y_DISTANCE + row*consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                                [graph_components.make_edge("q" + index, "q" + (index + 1), undefined, undefined, undefined, undefined,
                              undefined, undefined, str[i])]);
          // Differentiate between terminal symbols and alphabet
          if(!alphabet.has(str[i]) && !terminal_symbols.has(str[i])){
            alphabet.add(str[i]);
          }
          index--;
        }
         // First edge back from loop/Last letter
        graph["loop"].out.push(graph_components.make_edge("loop", "q" + (index + 1), undefined, 0.5 + row*0.1, 1.7 + row*0.5,
                                undefined, undefined, symbol));

        if(!alphabet.has(str[0]) && !terminal_symbols.has(str[0])){
          alphabet.add(str[0]);
        }
        index += str.length + 1;
        row++;
      }
    }
  }
  let cnt = 1;
  // Add self-loops using the alphabet for the qloop vertex
  for(const l of alphabet.keys()){
    graph["loop"].out.push(graph_components.make_edge("loop", "loop", l, cnt*0.1 + 0.3,
                                -1 - cnt, -2.8, -1.1, l));
    cnt++;
  }
  graph["empty"] = graph_components.make_vertex("empty", (longest + 3)*consts.CFG_EDGE_X_DISTANCE, row/2 *consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false,
                                                [graph_components.make_edge("empty", "loop", undefined, 0.5, 8.55)]);
}

/**
 * returns the PDA based of the CFG that was last submitted 
 * @returns {object} graph
 */
export function get_graph(){
  submit_rules();
  return graph;
}

/**
 * Fill a symbol input with the symbol argument, and rules according to rules_list
 * @param {String} symbol 
 * @param {String[]} rules_list 
 */
function fill_rules(symbol, rules_list) {
  let list = document.querySelector('ul');
  let li = document.createElement('li');
  let rule_count = rules_list.length;

  let [plus_btn, minus_btn, symbol_input] = create_text_elements();
  symbol_input.value = symbol;

  li.appendChild(symbol_input);
  li.append(document.createTextNode("→"));

  let rule = {
    symbol : symbol_input,
    rules_list : []
  }

  for (let i = 1; i < rule_count + 1; i++) {
    let rule_input = document.createElement("Input");
    rule_input.id = "Rule " + i;
    rule_input.value = rules_list[i - 1];
    rule_input.addEventListener("change",function () {
      load_rules();
    })
    li.append(rule_input);
    rule.rules_list.push(rule_input);
    li.append(document.createTextNode(" | "));
  }
  list_of_rules.push(rule);
  li.removeChild(li.lastChild);

  // Button to add a rule input textbox
  plus_btn.addEventListener('click',() => {
    let new_rule_input = document.createElement("Input");
    new_rule_input.id = "Rule " + rule.rules_list.length;
    new_rule_input.value = consts.EMPTY_SYMBOL;
    new_rule_input.addEventListener("change",function () {
      load_rules();
    })
    // Remove "+ / -"
    for(let i = 0; i < 3; i++){li.removeChild(li.lastChild);}
    li.append(document.createTextNode(" | "));
    li.append(new_rule_input);
    rule.rules_list.push(new_rule_input);
    load_rules();
    add_btns(li, plus_btn, minus_btn);
  });

  // Button to remove a rule input textbox
  minus_btn.addEventListener('click',() => {
    // Remove "|", last text box, "+ / -"
    if(rule.rules_list.length > 1){
      for(let i = 0; i < 5; i++){li.removeChild(li.lastChild);}
      list_of_rules[list_of_rules.length - 1].rules_list.pop();
      add_btns(li, plus_btn, minus_btn);
    }
    load_rules();
  });
  add_btns(li, plus_btn, minus_btn);

  list.append(li);
}

// hist_change = 1 when undo/redo, otherwise hist_change = 0 when switching to cfg
/**
 * loads all the input boxes with their original values
 * @param {Object} rules    starting symbol, symbols and their rules
 * @param {int} hist_change know what is calling the clear, 
 *                          = 0 means that it is a switching from a machine to cfg
 *                          = 1 means that it is undo/redo
 *                          = 2 means that it is clear button.
 * @returns 
 */
export function reload(hist_change = clear_to_reload) {
  graph = consts.EMPTY_GRAPH;
  clear_rules(hist_change);
  hist.set_history_keys(consts.MACHINE_TYPES.CFG);
  let rules = hist.retrieve_latest_graph();
  //First open CFG section
  if (rules["start"] == undefined) {
    create_rule();
    console.log("undefined");
    return;
  }else{
    document.getElementById("starting_symbol").value = rules["start"];
  }
  let symbols_list = (rules["symbols"] == null) ? [] : rules["symbols"];
  for (let r = 0; r < symbols_list.length; r++){
    fill_rules(symbols_list[r], rules["Symbol"+(r+1)]);
  }
  document.body.appendChild(div);
}

/**
 * load to_push_rules with the values of the input boxes. and push to history
 */
export function load_rules(){
  to_push_rules["start"] = document.getElementById("starting_symbol").value;
  to_push_rules["symbols"] = [];
  for(let i = 0; i < list_of_rules.length; i++){
    let symbol = list_of_rules[i].symbol.value;
    to_push_rules["symbols"].push(symbol);
    const rules = list_of_rules[i].rules_list;
    to_push_rules["Symbol"+(i+1)] = [];
    for(let r   = 0; r < rules.length; r++){
      to_push_rules["Symbol"+(i+1)].push(rules[r].value);
    }
  }
  hist.set_history_keys(consts.MACHINE_TYPES.CFG);
  hist.push_history(to_push_rules);
}
/**
 * clear all the rules
 * @param {int} hist_change know what is calling the clear, 
 *                          = 0 means that it is a switching from a machine to cfg
 *                          = 1 means that it is undo/redo
 *                          = 2 means that it is clear button.
 */
export function clear_rules(hist_change = clear_to_reload){
  let list = document.querySelector('ul');
  while (list_of_rules.length > 0) {
    list.removeChild(list.lastChild);
    list_of_rules.pop();
  }
  document.getElementById("starting_symbol").value = "";
  if (hist_change == clear_everything_mode) {
    create_rule();
    load_rules();
    hist.set_history_keys(consts.MACHINE_TYPES.CFG);
    hist.push_history(to_push_rules);
  }
}

function add_btns(li, plus_btn, minus_btn) {
  li.append(plus_btn);
  li.append(document.createTextNode(" / "));
  li.append(minus_btn);
}