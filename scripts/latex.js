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

function closestTo(arr, vert1) {
    let sortedX = arr.toSorted((v1, v2) => v1.x - v2.x);
    let sortedY = arr.toSorted((v1, v2) => v1.y - v2.y);

    let xRel = sortedX.indexOf(vert1);
    let yRel = sortedY.indexOf(vert1);

    // js does not throw error, instead 'undefined'
    let xOptions = [sortedX[xRel - 1], sortedX[xRel + 1]];
    let yOptions = [sortedY[yRel - 1], sortedY[yRel + 1]];

    let closestX = null;
    for(let xNeighbor of xOptions) {
        if(xNeighbor) {
            if(closestX == null) {closestX = xNeighbor; continue;} 
            if(Math.abs(closestX.x - vert1.x) > Math.abs(xNeighbor.x - vert1.x)) {
                closestX = xNeighbor;
            }
        }
    }

    let closestY = null;
    for (let yNeighbor of yOptions) {
        if (yNeighbor) {
            if (closestY == null) { closestY = yNeighbor; continue; }
            if (Math.abs(closestY.y - vert1.y) > Math.abs(yNeighbor.y - vert1.y)) {
                closestY = yNeighbor;
            }
        }
    }

    if(Math.abs(closestY - vert1.y) < Math.abs(closestX - vert1.x)) {
        return closestY;
    } else {
        return closestX;
    }
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
        console.log(`${v.name}: ${vertex.name}`);
        output += `\\node[${inner}] (${v.name}) {${v.name}} \n`;
    }

    console.log(output);
}