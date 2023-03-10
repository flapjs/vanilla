/** @module CFG */

import * as consts from './consts.js';
import * as hist from './history.js';
import * as drawing from './drawing.js';
import * as compute from './compute.js';
import * as graph_ops from './graph_ops.js';
import * as graph_components from './graph_components.js';

//Line divider
let div = document.createElement("DIV");

let list_of_rules = []; // Array that keeps track of symbols and their rules
let graph = consts.EMPTY_GRAPH;

export function CFG_switch(){
  graph = consts.EMPTY_GRAPH;
  //First open CFG section
  if(list_of_rules.length == 0){
    make_start_and_final_edges();
    create_rule();
  }
  document.body.appendChild(div);

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

  // Button to submit rule/create the graph
  var submit = document.getElementById("submit");
  submit.addEventListener('click', () => {
    make_start_and_final_edges();
    let starting_symbol = document.getElementById("starting_symbol").value;
    cfg_create_edge(graph, "push$", "loop", undefined, undefined, starting_symbol);
    const variables = new Set();

    //Invalid input checking.
    for (let i = 0; i < list_of_rules.length; i++){
      if(list_of_rules[i].symbol.value.length != 1){
        alert("One of the symbol inputs do not have 1 character");
        return;
      }
      variables.add(list_of_rules[i].symbol.value);
    }
    if(!variables.has(starting_symbol)){
      alert("Starting symbol does not have a rule");
      return;
    }

    if(starting_symbol == ""){
      alert("No starting symbol");
      return;
    }
    create_edges(variables);
    
    hist.set_history_keys(consts.MACHINE_TYPES.CFG);
    hist.push_history(list_of_rules);
  });

  // Show graph  for error checking
  var show_graph = document.getElementById("test");
  show_graph.addEventListener('click', () => {
    drawing.get_canvas().hidden = false;
  });
}

//Function to create an edge
function cfg_create_edge(graph, from, to, read, pop, push){
  const edge = graph_components.cfg_make_edge(from, to, read, pop, push, undefined);
  if (!compute.edge_in_graph(graph, edge)) {  // edge was not part of the graph
    graph[edge.from].out.push(edge);
  }
}

//Initializer for an empty graph
function make_start_and_final_edges(){
  graph = {};
  //Start edge
  graph_ops.create_vertex(graph, 50,50, 25);
  graph_ops.rename_vertex(graph, "q0", "start");
  graph_ops.create_vertex(graph, 150,50, 25);
  graph_ops.rename_vertex(graph, "q0", "push$");
  cfg_create_edge(graph, "start", "push$", undefined, undefined, "$");

  //Final edge
  graph_ops.create_vertex(graph, 250,50, 25);
  graph_ops.rename_vertex(graph, "q0", "loop");
  graph_ops.create_vertex(graph, 350,50, 25);
  graph_ops.rename_vertex(graph, "q0", "final");
  cfg_create_edge(graph, "loop", "final", undefined, "$", undefined);
  graph_ops.toggle_final(graph, "final");
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
 * @param {Set} variables - keeps track of the symbols alphabet
 */
function create_edges(variables){
  let index = 0; // Counter used to keep track of the new vertex's name is
  let alphabet = new Set();
  for(let i = 0; i < list_of_rules.length; i++){
    let symbol = list_of_rules[i].symbol.value;
    let rules = list_of_rules[i].rule;

    for(let r   = 0; r < rules.length; r++){
      let str = rules[r].value;
      if(!alphabet.has(str[str.length-1]) && !variables.has(str[str.length-1])){
        alphabet.add(str[str.length-1]);
      }
      if(str.length == 0){
        // Case where there is nothing/empty symbol: self-loop
        cfg_create_edge(graph, "loop", "loop", undefined, undefined, undefined);
      }else if (str.length == 1){
        // Case where string is length 1: self-loop
        cfg_create_edge(graph, "loop", "loop", undefined, symbol, str[0]);
      }else{
        // Case where string is greater than 1: create new vertexes and edges for every
        // char, and at the end make an edge back to loop vertex.

        graph_ops.create_vertex(graph, 0,50, 25*index);
        // First edge from loop to a new vertex
        cfg_create_edge(graph, "loop", "q" + index, undefined, symbol, str[str.length - 1]);

        // Create edges and vertexes until the second character in the string (IT IS GOING IN REVERSE)
        for(let i = str.length - 2; i > 0; i--){
          graph_ops.create_vertex(graph, 50,100, 25*index);
          if(!alphabet.has(str[i]) && !variables.has(str[i])){
            alphabet.add(str[i]);
          }
          cfg_create_edge(graph, "q" + index, "q" + (index + 1), undefined, undefined, str[i])
          index++;
        }

        // Create an edge from the most recent vertex to the loop vertex
        cfg_create_edge(graph, "q"+index , "loop", undefined, undefined, str[0]);


        if(!alphabet.has(str[0]) && !variables.has(str[0])){
          alphabet.add(str[0]);
        }
        index++;
      }
    }
  }
  for(const l of alphabet.keys()){
    cfg_create_edge(graph, "loop", "loop", l, l, undefined);
  }
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