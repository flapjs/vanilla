/** @module ui_setup */

import * as consts from './consts.js';
import {bind_run_input}  from './index.js';

function pgAtoB(a,b){
  let pgName = 'pg';
  let nameA = pgName + a;
  let nameB = pgName + b;
  const pgA = document.getElementById(nameA);
  const pgB = document.getElementById(nameB);
  pgA.style.display = "none";
  pgB.style.display = "block";
  currentPg = b;
}

/** Global variable that records current page number of tutorial
 *  Used for funtions openPopup() closePopup() and pgAtoB() */
let currentPg = 1;
// Function to open the pop-up
function openPopup() {
  //set this to the total number of pages to avoid bug
  //updated to 5 pages tutorial 7/24/2023
  currentPg = 5;
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'block';
  const popup = document.querySelector('.popup');
  popup.style.display = 'block';
  for(let i=currentPg; i>1 ; i--){
    pgAtoB(i,i-1);
  }
}

// Function to close the pop-up
function closePopup() {
  pgAtoB(currentPg,1);
  let popup = document.querySelector('.popup');
  popup.style.display = 'none';
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
}

/** moved basic set up from index.html and combined into one function */
export function htmlSetUp(){
  // first time pop up implementation
  // Check if the user is a first-time visitor
  if (!localStorage.getItem('visitedBefore')) {
  // User is a first-time visitor
  openPopup();

  // Set flag to indicate the user has visited before
  localStorage.setItem('visitedBefore', true);
  } 

  const closeButton = document.getElementById('closeButton');
  closeButton.addEventListener('click', () => {
    closeMenu();
  })

  const homeIcon = document.getElementById('home-icon');
  const machineIcon = document.getElementById('machine-icon');
  const saveIcon = document.getElementById('save-icon');
  const bugIcon = document.getElementById('bug-icon');
  const helpIcon = document.getElementById('help-icon');
  const tutorial_close_btn = document.getElementById('tutorial_close_btn');
  const tutorial_finish_btn = document.getElementById('tutorial_finish_btn');

  homeIcon.addEventListener("click", () => {expandIcon('home')});
  machineIcon.addEventListener("click", () => {expandIcon('settings')});
  saveIcon.addEventListener("click", () => {expandIcon('save')});
  bugIcon.addEventListener("click", () => {redirectToBugReport()});
  helpIcon.addEventListener("click", () => {
    openPopup();
    closeMenu();
  }); 
  tutorial_close_btn.addEventListener("click",() => {closePopup();})
  tutorial_finish_btn.addEventListener("click",() => {closePopup();})

  const nextBtn_1to2 = document.getElementById('nextBtn_1to2');
  const nextBtn_2to3 = document.getElementById('nextBtn_2to3');
  const nextBtn_3to4 = document.getElementById('nextBtn_3to4');
  const nextBtn_4to5 = document.getElementById('nextBtn_4to5');

  const prevBtn_2to1 = document.getElementById('prevBtn_2to1');
  const prevBtn_3to2 = document.getElementById('prevBtn_3to2');
  const prevBtn_4to3 = document.getElementById('prevBtn_4to3');
  const prevBtn_5to4 = document.getElementById('prevBtn_5to4');

  nextBtn_1to2.addEventListener("click", () => {pgAtoB(1,2)});
  nextBtn_2to3.addEventListener("click", () => {pgAtoB(2,3)});
  nextBtn_3to4.addEventListener("click", () => {pgAtoB(3,4)});
  nextBtn_4to5.addEventListener("click", () => {pgAtoB(4,5)});

  prevBtn_2to1.addEventListener("click", () => {pgAtoB(2,1)});
  prevBtn_3to2.addEventListener("click", () => {pgAtoB(3,2)});
  prevBtn_4to3.addEventListener("click", () => {pgAtoB(4,3)});
  prevBtn_5to4.addEventListener("click", () => {pgAtoB(5,4)});
}

let homeToggle = false;
let machineToggle = false;
let saveToggle = false;
let secondbar = document.getElementById('secondbar');

function closeMenu() {
  if (homeToggle || machineToggle || saveToggle) {
    secondbar.style.transform = "translate(-240px)";
    homeToggle = false;
    machineToggle = false;
    saveToggle = false;
  }
  document.querySelector('.active')?.classList.remove('active');
}

function clearMenu() {
  var i;
  var x = document.getElementsByClassName('dropdown');
  for (i = 0; i < x.length; i++) {  
    x[i].hidden = true;
  }
  document.querySelector('.active')?.classList.remove('active');
}

/**
 * Toggle menu open or closed
 * @param {Object} classname - name of class associated with icon
 * @returns {boolean} true if menu was opened, false if closed
 */
