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

/** @constant {int} DEFAULT_VERTEX_RADIUS - [px] it is not a constant since we might zoom in and out */
export const DEFAULT_VERTEX_RADIUS = 40;

/** @constant {int} EDGE_TEXT_SACALING - a fraction that multiplies the vertex radius to get the transition text size */
export const EDGE_TEXT_SACALING = 0.5;

/** @constant {float} START_TRIANGLE_SCALE - wrt vertex radius */
export const START_TRIANGLE_SCALE = 0.6;

/** @constant {int} ARROW_LENGTH - [px] length of the edge arrow */
export const ARROW_LENGTH = 15;

/** @constant {int} ARROW_WIDTH - [px] total width of the edge arrow */
export const ARROW_WIDTH = 10;

/** @constant {string} EMPTY_SYMBOL - no operation stack symbol */
export const EMPTY_SYMBOL = 'ε';

/** @constant {string} ARROW_SYMBOL - arrow symbol */
export const ARROW_SYMBOL = '→';

/** @constant {string} NFA - handle for NFA */
export const NFA = 'NFA';

/** @constant {string} Pushdown - handle for PDA */
export const Pushdown = 'Pushdown';

/** @constant {string} Turing - handle for Turing machine */
export const Turing = 'Turing';

/** @constant {string} DEFAULT_MACHINE - choice from ['NFA', 'Pushdown', 'Turing'] */
export const DEFAULT_MACHINE = NFA;

/** @constant {Object} HIST_KEYS - localstore key to the history stack */
export const HIST_KEYS = {
  NFA: '%nfa_history',
  Pushdown: '%pushdown_history',
  Turing: '%turing_history'
};

/** @constant {Object} HIST_TIP_KEYS - localstore key to pointer to the top of the history stack */
export const HIST_TIP_KEYS = {
  NFA: '%nfa_hist_tip',
  Pushdown: '%pushdown_hist_tip',
  Turing: '%turing_hist_tip'
};

/** @constant {Object} HIST_PTR_KEYS - localstore key to pointer to the currently displayed graph */
export const HIST_PTR_KEYS = {
  NFA: '%nfa_hist_ptr',
  Pushdown: '%pushdown_hist_ptr',
  Turing: '%turing_hist_ptr'
};

/** @constant {float} ZOOM_SPEED - final zoom is ZOOM_SPEED*scroll_wheel_ticks */
export const ZOOM_SPEED = 0.001;

/** @constant {float} EDGE_CURVATURE - bigger number means edge follows text more closely */
export const EDGE_CURVATURE = 0.5;

/** @constant {float} FINAL_CIRCLE_SIZE - fraction of the radius of the outer circle */
export const FINAL_CIRCLE_SIZE = 0.8;

/** @constant {string} LEFT - symbol for move tape left */
export const LEFT = 'L';

/** @constant {string} RIGHT - symbol for move tape right */
export const RIGHT = 'R';

/** @constant {string} TRAP_STATE - name of the trap state for a DFA */
export const TRAP_STATE = 'q_trap';

/** @constant {Object} TEXT_SIZING_CONSTS - a list of function params to correctly size texts */
export const TEXT_SIZING_CONSTS = {
  k: -0.208097,
  a: 3.96831,
  b: 6.36873  // note the accompanying function is e^(kx+a)+b
};
