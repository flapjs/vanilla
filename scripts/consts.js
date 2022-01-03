/**  @module consts */

/** @constant {Array<int>} mouse buttons */
export const [LEFT_BTN, MID_BTN, RIGHT_BTN] = [0, 1, 2];

/** @constant {function} place holder function */
export const EMPTY_FUNCTION = () => {};

/** @constant {float} [ms] the maximum time between mousedown and mouseup still considered as click */
export const CLICK_HOLD_TIME = 300;

/** @constant {float} [ms] the maximum time between successive clicks considered as double click */
export const DOUBLE_CLICK_TIME = 300;

/** @constant {int} [px] it is not a constant since we might zoom in and out */
export const DEFAULT_VERTEX_RADIUS = 40;

/** @constant {float} wrt vertex radius */
export const START_TRIANGLE_SCALE = 0.6;

/** @constant {int} [px] length of the edge arrow */
export const ARROW_LENGTH = 15;

/** @constant {int} [px] total width of the edge arrow */
export const ARROW_WIDTH = 10;

/** @constant {string} default transition too */
export const EMPTY_TRANSITION = 'ε';

/** @constant {string} localstore key to the history stack */
export const HIST_KEY = '%history';

/** @constant {string} localstore key to pointer to the top of the history stack */
export const HIST_TIP_KEY = '%hist_tip';

/** @constant {string} localstore key to pointer to the currently displayed graph */
export const HIST_PTR_KEY = '%hist_ptr';

/** @constant {float} final zoom is ZOOM_SPEED*scroll_wheel_ticks */
export const ZOOM_SPEED = 0.001;

/** @constant {float} bigger number means edge follows text more closely */
export const EDGE_CURVATURE = 0.5;

/** @constant {float} fraction of the radius of the outer circle */
export const FINAL_CIRCLE_SIZE = 0.8;
