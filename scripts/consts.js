/**  @module consts */

/** @constant {int} LEFT_BTN - left mouse buttons */
export const LEFT_BTN = 0;

/** @constant {int} MID_BTN - mouse buttons */
export const MID_BTN = 1;

/** @constant {int} RIGHT_BTN - mouse buttons */
export const RIGHT_BTN = 2;

/** @constant {function} EMPTY_FUNCTION - place holder function */
export const EMPTY_FUNCTION = () => {};

/** @constant {Object} EMPTY_GRAPH - empty graph object */
export const EMPTY_GRAPH = {};

/** @constant {float} CLICK_HOLD_TIME - [ms] the maximum time between mousedown and mouseup still considered as click */
export const CLICK_HOLD_TIME = 240;

/** @constant {float} DOUBLE_PRESS_TIME - [ms] the maximum time between key presses considered as a double press */
export const DOUBLE_PRESS_TIME = 240;

/** @constant {int} DEFAULT_VERTEX_RADIUS - [px] initial vertex radius */
export const DEFAULT_VERTEX_RADIUS = 40;

/** @constant {int} DEFAULT_VIZ_SIZE - [px] default text size for things like input visualization */
export const DEFAULT_VIZ_SIZE = 30;

/** @constant {float} INPUT_VIZ_WIDTH_R - a real between 0 and 1 controlling horizontal position of input viz*/
export const INPUT_VIZ_WIDTH_R = 0.01;

/** @constant {float} INPUT_VIZ_HEIGHT_R - a real between 0 and 1 controlling vertical position of input viz*/
export const INPUT_VIZ_HEIGHT_R = 0.94;

export const TAPE_VIEW_RADIUS = 5;

export const TAPE_LEFT_ARROW = '◀';
export const TAPE_RIGHT_ARROW = '▶';

/** @constant {string} READ_INPUT_COLOR - color assigned to input string that has already been processed */
export const READ_INPUT_COLOR = 'lightgray';

/** @constant {string} READ_INPUT_COLOR - color assigned to input string that is about to be processed */
export const CUR_INPUT_COLOR = 'darkcyan';

/** @constant {string} READ_INPUT_COLOR - color assigned to input string that is yet to be processed */
export const DEFAULT_INPUT_COLOR = 'black';

export const PDA_CONF_COLOR = 'rgba(255, 0, 0, 0.7)';

/** @constant {string} HIGH_LIGHTED_VERTEX_COLOR - color of the highlighted vertex */
export const HIGHLIGHTED_VERTEX_COLOR = 'rgba(96, 192, 128, 0.3)';

/** @constant {float} EDGE_TEXT_SACALING - a fraction of vertex radius to as the transition text size */
export const EDGE_TEXT_SACALING = 0.7;

/** @constant {float} PIXEL_PER_SIZE_1_LETTER - pixel per letter for font size 1 text. approximate */
export const PIXEL_PER_SIZE_1_LETTER = 0.275;

/** @constant {float} START_TRIANGLE_SCALE - wrt vertex radius */
export const START_TRIANGLE_SCALE = 0.6;

/** @constant {int} ARROW_LENGTH - [px] length of the edge arrow */
export const ARROW_LENGTH = 15;

/** @constant {int} ARROW_WIDTH - [px] total width of the edge arrow */
export const ARROW_WIDTH = 10;

/** @constant {string} EMPTY_SYMBOL - no operation stack symbol */
export const EMPTY_SYMBOL = 'ε';

/** @constant {string} EMPTY_TYPE - symbol for an empty cell of a Turing Machine */
export const EMPTY_TAPE = '☐';

/** @constant {string} ARROW_SYMBOL - arrow symbol */
export const ARROW_SYMBOL = '→';

/** @constant {Object} MACHINE_TYPES - a list of names for each machine mainly for iterations */
export const MACHINE_TYPES = {
  NFA: 'NFA',
  PDA: 'PDA',
  Turing: 'Turing'
};

/** @constant {string} DEFAULT_MACHINE - choice from ['NFA', 'PDA', 'Turing'] */
export const DEFAULT_MACHINE = MACHINE_TYPES.NFA;

/** @constant {Object} HIST_KEYS - localstore key to the history stack */
export const HIST_KEYS = {
  NFA: '%nfa_history',
  PDA: '%PDA_history',
  Turing: '%turing_history'
};

/** @constant {Object} HIST_TIP_KEYS - localstore key to pointer to the top of the history stack */
export const HIST_TIP_KEYS = {
  NFA: '%nfa_hist_tip',
  PDA: '%PDA_hist_tip',
  Turing: '%turing_hist_tip'
};

/** @constant {Object} HIST_PTR_KEYS - localstore key to pointer to the currently displayed graph */
export const HIST_PTR_KEYS = {
  NFA: '%nfa_hist_ptr',
  PDA: '%PDA_hist_ptr',
  Turing: '%turing_hist_ptr'
};

/** @constant {float} ZOOM_SPEED - final zoom is ZOOM_SPEED*scroll_wheel_ticks */
export const ZOOM_SPEED = 0.001;

/** @constant {float} EDGE_CURVATURE - bigger number means edge follows text more closely */
export const EDGE_CURVATURE = 0.5;

/** @constant {float} FINAL_CIRCLE_SIZE - fraction of the radius of the outer circle */
export const FINAL_CIRCLE_SIZE = 0.85;

/** @constant {string} LEFT - symbol for move tape left */
export const LEFT = 'L';

/** @constant {string} RIGHT - symbol for move tape right */
export const RIGHT = 'R';

/** @constant {string} TRAP_STATE - name of the trap state for a DFA */
export const TRAP_STATE = 'q_trap';

/** @constant {Object} TEXT_SIZING_CONSTS - a list of function params to correctly size texts */
export const TEXT_SIZING_CONSTS = {
  k: -0.20810,
  a: 3.96831,
  b: 6.36873  // note the accompanying function is e^(kx+a)+b
};

/** @constant {string} LEGAL_CHARS - a string consisting of all url-legal characters */
export const LEGAL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~:/?#[]@!$&\'()*+,;=';

/** @constant {string} FIELD_DELIM - delimiter for fields in a permalink */
export const FIELD_DELIM = ':';

/** @constant {string} VERTEX_DELIM - delimiter for vertices in a permalink  */
export const VERTEX_DELIM = ';';

/** @constant {string} EDGE_DELIM - delimiter for edges in a permalink  */
export const EDGE_DELIM = '~';
