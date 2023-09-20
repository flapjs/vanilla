/**
 * @jest-environment jsdom
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const RandExp = require('randexp');

import * as permalink from '../scripts/permalink.js';
import * as compute from '../scripts/compute.js';

const regex_graph_pairs = [
  ['^(c?a*d|bb*c?)*$', 'NFAq0:393:194:40:3;q1:393:665:40:0;q2:395:439:40:2;0:2:b%CE%B5%CE%B5R:5:-10:-1:-30~0:0:d%CE%B5%CE%B5R:5:10:23:7~0:1:a%CE%B5%CE%B5R:5:-34:-18:-26~0:1:c%CE%B5%CE%B5R:5:-54:-7:-24~1:1:a%CE%B5%CE%B5R:2:12:20:4~1:0:d%CE%B5%CE%B5R:5:-44:24:12~2:0:c%CE%B5%CE%B5R:5:-12:30:0~2:0:d%CE%B5%CE%B5R:5:0:-31:0~2:1:a%CE%B5%CE%B5R:5:0:-2:-24~2:2:b%CE%B5%CE%B5R:3:15:23:6~'],

  ['^(a|b)+(q?(c|d)+)*@(w?(e|f)+)*$', 'NFAq0:669:162:40:1;q1:665:368:40:0;q2:809:494:40:0;q3:651:880:40:2;q4:721:730:40:0;q5:653:1060:40:0;0:1:a%CE%B5%CE%B5R:5:11:-1:-28~0:1:b%CE%B5%CE%B5R:5:0:4:7~1:1:a%CE%B5%CE%B5R:5:10:24:9~1:1:b%CE%B5%CE%B5R:5:-10:-22:-9~1:4:c%CE%B5%CE%B5R:5:-11:0:-20~1:4:d%CE%B5%CE%B5R:5:0:1:-5~1:2:q%CE%B5%CE%B5R:5:0:7:-20~1:3:@%CE%B5%CE%B5R:5:-21:-4:-22~2:4:c%CE%B5%CE%B5R:5:10:-5:24~2:4:d%CE%B5%CE%B5R:4:-9:-2:8~3:3:e%CE%B5%CE%B5R:5:10:24:6~3:3:f%CE%B5%CE%B5R:5:-10:-23:-10~3:5:w%CE%B5%CE%B5R:5:-15:-2:-11~4:2:q%CE%B5%CE%B5R:6:-33:18:6~4:4:c%CE%B5%CE%B5R:5:-10:-24:-11~4:4:d%CE%B5%CE%B5R:0:13:19:3~4:3:@%CE%B5%CE%B5R:5:0:-4:20~5:3:e%CE%B5%CE%B5R:5:-12:29:18~5:3:f%CE%B5%CE%B5R:5:0:30:9~']
];

function shuffle(str) {
  const str_arr = str.split('');
  const shuffled = str_arr.sort(() => 0.5 - Math.random());
  return shuffled.join('');
}

function validate(regex_str, graph_str, num_strs=100, len_const=10) {
  const [type, graph] = permalink.deserialize(graph_str);
  const generator = new RandExp(regex_str);
  generator.max = len_const;
  const matcher = new RegExp(regex_str);
  const accepted_strs = [];

  /***** generate some strings using regex and make sure the NFA accepts *****/
  while (num_strs --> 0) {
    const input = generator.gen();
    accepted_strs.push(input);
    const itr = compute.run_input(graph, type, input);
    const { value, _ } = itr.next();
    if (!value) {
      console.log(`Failed on input: ${input}`);
    }
    expect(value).toBe(true);
  }

  /***** shuffle the generated strings and check agreement btw regex and NFA *****/
  for (let accepted_str of accepted_strs) {
    const shuffled = shuffle(accepted_str);
    const itr = compute.run_input(graph, type, shuffled);
    const { value, _ } = itr.next();
    const is_accepted = matcher.test(shuffled);
    if (value !== is_accepted) {
      console.log(`Failed on input: ${shuffled}`);
    }
    expect(value).toBe(is_accepted);
  }
  return true;
}

regex_graph_pairs.forEach(([regex, graph], idx) => {
  test(`NFA test ${idx}`, () => {
    validate(regex, graph); // TODO: can't run deserialized NFA's
  });
});
