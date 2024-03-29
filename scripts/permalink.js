/** @module permalink */

import * as consts from './consts.js';
import * as graph_components from './graph_components.js';

/**
 * makes a character url compliant and makes sure it does not clash with the delimiters
 * @param {string} c - the character to be made url compliant
 * @returns {string} the url compliant character
 */
function char_url_compliance(c) {
  if (c === consts.FIELD_DELIM  ||
      c === consts.VERTEX_DELIM ||
      c === consts.EDGE_DELIM) {
    return escape(c);  // these absolutely need to encoded to avoid clashes
  } else if (!consts.LEGAL_CHARS.includes(c)) {
    return encodeURI(c);  // encode iff not legal in url
  } else {
    return c;  // otherwise, return the character as is
  }
}

/**
 * turn a field into a string
 * @param {string | float} field
 * @returns {string} the string repr of the field
 */
function to_string_field(field) {
  // backward compatibility for users who have saved graphs on localstore without mealy or moore outputs
  if (field === undefined) {
    return consts.EMPTY_SYMBOL;
  }
  const field_str = field.toString();
  return Array.from(field_str).reduce((acc, c) => acc + char_url_compliance(c), '');
}

/**
 * basically the 'toString' method for the graph
 * @param {string} type - the type of the graph in {'NFA', 'PDA', 'Turing'}
 * @param {Object} graph - check 'graph_components.js' for the structure of the graph
 * @returns {string} the graph as a string
 */
export function serialize(type, graph) {
  let result = type;

  for (const vertex of Object.values(graph)) {
    result += to_string_field(vertex.name)          + consts.FIELD_DELIM;
    result += to_string_field(Math.round(vertex.y)) + consts.FIELD_DELIM;
    result += to_string_field(Math.round(vertex.x)) + consts.FIELD_DELIM;
    result += to_string_field(Math.round(vertex.r)) + consts.FIELD_DELIM;
    result += to_string_field(vertex.moore_output)  + consts.FIELD_DELIM;
    const composite_bit = (vertex.is_start ? 1 : 0) + (vertex.is_final ? 2 : 0);
    result += to_string_field(composite_bit)        + consts.VERTEX_DELIM;
  }

  const vertex_name_to_id = {};
  for (const [id, vertex] of Object.values(graph).entries()) {
    vertex_name_to_id[vertex.name] = id;
  }

  for (const vertex of Object.values(graph)) {
    for (const edge of vertex.out) {
      result += to_string_field(vertex_name_to_id[edge.from]) + consts.FIELD_DELIM;
      result += to_string_field(vertex_name_to_id[edge.to])   + consts.FIELD_DELIM;
      result += to_string_field(edge.transition)              +
                to_string_field(edge.pop_symbol)              +
                to_string_field(edge.push_symbol)             +
                to_string_field(edge.mealy_output)            +
                to_string_field(edge.move)                    + consts.FIELD_DELIM;
      result += to_string_field(Math.round(edge.a1*10))       + consts.FIELD_DELIM;
      result += to_string_field(Math.round(edge.a2*10))       + consts.FIELD_DELIM;
      result += to_string_field(Math.round(edge.angle1*10))   + consts.FIELD_DELIM;
      result += to_string_field(Math.round(edge.angle2*10))   + consts.EDGE_DELIM;
    }
  }

  return result;
}

/**
 * find the type of the graph and return it along with the rest of the unparsed graph string
 * @param {string} graph_str - the string representation of the graph
 * @returns {Array<string>} type of the graph in {'NFA', 'PDA', 'Turing'} and the rest of the unparsed graph string
 */
function parse_type(graph_str) {
  for (const type of Object.values(consts.MACHINE_TYPES)) {
    if (graph_str.startsWith(type)) {
      return [type, graph_str.slice(type.length)];
    }
  }
  throw new Error('Invalid graph type');
}

/**
 * basically the 'fromString' method for the graph
 * @param {string} graph_str - the string representation of the graph
 * @returns {Array<string|Object>} type of the graph in {'NFA', 'PDA', 'Turing'} and the graph
 */
export function deserialize(graph_str) {
  const graph = {};
  const [type, typeless_graph_str] = parse_type(graph_str);

  if (typeless_graph_str.length === 0) {  // the degenerate case when there is no vertex
    return [type, graph];
  }

  const split_by_vertex = typeless_graph_str.split(consts.VERTEX_DELIM);
  const vertices = split_by_vertex.slice(0, -1);
  const rest = split_by_vertex[split_by_vertex.length - 1];

  const vertex_id_to_name = [];

  for (const vertex of vertices) {
    const fields = vertex.split(consts.FIELD_DELIM).map(decodeURIComponent);
    const name          = fields[0];
    const y             = parseFloat(fields[1]);
    const x             = parseFloat(fields[2]);
    const r             = parseFloat(fields[3]);
    // backwards compatibility (in case an older permalink doesn't contain this field)
    const moore_output  = (fields.length === 6) ? fields[4] : consts.DEFAULT_MOORE_OUTPUT;
    const composite_bit = (fields.length === 6) ? parseInt(fields[5]) : parseInt(fields[4]);
    graph[name] = graph_components.make_vertex(name, x, y, r, composite_bit&1, composite_bit&2, undefined, moore_output);
    vertex_id_to_name.push(name);  // construct the mapping from id to name
  }

  if (rest.length === 0) {  // the degenerate case when there is no edge
    return [type, graph];
  }

  const edges = rest.split(consts.EDGE_DELIM).slice(0, -1);
  for (const edge of edges) {
    const fields = edge.split(consts.FIELD_DELIM).map(decodeURIComponent);
    const from          = vertex_id_to_name[parseInt(fields[0])];
    const to            = vertex_id_to_name[parseInt(fields[1])];
    const composite_str = fields[2];
    const transition    = composite_str.charAt(0);
    const pop_symbol    = composite_str.charAt(1);
    const push_symbol   = composite_str.charAt(2);
    // backwards compatibility (in case an older permalink doesn't contain this field)
    const mealy_output  = (composite_str.length === 5) ? composite_str.charAt(3) : consts.DEFAULT_MEALY_OUTPUT;
    const move          = (composite_str.length === 5) ? composite_str.charAt(4) : composite_str.charAt(3);
    const a1            = parseFloat(fields[3])/10.0;
    const a2            = parseFloat(fields[4])/10.0;
    const angle1        = parseFloat(fields[5])/10.0;
    const angle2        = parseFloat(fields[6])/10.0;
    graph[from].out.push(graph_components.make_edge(
      from, to, transition, a1, a2, angle1, angle2, pop_symbol, push_symbol, move, mealy_output
    ));
  }

  return [type, graph];
}
