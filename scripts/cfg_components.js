/** @module CFG */

import * as consts from './consts.js';
import * as hist from './history.js';
import * as graph_components from './graph_components.js';

// Keeps track of symbols and rules
const list_of_rules = [];

// List of rules in HTML
const list = document.getElementById('cfg-list');

// Graph
let graph = consts.EMPTY_GRAPH;

// Current "index"/text clicked
let curr_index = -1;

// Starting symbol input text
const start_symbol = document.getElementById("starting_symbol");
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
        start_symbol.value = "";
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
export function create_new_rule(enter=false, want_to_push = true) {

    // Textbox used for symbol and rule
    const new_cfg = document.createElement("li");
    new_cfg.className = "cfg_list_object";
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

    //Check if a rule is added at the end (by enter) or somewhere else
    if (!enter) {
        list.append(new_cfg);
    } else {
        list.insertBefore(new_cfg, list.children[curr_index+1]);
    }

    const rule_obj = {
        symbol: new_symbol,
        rules: [new_rule],
        li: new_cfg
    };

    // Timer is to be sure that focus out events happen first.
    // It is used to know where a new rule should be created.
    // For example, if there are currently two rules, and you
    // want a new rule between both, then this section makes
    // it is created between them.
    new_symbol.addEventListener("focusin", () => {
        setTimeout(function() {
            change_curr_index(rule_obj);
        }, 20)
    });

    new_rule.addEventListener("focusin", () => {
        setTimeout(function() {
            change_curr_index(rule_obj);
        }, 20)
    });

    // Any changes are pushed.
    new_symbol.addEventListener('change', function() {
        push_to_history();
    });

    new_rule.addEventListener('change', function() {
        push_to_history();
    });

    // Add +,-, and X button.
    new_cfg.append(get_new_plus_btn(rule_obj, new_cfg));
    new_cfg.append(document.createTextNode(' / '));
    new_cfg.append(get_new_minus_btn(rule_obj, new_cfg));
    new_cfg.append(document.createTextNode(' / '));
    new_cfg.append(get_new_delete_btn(rule_obj, new_cfg));

    list_of_rules.splice(curr_index + 1, 0, rule_obj);
    if (want_to_push) {
        push_to_history();
    }
}

// Change "index" to the current rule selected
function change_curr_index(rule_obj) {
    curr_index = list_of_rules.indexOf(rule_obj);
}

// Resize rule textbox if necessary
function autoResize() {
    this.style.width = (this.value.length+7) + "ch";
}

/**
 * Converts a graph of an CFG to a PDA
 * @param {Object} CFG - set of CFG rules to be converted to PDA
 * @returns {Object} - graph of a PDA equivalent to the CFG rules
 */
export function CFG_to_PDA() {
    graph = consts.EMPTY_GRAPH;
    const start = start_symbol.value;
    if (start == " " || start.length < 1) {
        alert("Invalid symbol or no starting symbol");
        return false;
    }
    
    const can_not_run = make_edges();

    if (can_not_run) {
        return false;
    }

    return graph;
}

// Creates the edges of the PDA by making a path from
// the loop vertex to the empty vertex after emptying
// the portion of the stack, representing the word and
// back to the loop vertex.
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
    let failed = false;

    // Go through every rule.
    for (let i = 0; i < list_of_rules.length; i++) {
        const ruleObj = list_of_rules[i];
        const l = ruleObj.symbol.value;
        if (l.length != 1) {
            alert("One of the rules does not have a symbol");
            return true;
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
    }

    // Creates the EMPTY vertex far enough away so that the edges are visible
    graph['EMPTY'] = graph_components.make_vertex('EMPTY', (longest + 3)*consts.CFG_EDGE_X_DISTANCE, (row/2 + 1)*consts.CFG_EDGE_Y_DISTANCE, consts.DEFAULT_VERTEX_RADIUS, false, false,
        [graph_components.make_edge('EMPTY', 'loop', undefined, 0.5, 8.55)]);

    const start = start_symbol.value;
    if (terminal_symbols.indexOf(start) < 0) {
        alert("No rule has the starting symbol");
        failed = true;
    }

    // Add all terminal symbols to the loop vertex.
    terminal_symbols.forEach(symbol => {
        graph['loop'].out.push(graph_components.make_edge('loop', 'loop', symbol, cnt*0.1 + 0.3,
      -1 - cnt, -2.8, -1.1, symbol));
      cnt++;
    });

    graph['push$'].out.push(graph_components.make_edge('push$', 'loop', undefined,
    undefined, undefined, undefined, undefined, undefined, start));
    return failed;
}

