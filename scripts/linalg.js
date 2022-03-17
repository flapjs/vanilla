/** @module linalg */

/**
 * compute the length of a 2d vector
 * @param {Array<float>} vec - a vector whose length we want to compute
 * @returns {float} the length of the vector
 */
export function vec_len(vec) {
  return Math.sqrt(dot(vec, vec));
}

/**
 * computes the 2d dot product
 * @param {Array<float>} u - first vector
 * @param {Array<float>} v - second vector
 * @returns {float} <u, v> (u dot v)
 */
export function dot(u, v) {
  return u[0]*v[0] + u[1]*v[1];
}

/**
 * projection of the 2d vector u on to v
 * @param {Array<float>} u - first vector
 * @param {Array<float>} v - second vector (onto which to project the first)
 * @returns {Array<float>} the component of the first vector in the direction of the second
 */
export function proj(u, v) {
  const unit_v = normalize(v);
  const dot_prod = u[0]*unit_v[0] + u[1]*unit_v[1];
  return [dot_prod*unit_v[0], dot_prod*unit_v[1]];
}

/**
 * computes a orthogonal vector
 * @param {Array<float>} vec - a vector on which to calculate the orthogonal vector
 * @returns {Array<float>} a vector orthogonal of the original vector
 */
export function normal_vec(vec, clockwise=false) {
  return clockwise ? [vec[1], -vec[0]] : [-vec[1], vec[0]];
}

/**
 * normalizes a vector to a specific length
 * @param {Array<float>} vec - the vector you want to scale
 * @param {float} final_length - the length you want the final vector to end up
 * @returns {Array<float>} the normalized vector
 */
export function normalize(vec, final_length=1) {
  const adjusted_vec = [];
  const length_adj = vec_len(vec)/final_length;
  for (const component of vec) {
    adjusted_vec.push(component/length_adj);
  }
  return adjusted_vec;
}

/**
 * scale the 2d vector v by a scalar a
 * @param {float} a - the scalar
 * @param {Array<float>} v - the vector
 * @returns {Array<float>} av
 */
export function scale(a, v) {
  return [a*v[0], a*v[1]];
}

/**
 * 2d vector addition
 * @param {float|Array<float>} v1 
 * @param {Array<float>} v2 
 * @returns v1+v2
 */
export function add(v1, v2) {
  if (!isNaN(v1)) v1 = [parseFloat(v1), parseFloat(v1)];  // incase someone passes in a scalar
  return [v1[0]+v2[0], v1[1]+v2[1]];
}

/**
 * 2d vector subtraction
 * @param {Array<float>} v1
 * @param {Array<float>} v2
 * @returns v1-v2
 */
export function sub(v1, v2) {
  return [v1[0]-v2[0], v1[1]-v2[1]];
}

/**
 * calculate the linear combination of a1*v1+a2*v2, also known as the matrix vector product
 * @param {Array<float>} v1 - vector1
 * @param {Array<float>} v2 - vector2
 * @param {float} a1 - scalar1
 * @param {float} a2 - scalar2
 * @returns {Array<float>} the result of a1*v1+a2*v2
 */
export function linear_comb(v1, v2, a1=1, a2=1) {
  return add(scale(a1, v1), scale(a2, v2));
}

/**
 * determinant of a column major 2x2 matrix
 * @param {Array<float>} v1 - first column
 * @param {Array<float>} v2 - second column
 * @returns {float} det([v1, v2])
 */
export function det(v1, v2) {
  return v1[0]*v2[1]-v1[1]*v2[0];
}

/**
 * computes the inverse of a column major 2x2 matrix
 * @param {Array<float>} v1 - first column
 * @param {Array<float>} v2 - second column
 * @returns {Array<Array<float>>} the inverse matrix
 */
export function inv(v1, v2) {
  const inv_det = 1/det(v1, v2);
  return [scale(inv_det, [v2[1], -v1[1]]), scale(inv_det, [-v2[0], v1[0]])];
}
