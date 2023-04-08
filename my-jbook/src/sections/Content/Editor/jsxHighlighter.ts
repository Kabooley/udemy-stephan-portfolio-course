/**
 * sample from: https://github.com/luminaxster/syntax-highlighter#tldr
 * */ 
import monaco from 'monaco-editor';
import {parse} from "@babel/parser";
import traverse from "@babel/traverse";
import MonacoJSXHighlighter from 'monaco-jsx-highlighter';

// Instantiate the highlighter
const monacoJSXHighlighter = new MonacoJSXHighlighter(
   monaco, parse, traverse, aMonacoEditor()
);
// Activate highlighting (debounceTime default: 100ms)
monacoJSXHighlighter.highlightOnDidChangeModelContent(100);
// Activate JSX commenting
monacoJSXHighlighter.addJSXCommentCommand();

// Done =)

function aMonacoEditor() {
   return monaco.editor.create(
      document.getElementById("editor"), {
         value: 'const AB=<A x={d}><B>{"hello"}</B></A>;',
         language: 'javascript'
      });
}