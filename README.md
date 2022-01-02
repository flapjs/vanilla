# Welcome to [`flap.js`](https://flapjs.github.io/vanilla/)
This is a vanilla js rewrite of the [`flap.js`](https://github.com/flapjs/webapp) project. Alternatively, you can consider this a minimal [JFLAP](https://www.jflap.org/) clone in javscript so people only need their browser.

# Technical Overview

## Machine Representation
To keep things simple, a finite automaton is represented by an adjacency list, and this is the single source of truth. The adjacency list is implemented as a dictionary, with each vertex not only having its neighbors but also some additional information. Here is an example
```
const vertex = {
  x: 640,
  y: 360,
  r: 24,
  is_start: true,
  is_final: false,
  out: [edge1, edge2, ...],
};
```
For each edge, if the edge is not a self loop, then this data scheme is employed
```
const edge = { transition: 'ε', from: 'q1', to: 'q0', a1: 0.4, a2: 0.3 };
```
Otherwise, the edge is a self loop, and we store two other vectors to make the drawing work
```
const edge = { transition: 'ε', from: 'q0', to: 'q0', a1: 0.5, a2: 1.0, angle1: Math.pi/2, angle2: Math.pi };
```
More detail regarding `a1`, `a2`, `angle1`, `angle2` will be discussed below.

## Drawing
There is no front end frameworks involved. For drawing the nodes, the `canvas` element from `html5` is used. As the name suggests, when drawing on a `canvas`, we are manipulating individual pixels on the screen. Therefore, most graphical operations require a complete redraw of the screen.

The drawing of edges uses the quadratic bezier curve provided by `canvas`. We specify the control point relative to where the vertices are placed so that the edges move with the vertices. In the diagram below, the red dot is the start, green dot is the control and the blue dot is the end. Moreover, the control point is stored in terms of the basis `v1` and `v2` so we get to write the control in terms of where the vertices are placed. The linear combination `a1*v1 + a2*v2` gives the coordinate of the control in terms of the standard basis (sans a translation constant).
![edge_mechanics](edge_mechanics.png)
