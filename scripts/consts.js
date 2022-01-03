/**  @module consts */

/** @constant {int} LEFT_BTN - left mouse buttons */
export const LEFT_BTN = 0;

/** @constant {int} MID_BTN - mouse buttons */
export const MID_BTN = 1;

/** @constant {int} RIGHT_BTN - mouse buttons */
export const RIGHT_BTN = 2;

/** @constant {function} EMPTY_FUNCTION - place holder function */
export const EMPTY_FUNCTION = () => {};

/** @constant {float} CLICK_HOLD_TIME - [ms] the maximum time between mousedown and mouseup still considered as click */
export const CLICK_HOLD_TIME = 300;

/** @constant {float} DOUBLE_CLICK_TIME - [ms] the maximum time between successive clicks considered as double click */
export const DOUBLE_CLICK_TIME = 300;

/** @constant {int} DEFAULT_VERTEX_RADIUS - [px] it is not a constant since we might zoom in and out */
export const DEFAULT_VERTEX_RADIUS = 40;

/** @constant {float} START_TRIANGLE_SCALE - wrt vertex radius */
export const START_TRIANGLE_SCALE = 0.6;

/** @constant {int} ARROW_LENGTH - [px] length of the edge arrow */
export const ARROW_LENGTH = 15;

/** @constant {int} ARROW_WIDTH - [px] total width of the edge arrow */
export const ARROW_WIDTH = 10;

/** @constant {string} EMPTY_TRANSITION - default transition too */
export const EMPTY_TRANSITION = 'ε';

/** @constant {string} HIST_KEY - localstore key to the history stack */
export const HIST_KEY = '%history';

/** @constant {string} HIST_TIP_KEY - localstore key to pointer to the top of the history stack */
export const HIST_TIP_KEY = '%hist_tip';

/** @constant {string} HIST_PTR_KEY - localstore key to pointer to the currently displayed graph */
export const HIST_PTR_KEY = '%hist_ptr';

/** @constant {float} ZOOM_SPEED - final zoom is ZOOM_SPEED*scroll_wheel_ticks */
export const ZOOM_SPEED = 0.001;

/** @constant {float} EDGE_CURVATURE - bigger number means edge follows text more closely */
export const EDGE_CURVATURE = 0.5;

/** @constant {float} FINAL_CIRCLE_SIZE - fraction of the radius of the outer circle */
export const FINAL_CIRCLE_SIZE = 0.8;
