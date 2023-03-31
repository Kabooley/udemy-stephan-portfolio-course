import { useState } from 'react';
import Editor from './monacoEditor';

type iEditorMode = "editor" | "diffEditor";

export const Content = () => {
    const [editorMode, setEditorMode] = useState<iEditorMode>("editor");

    return (
        <>
            {
                editorMode === "editor"
                ? <Editor 
                    // TODO: actually need onchange and value
                />
                : <DiffEditor />
            }
        </>
    );
};