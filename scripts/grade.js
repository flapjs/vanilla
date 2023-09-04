/** @module grade */

import * as compute from './compute.js';
import * as permalink from './permalink.js';

// if not in browser, don't run
if (typeof document !== 'undefined') {
  const cur_file_path = window.location.pathname;
  if (cur_file_path.includes('grade.html')) {
    document.addEventListener('DOMContentLoaded', init);
  }
}

let test_cases = [];
let graph = {};

function display_test_cases(test_cases) {
  const test_cases_display_area = document.getElementById('display_test_cases');
  while (test_cases_display_area.childElementCount) {  // wipe all elements
    test_cases_display_area.removeChild(test_cases_display_area.firstChild);
  }
  for (const [input_string, accepted] of test_cases) {
    const test_case_div = document.createElement('div');
    const test_string_span = document.createElement('span');
    const test_result_span = document.createElement('span');
    test_result_span.className = 'result_class';
    test_result_span.id = `${input_string}_result`;
    test_string_span.innerText = input_string;
    test_result_span.innerText = accepted ? 'accepted' : 'rejected';
    test_case_div.appendChild(test_string_span);
    test_case_div.appendChild(test_result_span);
    test_cases_display_area.appendChild(test_case_div);
  }
}

/**
 * given test cases as plain text, parse the document and store the results in `test_cases`
 * @param {string} text - a string consisting of lines of input. every two line specify a test case, with
 *                        the first line being the input string and the second line being accept/reject
 */
function parse_test_cases(text) {
  test_cases = [];  // clear
  const lines = text.trimEnd().split('\n')  // if the file ends with a new line, remove it
  if (lines.length & 1) {
    alert('invalid test file: odd number of lines');
    return;
  }
  for (let i = 0; i < lines.length; i+=2) {
    let accepted;
    switch (lines[i+1]) {
      case 'accepted':
        accepted = true;
        break;
      case 'rejected':
        accepted = false;
        break;
      default:
        alert('invalid test file: keywords other than "accepted" or "rejected"');
        return;
    }
    test_cases.push([lines[i], accepted]);
  }
  display_test_cases(test_cases);
}

function test_all_cases() {
  const url_input = document.getElementById('machine_url');
  const url = url_input.value;
  const graph_str = url.substring(url.indexOf('#')+1);
  let type, graph;
  try {
    [type, graph] = permalink.deserialize(graph_str);
  } catch {
    alert('invalid graph')
    return;
  }
  
  for (const [input_string, expected] of test_cases) {
    // eslint-disable-next-line no-unused-vars
    const { value: actual, _ } = compute.run_input(graph, type, input_string).next();
    const color = (expected == actual) ? 'green' : 'red';
    const input_string_result = document.getElementById(`${input_string}_result`);
    input_string_result.style.background = color;
  }
}

function upload_test_cases() {
  const test_case_uploader = document.getElementById('test_cases');
  const fr = new FileReader();
  fr.onload = () => parse_test_cases(fr.result);
  if (test_case_uploader.files.length) {
    fr.readAsText(test_case_uploader.files[0])
  }
}

function init() {
  const test_case_uploader = document.getElementById('test_cases');
  test_case_uploader.addEventListener('change', upload_test_cases);
  const start_test_btn = document.getElementById('start_test');
  start_test_btn.addEventListener('click', test_all_cases);
  const url_input = document.getElementById('machine_url');
  url_input.addEventListener('click', () => {
    for (const elem of document.getElementsByClassName('result_class')) {
      if (elem.style.background) {
        elem.style.background = '';
      }
    }
  });
}
