/**  @module consts */

export const [LEFT_BTN, MID_BTN, RIGHT_BTN] = [0, 1, 2];  // mouse buttons
export const EMPTY_FUNCTION = () => {};  // place holder function
export const CLICK_HOLD_TIME = 300;  // [ms] the maximum time between mousedown and mouseup still considered as click
export const DOUBLE_CLICK_TIME = 300;  // [ms] the maximum time between successive clicks considered as double click
export const DEFAULT_VERTEX_RADIUS = 40;  // [px] it is not a constant since we might zoom in and out
export const START_TRIANGLE_SCALE = 0.6;  // wrt vertex radius
export const ARROW_LENGTH = 15;  // [px] length of the edge arrow
export const ARROW_WIDTH = 10; // [px] total width of the edge arrow
export const EMPTY_TRANSITION = 'ε';  // default transition too
export const HIST_KEY = "%history";  // localstore key to the history stack
export const HIST_TIP_KEY = "%hist_tip";  // localstore key to pointer to the top of the history stack
export const HIST_PTR_KEY = "%hist_ptr";  // localstore key to pointer to the currently displayed graph
export const ZOOM_SPEED = 0.001;  // final zoom is ZOOM_SPEED*scroll_wheel_ticks
export const EDGE_CURVATURE = 0.5;  // bigger number means edge follows text more closely
export const FINAL_CIRCLE_SIZE = 0.8;  // fraction of the radius of the outer circle
