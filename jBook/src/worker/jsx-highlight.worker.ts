import type * as TypeScriptType from "typescript";
// import ts from "typescript";  

self.importScripts(
    'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.0.4/typescript.min.js',
);

// TODO: 結局tsはmoduleでimportするべきでimportScripts入らないのか確認
declare const ts: typeof TypeScriptType;

// Data type to sent main thread.
export interface iClassification {
    // IRange properties
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    // strings to be used as IModelDecorationOptions.inlineclassname
    kind: string;  //TypeScriptType.SyntaxKind;
    parentKind: string;  //TypeScriptType.SyntaxKind;
    // TODO: undefinedのチェック機能
    type: string | undefined;  //TypeScriptType.Node
};

// MessageData sent from main thread.
interface iSyntaxHighlightMessageData {
    code: string;
    title: string;
    version: string;
};

  
function getLineNumberAndOffset(start: number, lines: number[]) {
    let line = 0;
    let offset = 0;
    while (offset + lines[line] < start) {
      offset += lines[line] + 1;
      line += 1;
    }
  
    return { line: line + 1, offset };
}
  
function nodeToRange(node: TypeScriptType.Node): number[] {
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
 * TODO: 最終的に何を返すことになるのか再確認
 * 
 * @param {TypeScriptType.Node} parent - TypeScriptType.SourceFileでもある
 * */ 
function getNodeType(
    parent: TypeScriptType.Node, 
    node: TypeScriptType.Node
) {
  return (Object.keys(parent) as Array<keyof typeof parent>).find((key) => parent[key as keyof typeof parent] === node);
};

// Previous:
// function getNodeType(
//     parent: TypeScriptType.SourceFile, 
//     node: TypeScriptType.Node
// ) {
//   return Object.keys(parent).find(key => parent[key] === node);
// }

function getParentRanges(node: TypeScriptType.Node): { start: number, end: number}[] 
{
  const ranges: { start: number, end: number}[] = [];
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
};

/***
 * @param {TypeScriptType.Node} node - `TypeScriptType.SourceFile`も受け付けることができている理由は不明。
 * 
 * */ 
function addChildNodes(
    // node: TypeScriptType.SourceFile, 
    node: TypeScriptType.Node, 
    lines: number[], 
    classifications: iClassification[]
) {

  /***
   * nodeのchildNodeひとつひとつをコールバック関数の引数として、コールバック関数を呼出す。
   * @param {TypeScriptType.Node} id - idとかいっているけどchildNode
   * */ 
  ts.forEachChild<void>(node, id => {
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
          endColumn: end + 1 - offset,
          startLineNumber,
          endLineNumber,
          // NOTE: object[x] が stringを返すので厳密には異なる型だけど
          // 最終的にstringとして扱われるのでヨシ
          kind: ts.SyntaxKind[id.kind],
          parentKind: ts.SyntaxKind[node.kind],
          type,
        };
      })
    );

    addChildNodes(id, lines, classifications);
  });
};


// Respond to message from parent thread
self.onmessage = (event: MessageEvent<iSyntaxHighlightMessageData>) => {
  const { code, title, version }: iSyntaxHighlightMessageData = event.data;
  try {
    const classifications: iClassification[] = [];
    
    const sourceFile: TypeScriptType.SourceFile = ts.createSourceFile(
      title,
      code,
      // TODO: codeのscripttargetと合わせること
      ts.ScriptTarget.ES2016,
      true
    );
    const lines: number[] = code.split('\n').map(line => line.length);

    addChildNodes(sourceFile, lines, classifications);

    self.postMessage({ classifications, version });
  } catch (e) {
    /* Ignore error */
    console.error(e);
  }
};
