/** @module permalink */

import * as consts from './consts.js';
import * as compute from './compute.js';
import * as menus from './menus.js';

let graph = consts.EMPTY_GRAPH;  // global graph


const plus_button = document.querySelector('.plus_btn');
const minus_button = document.querySelector('.minus_btn');

// event listener for plus button
plus_button.addEventListener('click', () => {

    const machine_inputs = document.querySelector('.machine_inputs');
    console.log(machine_inputs);
    console.log(machine_inputs.children.length);
    console.log(machine_inputs.children.item(machine_inputs.children.length - 1));
    //iterate backwards through machine inputs
    for (let i = 0; i < machine_inputs.children.length; i++) {
        if (machine_inputs.children.item(i).classList.contains('machine_input') && machine_inputs.children.item(i).hidden) {
            // hide the machine input
            console.log("showing machine input");
            machine_inputs.children.item(i).hidden = false;
            return;
        }
    }


    // create a new machine input
    const new_machine_input = document.createElement('div');
    new_machine_input.classList.add('machine_input');

    // create a new textarea box
    const new_textarea = document.createElement('textarea');
    //give it id machineinput
    new_textarea.classList.add("machineInput");
    //new_textarea.type = "text";
    //new_textarea.placeholder = "Enter your machine here";

    // create a new run button under the original one
    const new_run_button = document.createElement('button');
    new_run_button.classList.add('run_btn');
    new_run_button.innerHTML = 'R';

    // create a new step button
    const new_step_button = document.createElement('button');
    new_step_button.classList.add('step_btn');
    new_step_button.innerHTML = 'S';

    // create a new reset button
    const new_reset_button = document.createElement('button');
    new_reset_button.classList.add('reset_btn');
    new_reset_button.innerHTML = 'X';

    new_machine_input.appendChild(new_textarea);
    new_machine_input.appendChild(new_run_button);
    new_machine_input.appendChild(new_step_button);
    new_machine_input.appendChild(new_reset_button);

    // append the new button to the body
    machine_inputs.appendChild(new_machine_input);
    bind_run_input();
    //update machineinput
});

// event listener for minus button
minus_button.addEventListener('click', () => {
    // remove the last machine input
    const machine_inputs = document.querySelector('.machine_inputs');
    console.log(machine_inputs);
    console.log(machine_inputs.children.length);
    console.log(machine_inputs.children.item(machine_inputs.children.length - 1));
    //iterate backwards through machine inputs
    for (let i = machine_inputs.children.length - 1; i >= 0; i--) {
        if (machine_inputs.children.item(i).classList.contains('machine_input') && !machine_inputs.children.item(i).hidden) {
            // hide the machine input
            console.log("hiding machine input");
            machine_inputs.children.item(i).hidden = true;
            break;
        }
    }

});

/** binds each machine input to the run_input function */
function bind_run_input() {
    console.log("binding run input");
    const input_divs = document.getElementsByClassName('machine_input');
    const computations = Array(input_divs.length);  // stores generators of the computation half evaluated
    // console.log(input_divs.length);
    for (let i = 0; i < input_divs.length; i++) {
      const textbox = input_divs[i].querySelector('.machineInput');
      const run_btn = input_divs[i].querySelector('.run_btn');
      run_btn.addEventListener('click', () => {
        computations[i] = compute.run_input(graph, menus.machine_type(), textbox.value);  // noninteractive computation
        // eslint-disable-next-line no-unused-vars
        const { value: accepted, _ } = computations[i].next();  // second value is always true since it is noninteractive
        alert(accepted ? 'Accepted' : 'Rejected');
        computations[i] = undefined;
      });
      
      const step_btn = input_divs[i].querySelector('.step_btn');
      step_btn.addEventListener('click', () => {
        if (!computations[i]) {
          computations[i] = compute.run_input(graph, menus.machine_type(), textbox.value, true);  // true for interactive
        }
        const { value: accepted, done } = computations[i].next();
        if (done) {
          // whether true or false. We wrap this in timeout to execute after the vertex coloring is done
          setTimeout(() => alert(accepted ? 'Accepted' : 'Rejected'));
          computations[i] = undefined;
        }
      });
  
      const reset_btn = input_divs[i].querySelector('.reset_btn');
      reset_btn.addEventListener('click', () => {
        computations[i] = undefined;
        drawing.highlight_states(graph, []);  // clear the highlighting
      });
    }
    // clear the partial computations when user switches machines
    document.getElementById('dropdown-content').addEventListener('change', () => computations.fill(undefined));
  }

  export {bind_run_input};