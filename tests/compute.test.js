import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const RandExp = require('randexp');

import * as permalink from '../scripts/permalink.js';
import * as compute from '../scripts/compute.js';

const regex_graph_pairs = [
  ['^(c?a*d|bb*c?)*$', 'NFAq0:393:194:40:3;q1:393:665:40:0;q2:395:439:40:2;0:2:b%CE%B5%CE%B5R:5:-10:-1:-30~0:0:d%CE%B5%CE%B5R:5:10:23:7~0:1:a%CE%B5%CE%B5R:5:-34:-18:-26~0:1:c%CE%B5%CE%B5R:5:-54:-7:-24~1:1:a%CE%B5%CE%B5R:2:12:20:4~1:0:d%CE%B5%CE%B5R:5:-44:24:12~2:0:c%CE%B5%CE%B5R:5:-12:30:0~2:0:d%CE%B5%CE%B5R:5:0:-31:0~2:1:a%CE%B5%CE%B5R:5:0:-2:-24~2:2:b%CE%B5%CE%B5R:3:15:23:6~']
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
  while (num_strs --> 0) {
    const input = generator.gen();
    accepted_strs.push(input);
    const itr = compute.run_input(graph, type, input);
    const { value, _ } = itr.next();
    expect(value).toBe(true);
  }
  for (let accepted_str of accepted_strs) {
    const shuffled = shuffle(accepted_str);
    const itr = compute.run_input(graph, type, shuffled);
    const { value, _ } = itr.next();
    const is_accepted = matcher.test(shuffled);
    expect(value).toBe(is_accepted);
  }
  return true;
}

test("NFA tests", () => {
  regex_graph_pairs.forEach(([regex, graph]) => validate(regex, graph));
});
