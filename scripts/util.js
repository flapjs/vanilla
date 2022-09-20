/** @module util */

export class Queue {
  constructor() {
    this.arr = [];
    this.head_idx = 0;
    this.tail_idx = 0;
  }
  enqueue(item) {
    this.arr[this.tail_idx++] = item; 
  }
  front() {
    return this.arr[this.head_idx]; 
  }
  dequeue() {
    const val = this.arr[this.head_idx];
    if (val) {
      delete this.arr[this.head_idx++]; 
    }
    return val;
  }
  get entire_queue() {
    return this.arr.slice(this.head_idx, this.tail_idx-this.head_idx);
  }
  get length() {
    return this.tail_idx - this.head_idx; 
  }
}

/**
 * compare the equality of the two objects
 * @param {string|number|Object} obj1 - object 1
 * @param {string|number|Object} obj2 - object 2
 * @returns {boolean} true iff equal
 */
export function deep_equal(obj1, obj2) {
  if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1), keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {  // key length doesn't match
    return false;
  }
  for (const key of keys1) {
    if (!deep_equal(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}
