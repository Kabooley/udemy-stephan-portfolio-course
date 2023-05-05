import * as TypeScriptType from "typescript";

interface iClassification {
    // IRange properties
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    // 

};


interface iSyntaxHighlightMessageData {
    code: string;
    title: string;
    version: string;
};
  

self.importScripts(
    'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.0.4/typescript.min.js',
);

declare const ts: typeof TypeScriptType;
  
function getLineNumberAndOffset(start: number, lines: number[]) {
    let line = 0;
    let offset = 0;
    while (offset + lines[line] < start) {
      offset += lines[line] + 1;
      line += 1;
    }
  
    return { line: line + 1, offset };
}
  
function nodeToRange(node) {
  if (
    typeof node.getStart === 'function' &&
    typeof node.getEnd === 'function'
  ) {
    return [node.getStart(), node.getEnd()];
  } else if (
    typeof node.pos !== 'undefined' &&
    typeof node.end !== 'undefined'
  ) {
    return [node.pos, node.end];
  }
  return [0, 0];
}

/**
 * Array.prototype.find()とTypeScriptの統合
 * 
 * */ 
function getNodeType(
    parent: TypeScriptType.SourceFile, 
    node: TypeScriptType.Node
) {
  return Object.keys(parent).find((key) => parent[key as keyof typeof parent] === node);
};

// Previous:
// 
// function getNodeType(
//     parent: TypeScriptType.SourceFile, 
//     node: TypeScriptType.Node
// ) {
//   return Object.keys(parent).find(key => parent[key] === node);
// }

function getParentRanges(node) {
  const ranges = [];
  const [start, end] = nodeToRange(node);
  let lastEnd = start;

  ts.forEachChild(node, child => {
    const [start, end] = nodeToRange(child);

    ranges.push({
      start: lastEnd,
      end: start,
    });
    lastEnd = end;
  });

  if (lastEnd !== end) {
    ranges.push({
      start: lastEnd,
      end,
    });
  }

  return ranges;
}

function addChildNodes(
    node: TypeScriptType.SourceFile, 
    lines: number[], 
    classifications: iClassification[]
) {
  const parentKind = ts.SyntaxKind[node.kind];

  /**
   * function forEachChild<T>(node: Node, cbNode: (node: Node) => T | undefined, cbNodes?: (nodes: NodeArray<Node>) => T | undefined): T | undefined;
     * @param node a given node to visit its children
     * @param cbNode a callback to be invoked for all child nodes
     * @param cbNodes a callback to be invoked for embedded array
   * 
   * */ 
  ts.forEachChild(node, id => {
    const type = getNodeType(node, id);

    classifications.push(
      ...getParentRanges(id).map(({ start, end }) => {
        const { offset, line: startLineNumber } = getLineNumberAndOffset(
          start,
          lines
        );
        const { line: endLineNumber } = getLineNumberAndOffset(end, lines);

        return {
          startColumn: start + 1 - offset,
          endColum: end + 1 - offset,
          kind: ts.SyntaxKind[id.kind],
          parentKind,
          type,
          startLineNumber,
          endLineNumber,
        };
      })
    );

    addChildNodes(id, lines, classifications);
  });
};


// Respond to message from parent thread
self.onmessage = (event: MessageEvent</* TODO: DEFINE */>) => {
  const { code, title, version }: iSyntaxHighlightMessageData = event.data;
  try {
    const classifications: iClassification[] = [];
    
    const sourceFile: TypeScriptType.SourceFile = ts.createSourceFile(
      title,
      code,
      ts.ScriptTarget.ES6,
      true
    );
    const lines: number[] = code.split('\n').map(line => line.length);

    addChildNodes(sourceFile, lines, classifications);

    self.postMessage({ classifications, version });
  } catch (e) {
    /* Ignore error */
  }
});
