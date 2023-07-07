/** @module CFG */

import * as consts from './consts.js';
import * as hist from './history.js';
import * as graph_components from './graph_components.js';
import { machine_type } from './menus.js';

// Keeps track of symbols and rules
const list_of_rules = [];

// List of rules in HTML
const list = document.getElementById('cfg-list');

// Graph
let graph = consts.EMPTY_GRAPH;

// Current "index"/text clicked
let curr_index = -1;

// Starting symbol input text
const start_symbol = document.getElementById("starting_symbol")
/**
 * CFG switch
 */
start_symbol.addEventListener('change', function() {
    push_to_history();
});

start_symbol.placeholder = consts.EMPTY_SYMBOL;

export function CFG_switch() {
    document.getElementsByClassName("step_btn")[0].hidden = true;
    document.getElementsByClassName("reset_btn")[0].hidden = true;
    load_rules();
}

/**
 * Load rules
 */
function load_rules() {
    let rules = hist.retrieve_latest_graph();
    if (isEmpty(rules)) {
        console.log("EMPTY");
        create_new_rule();
    } else {
        reload_rules(rules);
    }
}

/**
 * Check if an object is empty
 * @param {*} obj - object to be checked
 * @returns true if object is empty, otherwise false
 */
function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
  
    return true;
  }

/**
 * Create new rule
 */
export function create_new_rule(enter=false) {
    const new_cfg = document.createElement("li");
    const new_symbol = document.createElement("input");
    new_symbol.className = "cfg_symbol";
    new_symbol.maxLength = 1;
    new_symbol.placeholder = consts.EMPTY_SYMBOL;

    const new_rule = document.createElement("input");
    new_rule.className = "cfg_rule";
    new_rule.maxLength = 15;
    new_rule.placeholder = consts.EMPTY_SYMBOL;
    new_rule.addEventListener('input', autoResize, false);

    new_cfg.appendChild(new_symbol);
    new_cfg.append(document.createTextNode('→'));
    new_cfg.appendChild(new_rule);

    if (!enter) {
        list.append(new_cfg);
    } else {
        console.log(curr_index);
        list.insertBefore(new_cfg, list.children[curr_index+1]);
    }

    const rule_obj = {
        symbol: new_symbol,
        rules: [new_rule],
        li: new_cfg
    };

    // Timer is to be sure that focus out events happen first
    new_symbol.addEventListener("focusin", () => {
        setTimeout(function() {
            change_curr_index(rule_obj);
        }, 50)
    });

    new_rule.addEventListener("focusin", () => {
        setTimeout(function() {
            change_curr_index(rule_obj);
        }, 50)
    });

    new_symbol.addEventListener("focosout", () => {
        curr_index = -1;
    });

    new_rule.addEventListener("focusout", () => {
        curr_index = -1;
    });

    new_symbol.addEventListener('change', function() {
        push_to_history();
    });

    new_rule.addEventListener('change', function() {
        push_to_history();
    });

    let plus_btn = document.createElement('button');
    plus_btn.textContent = ' + ';
    plus_btn.addEventListener("click", () => {
        const added_rule = document.createElement("input");
        added_rule.className = "cfg_rule";
        added_rule.maxLength = 15;
        added_rule.placeholder = consts.EMPTY_SYMBOL;
        rule_obj.rules.push(added_rule);
        added_rule.addEventListener('input', autoResize, false);
        added_rule.addEventListener("focusin", () => {
            setTimeout(function() {
                change_curr_index(rule_obj);
            }, 50)
        });
        added_rule.addEventListener("focusout", () => {
            curr_index = -1;
        });
        added_rule.addEventListener('change', function() {
            push_to_history();
        });
        const line = document.createElement('text');
        line.textContent = " | ";
        new_cfg.insertBefore(line, new_cfg.children[new_cfg.children.length - 2]);
        new_cfg.insertBefore(added_rule, new_cfg.children[new_cfg.children.length - 2]);
    });

    let minus_btn = document.createElement('button');
    minus_btn.textContent = ' - ';
    minus_btn.addEventListener("click", () => {
        if (rule_obj.rules.length <= 1) {
            return;
        }
        rule_obj.rules.pop();
        new_cfg.removeChild(new_cfg.children[new_cfg.children.length - 3]);
        new_cfg.removeChild(new_cfg.children[new_cfg.children.length - 3]);
    });

    new_cfg.append(plus_btn);
    new_cfg.append(document.createTextNode(' / '));
    new_cfg.append(minus_btn);

    list_of_rules.splice(curr_index + 1, 0, rule_obj);
    console.log(list_of_rules);
}

function change_curr_index(rule_obj) {
    curr_index = list_of_rules.indexOf(rule_obj);
    console.log(curr_index);
}

function autoResize() {
    this.style.width = (this.value.length+3) + "ch";
}

/**
 * Converts a graph of an CFG to a PDA
 * @param {Object} CFG - set of CFG rules to be converted to PDA
 * @returns {Object} - graph of a PDA equivalent to the CFG rules
 */
