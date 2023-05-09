/*****************************************************
 * Files for @monaco-editor/react models
 * 
 * https://github.com/suren-atoyan/monaco-react#multi-model-editor
 * ***************************************************/ 

export interface iFile {
    path: string;
    value: string;
    language: string;
};

export const files: { [path: string]: iFile } = {
    'javascript': {
        // will be passed to defaultPath or path property
        path: 'file:///jsmain.js',
        value: ``,
        language: 'javascript'
    },
    'typescript': {
        path: 'file:///tsmain.ts',
        value: ``,
        language: 'typescript'
    },
    'react': {
        path: 'file:///jsmain.jsx',
        value: ``,
        language: 'javascript'
    }, 
    'react-typescript': {
        path: 'file:///tsmain.tsx',
        value: ``,
        language: 'typescript'
    }
};
