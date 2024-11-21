/** @module latex */

// -------------------------------------------------------------
// @author Meruzhan Sargsyan
//
// A module used to export the graph as text used in tikzpicture
// for easily exporting graphs into latex files
// -------------------------------------------------------------

//----------------------------------------------
// Testing Notes:
// - clipboard only available in secure contexts
//----------------------------------------------

function dist(v1, v2) {
    return Math.sqrt(Math.pow((v1.x - v2.x),2) + Math.pow((v1.y - v2.y),2));
}

function closestTo(arr, vert1) {
    let closest = null;
    let minDist = Number.MAX_VALUE;
    for(const vert2 of arr) {
        if(vert2.name === vert1.name) continue;
        let distance = dist(vert1, vert2);
        if(distance < minDist) {
            closest = vert2;
            minDist = distance;
        }
    }

    return closest;
}

/**
 * @return string representation of graph in latex tikzpicture
 */
export function serialize(graph) {
    // setup
    let output = "\\begin{tikzpicture}[->,>=stealth',shorten >=1pt, auto, node distance=2cm, semithick]\n";
    output += "\\tikzstyle{every state}=[text=black, fill=none]\n";

    const vertices = Object.values(graph); 

    for(const v of vertices) {
        let inner = 'state,';
        if(v.is_start) inner += 'initial,';
        if(v.is_final) inner += 'accepting';

        let vertex = closestTo(vertices, v);
        if(!vertex) {
            console.log(`${v.name}: start`);
        } else {
            console.log(`${v.name}: ${vertex.name}`);
        }
        output += `\\node[${inner}] (${v.name}) {${v.name}} \n`;
    }

    console.log(output);
}