export function CFG_to_PDA(CFG) {
    graph = consts.EMPTY_GRAPH;
    const start = start_symbol.value;
    if (start == " " || start.length < 1) {
        alert("Invalid symbol or no starting symbol");
        return [];
    }
    
    make_edges();

    return graph;
}

function make_edges() {
    graph['final'] = graph_components.make_vertex('final', 3*consts.CFG_EDGE_X_DISTANCE + 50, 0, consts.DEFAULT_VERTEX_RADIUS, false, true);
    graph['loop'] = graph_components.make_vertex('loop', 2*consts.CFG_EDGE_X_DISTANCE + 50, 0, consts.DEFAULT_VERTEX_RADIUS, false, false, 
        [graph_components.make_edge('loop', 'final', undefined, undefined, undefined, undefined,
        undefined, '$', undefined, undefined)]);

    graph['push$'] = graph_components.make_vertex('push$', consts.CFG_EDGE_X_DISTANCE + 50, 0, consts.DEFAULT_VERTEX_RADIUS, false, false);
    graph['start'] = graph_components.make_vertex('start', 50, 0, consts.DEFAULT_VERTEX_RADIUS, true, false, 
        [graph_components.make_edge('start', 'push$', undefined, undefined, undefined, undefined,
        undefined, undefined, '$')]);
    
    const terminal_symbols = [];
    const alphabet = new Set();
    let cnt = 1;
    let vertexCnt = 0;
    let longest = 1;
    let row = 0;
    const strs = [];

    list_of_rules.forEach(ruleObj => {
        const l = ruleObj.symbol.value;
        if (l.length == 0) {
            alert("One of the rules does not have a symbol");
        }
        if (!alphabet.has(l)) {
            alphabet.add(l);
        }
        if (terminal_symbols.indexOf(l) < 0) {
            terminal_symbols.push(l);
        }

        ruleObj.rules.forEach(str => {
            strs.push({symbol: l, str: str});

            let rule = str.value;
            vertexCnt += rule.length;
            row++;
            if (rule.length == 1) {
                console.log("1");
                if (terminal_symbols.indexOf(rule[0]) < 0) {
                    terminal_symbols.push(rule[0]);
                }
                graph['q' + vertexCnt] = graph_components.make_vertex('q' + vertexCnt, 2*consts.CFG_EDGE_X_DISTANCE + rule.length*consts.CFG_EDGE_X_DISTANCE,
                consts.CFG_EDGE_Y_DISTANCE + row*consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                    [graph_components.make_edge('q' + vertexCnt, 'EMPTY', undefined, undefined, undefined, undefined,
                    undefined, undefined, rule[0])]);
                graph['loop'].out.push(graph_components.make_edge('loop', 'q' + (vertexCnt), undefined, 0.5 + row*0.1, 1.7 + row*0.5,
                    undefined, undefined, l));
            } else {
                console.log("> 1");
                if (rule.length > longest) {
                    longest = rule.length;
                }
                 // Last edge back to loop/First letter
                graph['q' + vertexCnt] = graph_components.make_vertex('q' + vertexCnt, 2*consts.CFG_EDGE_X_DISTANCE + rule.length*consts.CFG_EDGE_X_DISTANCE,
                consts.CFG_EDGE_Y_DISTANCE + row*consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                    [graph_components.make_edge('q' + vertexCnt, 'EMPTY', undefined, undefined, undefined, undefined,
                    undefined, undefined, rule[0])]);
                    vertexCnt--;
                if (terminal_symbols.indexOf(rule[0]) < 0) {
                    terminal_symbols.push(rule[0]);
                }

            // Create edges and vertexes until the second character in the string
            for(let i = 1; i < rule.length; i++){
                if (terminal_symbols.indexOf(rule[i]) < 0) {
                    terminal_symbols.push(rule[i]);
                }
                graph['q' + vertexCnt] = graph_components.make_vertex('q' + vertexCnt,  2*consts.CFG_EDGE_X_DISTANCE + consts.CFG_EDGE_X_DISTANCE*(rule.length - i),
                consts.CFG_EDGE_Y_DISTANCE + row*consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false, 
                    [graph_components.make_edge('q' + vertexCnt, 'q' + (vertexCnt + 1), undefined, undefined, undefined, undefined,
                    undefined, undefined, rule[i])]);
                vertexCnt--;
            }
            // First edge back from loop/Last letter
            graph['loop'].out.push(graph_components.make_edge('loop', 'q' + (vertexCnt + 1), undefined, 0.5 + row*0.1, 1.7 + row*0.5,
                undefined, undefined, l));
            }
            vertexCnt += rule.length;
        });
    });

    graph['EMPTY'] = graph_components.make_vertex('EMPTY', (longest + 3)*consts.CFG_EDGE_X_DISTANCE, row/2 *consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false,
        [graph_components.make_edge('EMPTY', 'loop', undefined, 0.5, 8.55)]);

    const start = start_symbol.value;
    if (terminal_symbols.indexOf(start) < 0) {
        alert("No rule has the starting symbol");
        return [];
    }

    terminal_symbols.forEach(symbol => {
        graph['loop'].out.push(graph_components.make_edge('loop', 'loop', symbol, cnt*0.1 + 0.3,
      -1 - cnt, -2.8, -1.1, symbol));
      cnt++;
    });

    graph['push$'].out.push(graph_components.make_edge('push$', 'loop', undefined,
    undefined, undefined, undefined, undefined, undefined, start));
}