// Pushes to the history in a way that CFG can understand how to retrieve.
function push_to_history() {
    const to_push = [];
    const start = start_symbol.value;
    to_push.push(start);
    for (let i = 0; i < list_of_rules.length; i++) {
        let list = [];
        for (let j = 0; j < list_of_rules[i].rules.length; j++) {
            list.push(list_of_rules[i].rules[j].value);
        }
        to_push.push({symbol: list_of_rules[i].symbol.value, rules: list});
    }
    hist.push_history(to_push)
}

// Sidebar button to delete the currently selected rule (none if none are selected)
export function delete_rule() {
    if (list.childElementCount > 1) {
        list_of_rules.splice(curr_index, 1);
        list.removeChild(list.childNodes[curr_index]);
    }
    push_to_history();
}

// Clears all the rules and symbols.
export function clear_rules(machine_switch = false) {
    while(list.firstChild){
        list_of_rules.pop();
        list.removeChild(list.firstChild );
    }
    if (!machine_switch) {
        create_new_rule();
    }
}

// Creates new empty rules and loads them with what is contained in the rules parameter.
export function reload_rules(rules) {
    if (isEmpty(rules)) {
        create_new_rule(false, false);
        start_symbol.value = "";
        return;
    }

    start_symbol.value = rules[0];

    for (let i = 1; i < rules.length; i++) {
        const new_cfg = document.createElement("li");
        new_cfg.className = "cfg_list_object";
        list.appendChild(new_cfg);
        const new_symbol = document.createElement("input");
        new_symbol.className = "cfg_symbol";
        new_symbol.maxLength = 1;
        new_symbol.value = rules[i].symbol;
        new_symbol.placeholder = consts.EMPTY_SYMBOL;

        // Timer is to be sure that focus out events happen first
        new_symbol.addEventListener("focusin", () => {
            setTimeout(function() {
                change_curr_index(rule_obj);
            }, 20)
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
            const line = document.createElement('text');
            line.textContent = " | ";
            const new_rule = document.createElement("input");
            new_rule.className = "cfg_rule";
            new_rule.maxLength = 15;
            new_rule.placeholder = consts.EMPTY_SYMBOL;
            new_rule.value = rule;
            new_rule.addEventListener('input', autoResize, false);
            
            new_rule.addEventListener("focusin", () => {
                setTimeout(function() {
                    change_curr_index(rule_obj);
                }, 20)
            });

            new_rule.addEventListener('change', function() {
                push_to_history();
            });
            
            rule_obj.rules.push(new_rule);
            new_cfg.appendChild(new_rule);
            new_cfg.appendChild(line);
        });

        new_cfg.removeChild(new_cfg.childNodes[new_cfg.childElementCount]);
        
        new_cfg.append(get_new_plus_btn(rule_obj, new_cfg));
        new_cfg.append(document.createTextNode(' / '));
        new_cfg.append(get_new_minus_btn(rule_obj, new_cfg));
        new_cfg.append(document.createTextNode(' / '));
        new_cfg.append(get_new_delete_btn(rule_obj, new_cfg,));

        list_of_rules.splice(i - 1, 0, rule_obj);
        list.appendChild(new_cfg);
    };
}

// Creates a plus button that adds a new rule.
function get_new_plus_btn(rule_obj, new_cfg) {
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
                }, 20)
            });
            added_rule.addEventListener('change', function() {
                push_to_history();
            });
            const line = document.createElement('text');
            line.textContent = " | ";
            new_cfg.insertBefore(added_rule, new_cfg.children[new_cfg.children.length - 3]);
            new_cfg.insertBefore(line, new_cfg.children[new_cfg.children.length - 4]);
            push_to_history();
        });

        return plus_btn;
}

// Creates a button that deletes the last rule of the associated line.
function get_new_minus_btn(rule_obj, new_cfg) {
    let minus_btn = document.createElement('button');
    minus_btn.textContent = ' - ';
    minus_btn.addEventListener("click", () => {
        if (rule_obj.rules.length <= 1) {
            return;
        }
        rule_obj.rules.pop();
        new_cfg.removeChild(new_cfg.children[new_cfg.children.length - 4]);
        new_cfg.removeChild(new_cfg.children[new_cfg.children.length - 4]);
        push_to_history();
    });
    return minus_btn;
}

// Creates a button that removes all the rules of that line.
function get_new_delete_btn(rule_obj, new_cfg) {
    let delete_btn = document.createElement('button');
    delete_btn.textContent = ' X ';
    delete_btn.addEventListener("click", () => {
        let curr_index = list_of_rules.indexOf(rule_obj);
        list.removeChild(list.childNodes[curr_index + 1]);
        list_of_rules.splice(curr_index, 1);
        if (list_of_rules.length == 0) {
            create_new_rule();
        }
        push_to_history();
    });
    return delete_btn;
}