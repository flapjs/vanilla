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

/**
 * @return string representation of graph in latex tikzpicture
 */
export function serialize(graph) {
    // setup
    let output = "\\begin{tikzpicture}[->,>=stealth',shorten >=1pt, auto, node distance=2cm, semithick]\n";
    output += "\\tikzstyle{every state}=[text=black, fill=none]\n";

    const vertices = Object.values(graph);

    vertices.forEach((v) => {
        let inner = 'state,';
        if(v.is_start) inner += 'initial,';
        if(v.is_final) inner += 'accepting';

        output += `\\node[${inner}] (${v.name}) {${v.name}}`;
    });

    console.log(output);
}