function push_to_history() {
    const to_push = [];
    const start = start_symbol.value;
    to_push.push(start);
    console.log(list_of_rules);
    for (const rule of list_of_rules) {
        console.log(rule);
        let list = [];
        for (const str of rule.rules) {
            list.push(str.value);
        }
        to_push.push({symbol: rule.symbol.value, rules: list});
        console.log(list);
    }
    console.log(to_push);
    hist.push_history(to_push)
}

export function delete_rule() {
    list_of_rules.pop();
    console.log(list.childNodes);
    if (list.childElementCount > 1) {
        list.removeChild(list.childNodes[list.childElementCount - 1]);
    }
}

export function clear_rules(machine_switch = false) {
    while(list.firstChild){
        list_of_rules.pop();
        list.removeChild(list.firstChild );
    }
    if (!machine_switch) {
        create_new_rule();
    }
}

function reload_rules(rules) {
    start_symbol.value = rules[0];
    const line = document.createElement('text');
    line.textContent = " | ";
    for (let i = 1; i < rules.length; i++) {
        const new_cfg = document.createElement("li");
        const new_symbol = document.createElement("input");
        new_symbol.className = "cfg_symbol";
        new_symbol.maxLength = 1;
        new_symbol.value = rules[i].symbol;
        new_symbol.placeholder = consts.EMPTY_SYMBOL;

        // Timer is to be sure that focus out events happen first
        new_symbol.addEventListener("focusin", () => {
            setTimeout(function() {
                change_curr_index(rule_obj);
            }, 50)
        });

        new_symbol.addEventListener("focosout", () => {
            curr_index = -1;
        });

        new_symbol.addEventListener('change', function() {
            push_to_history();
        });

        new_cfg.appendChild(new_symbol);
        new_cfg.append(document.createTextNode('→'));

        const rule_obj = {
            symbol: new_symbol,
            rules: [],
            li: new_cfg
        };

        rules[i].rules.forEach(rule => {
            const new_rule = document.createElement("input");
            new_rule.className = "cfg_rule";
            new_rule.maxLength = 15;
            new_rule.placeholder = consts.EMPTY_SYMBOL;
            new_rule.value = rule;
            new_rule.addEventListener('input', autoResize, false);
            
            new_rule.addEventListener("focusin", () => {
                setTimeout(function() {
                    change_curr_index(rule_obj);
                }, 50)
            });

            new_rule.addEventListener("focusout", () => {
                curr_index = -1;
            });

            new_rule.addEventListener('change', function() {
                push_to_history();
            });
            
            rule_obj.rules.push(new_rule);
            new_cfg.appendChild(new_rule);
            new_cfg.appendChild(line);
        });

        new_cfg.removeChild(new_cfg.childNodes[new_cfg.childElementCount])

        let plus_btn = document.createElement('button');
        plus_btn.textContent = ' + ';
        plus_btn.addEventListener("click", () => {
            const added_rule = document.createElement("input");
            added_rule.className = "cfg_rule";
            added_rule.maxLength = 15;
            added_rule.placeholder = consts.EMPTY_SYMBOL;
            rule_obj.rules.push(added_rule);
            added_rule.addEventListener('input', autoResize, false);
            added_rule.addEventListener("focusin", () => {
                setTimeout(function() {
                    change_curr_index(rule_obj);
                }, 50)
            });
            added_rule.addEventListener("focusout", () => {
                curr_index = -1;
            });
            added_rule.addEventListener('change', function() {
                push_to_history();
            });
            const line = document.createElement('text');
            line.textContent = " | ";
            new_cfg.insertBefore(line, new_cfg.children[new_cfg.children.length - 2]);
            new_cfg.insertBefore(added_rule, new_cfg.children[new_cfg.children.length - 2]);
        });

        let minus_btn = document.createElement('button');
        minus_btn.textContent = ' - ';
        minus_btn.addEventListener("click", () => {
            if (rule_obj.rules.length <= 1) {
                return;
            }
            rule_obj.rules.pop();
            new_cfg.removeChild(new_cfg.children[new_cfg.children.length - 3]);
            new_cfg.removeChild(new_cfg.children[new_cfg.children.length - 3]);
        });

        new_cfg.append(plus_btn);
        new_cfg.append(document.createTextNode(' / '));
        new_cfg.append(minus_btn);

        list_of_rules.splice(curr_index + 1, 0, rule_obj);
        list.appendChild(new_cfg);
    };
}