function toggleMenu(classname) {
  // if closed, open the appropriate menu, or close if clicked on the same icon
  if (classname === 'home' && !homeToggle) {
    window.requestAnimationFrame(function(){
      secondbar.style.transform = "translate(0vw)"; 
    });
    // document.getElementById('secondbar').hidden = false;
    var x = document.getElementsByClassName(classname);
    for (var i = 0; i < x.length; i++) {
      x[i].hidden = false;
    }
    homeToggle = true;
    machineToggle = false;
    saveToggle = false;
    return true;
  }
  else if (classname === 'settings' && !machineToggle) {
    window.requestAnimationFrame(function(){
      secondbar.style.transform = "translate(0vw)"; 
    });
    // document.getElementById('secondbar').hidden = false;
    var i;
    var x = document.getElementsByClassName(classname);
    for (i = 0; i < x.length; i++) {
      x[i].hidden = false;
    }
    homeToggle = false;
    machineToggle = true;
    saveToggle = false;
    return true;
  }
  else if (classname === 'save' && !saveToggle) {
    window.requestAnimationFrame(function(){
      secondbar.style.transform = "translate(0vw)"; 
    });
    // document.getElementById('secondbar').hidden = false;
    var i;
    var x = document.getElementsByClassName(classname);
    for (i = 0; i < x.length; i++) {
      x[i].hidden = false;
    }
    homeToggle = false;
    machineToggle = false;
    saveToggle = true;
    return true;
  }
  else {
    closeMenu();
    return false;
  }
}

//updated on function when clicking on an icon 5/16/2023
function expandIcon(nameOfClass){
  clearMenu();
  var headerName = 'none';
  var currIcon;
  switch(nameOfClass){
    case 'home':
      headerName = 'Home';
      currIcon = document.getElementById('home-icon');
      break;
    case 'settings':
      headerName = 'Machines';
      currIcon = document.getElementById('machine-icon');
      break;
    case 'save':
      headerName = 'Save';
      currIcon = document.getElementById('save-icon');
      break;
    case 'bug':
      headerName = 'Bug';
      currIcon = document.getElementById('bug-icon');
      break;
    }
   if (toggleMenu(nameOfClass)) {
    const header = document.querySelector('#secondBarHeaderTitle > h1');
    header.textContent = headerName;
    currIcon.classList.add('active');
  }
  else {
    document.querySelector('.active')?.classList.remove('active');
  }
}

function redirectToBugReport() {
  window.open('https://github.com/flapjs/vanilla/issues', '_blank');
  //below is code for opening bug report in current tab of browser
  //window.location.href = 'https://github.com/flapjs/vanilla/issues';
}

/** binds the plus/minus buttons in the running input page */
export function bind_plus_minus() {
  const plus_button = document.getElementById('plus_button');
  const minus_button = document.getElementById('minus_button');

  plus_button.addEventListener('click', () => {
    const machine_inputs = document.querySelector('.machine_inputs');
    //first, check if there is a hidden machine input
    for (let i = 0; i < machine_inputs.children.length; i++) {
      if (machine_inputs.children[i].style.display === 'none') {
        machine_inputs.children[i].style.display = 'block';
        return;
      }
    }
    // create a new machine input
    add_input_bar();
  });

  // event listener for minus button
  minus_button.addEventListener('click', () => {
    // remove the last machine input
    const machine_inputs = document.querySelector('.machine_inputs');
    //iterate backwards through machine inputs, hide the first one that is not hidden
    for (let i = machine_inputs.children.length - 1; i >= 0; i--) {
      if (machine_inputs.children[i].style.display !== 'none') {
        machine_inputs.children[i].style.display = 'none';
        return;
      }
    }
  });
}

/** Generates a new input bar using the DOM
 * I tried using HTML to generate the first one
 * but ran into inconsistent spacing issue I couldn't figure out,
 * so this will be used to generate all for consistency's sake
 */
export function add_input_bar() {
  const machine_inputs = document.querySelector('.machine_inputs');
  const new_machine_input = document.createElement('div');
  new_machine_input.classList.add('machine_input');
  new_machine_input.style.backgroundColor = consts.SECOND_BAR_COLOR;

  // create a new input box
  const new_inputbox = document.createElement('input');
  new_inputbox.type = 'text';
  new_inputbox.placeholder = 'enter input';
  new_inputbox.classList.add("machine_input_text");
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

  new_machine_input.appendChild(new_inputbox);
  new_machine_input.appendChild(new_run_button);
  new_machine_input.appendChild(new_step_button);
  new_machine_input.appendChild(new_reset_button);

  // append the new button to the body
  machine_inputs.appendChild(new_machine_input);
  bind_run_input();
}
