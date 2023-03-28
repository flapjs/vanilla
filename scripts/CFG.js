/** @module CFG */

import * as consts from './consts.js';
import * as hist from './history.js';
import * as graph_components from './graph_components.js';

//Line divider
let div = document.createElement("DIV");

let list_of_rules = []; // Array that keeps track of symbols and their rules
let graph = consts.EMPTY_GRAPH;

export function CFG_switch(){
  // Button to create a new symbol and rule
  var create_btn = document.getElementById("create_new_rule");
  create_btn.addEventListener('click', () => {
    create_rule();
  });

  // Button to delete a new rule
  var delete_btn = document.getElementById("delete_rule");
  delete_btn.addEventListener('click', () => {
    let list = document.querySelector('ul');
    if(list_of_rules.length > 1){
      list.removeChild(list.lastChild);
      list_of_rules.pop();
    }
  });

  // Button to   rule/create the graph
  var submit = document.getElementById("submit");
  submit.addEventListener('click', () => {
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
    hist.set_history_keys(consts.MACHINE_TYPES.CFG);
    hist.push_history(list_of_rules);
    create_edges(terminal_symbols);
  });
  var clear_all = document.getElementById("clear");
  clear_all.addEventListener('click', () => {
  });
}

//Initializer for an empty graph
function make_start_and_final_edges(){
  graph = consts.EMPTY_GRAPH;
  graph["final"] = graph_components.make_vertex("final", 650, 50, consts.DEFAULT_VERTEX_RADIUS, false, true);
  graph["loop"] = graph_components.make_vertex("loop", 450, 50, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                  [graph_components.make_edge("loop", "final", undefined, undefined, undefined, undefined,
                  undefined, "$", undefined, undefined)]);

  graph["push$"] = graph_components.make_vertex("push$", 250, 50, consts.DEFAULT_VERTEX_RADIUS, false, false);
  graph["start"] = graph_components.make_vertex("start", 50, 50, consts.DEFAULT_VERTEX_RADIUS, true, false, 
                  [graph_components.make_edge("start", "push$", undefined, undefined, undefined, undefined,
                  undefined, undefined, "$")]);
}

// Create a textbox for a new rules
function create_rule(){
  let [plus, minus, symbol_input, rule_input] = create_text_elements();
  let list = document.querySelector('ul');
  let li = document.createElement('li');
  let index = (list_of_rules.length + 1);
  let rule_count = 1;
  symbol_input.id = "Symbol " + index;
  rule_input.id = "Rule " + rule_count;

  li.appendChild(symbol_input);
  li.append(document.createTextNode("→"));
  li.append(rule_input);

  // Button to add a rule input textbox
  plus.addEventListener('click',() => {
    let new_rule_input = document.createElement("Input");
    new_rule_input.id = "Rule " + rule_count;
    // Remove "+ / -"
    for(let i = 0; i < 3; i++){li.removeChild(li.lastChild);}
    li.append(document.createTextNode(" | "));
    li.append(new_rule_input);
    list_of_rules[index-1].rule.push(new_rule_input);
    rule_count++;
    li.append(plus);
    li.append(document.createTextNode(" / "));
    li.append(minus);
  });

  // Button to remove a rule input textbox
  minus.addEventListener('click',() => {
    // Remove "|", last text box, "+ / -"
    if(rule_count > 1){
      for(let i = 0; i < 5; i++){li.removeChild(li.lastChild);}
      list_of_rules[index-1].rule.pop();
      rule_count--;
      li.append(plus);
      li.append(document.createTextNode(" / "));
      li.append(minus);
    }
  });
  li.append(plus);
  li.append(document.createTextNode(" / "));
  li.append(minus);

  list.append(li);
  
  let rule = {
    symbol : symbol_input,
    rule : [rule_input],
    li_reference : li
  }
  list_of_rules.push(rule);
}

/**
 * creates a graph using list_of_rules
 * @param {Set} terminal_symbols - keeps track of the symbols alphabet
 */
function create_edges(terminal_symbols){
  let index = 0; // Counter used to keep track of the new vertex's name is
  let alphabet = new Set();
  let longest = 0;
  let row = 0;
  for(let i = 0; i < list_of_rules.length; i++){
    let symbol = list_of_rules[i].symbol.value;
    let rules = list_of_rules[i].rule;

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
        graph["q" + index] = graph_components.make_vertex("q" + index, 250 + str.length*200, 200 + row*200, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                              [graph_components.make_edge("q" + index, "empty", undefined, undefined, undefined, undefined,
                              undefined, undefined, str[0])]);
        index--;

        // Create edges and vertexes until the second character in the string
        for(let i = 1; i < str.length; i++){
          graph["q" + index] = graph_components.make_vertex("q" + index,  250 + str.length*200 - i*200, 200 + row*200, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                              [graph_components.make_edge("q" + index, "q" + (index + 1), undefined, undefined, undefined, undefined,
                              undefined, undefined, str[i])]);
          if(!alphabet.has(str[i]) && !terminal_symbols.has(str[i])){ // Differentiate between terminal symbols and alphabet
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
  for(const l of alphabet.keys()){
    graph["loop"].out.push(graph_components.make_edge("loop", "loop", l, cnt*0.1 + 0.3,
                                -1 - cnt, -2.8, -1.1, l));
    cnt++;
  }
  graph["empty"] = graph_components.make_vertex("empty", 650 + longest*200, 200, consts.DEFAULT_VERTEX_RADIUS, false, false,
                                                [graph_components.make_edge("empty", "loop", undefined, 0.5, 8.55)]);
}

/**
 * Creates the elements that will be used to create/delete rules
 * @returns [plus, minus, symbol_input, rule_input] - [Plus button, Minus button, ]
 */
function create_text_elements(){
  let plus = document.createElement("button");
  plus.id = "Add rule";
  plus.textContent = " + ";
  let minus = document.createElement("button");
  minus.id = "Delete rule";
  minus.textContent = " - ";
  let symbol_input = document.createElement("Input");
  let rule_input = document.createElement("Input");
  return [plus, minus, symbol_input, rule_input];
}

export function get_graph(){
  return graph;
}

export function reload(rules) {
  graph = consts.EMPTY_GRAPH;
  make_start_and_final_edges();
  //First open CFG section
  if(rules.length == undefined){
    create_rule();
  }
  for (let r = 0; r < rules.length; r++){

  }
  document.body.appendChild(div);
}