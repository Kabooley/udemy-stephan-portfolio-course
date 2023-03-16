import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins';

interface iBuildResult {
    code: string;
    err: string;
};


const initializeOptions: esbuild.InitializeOptions = {
    wasmURL:  '/esbuild.wasm',
    worker: true
};

let isInitialized: boolean = false;


/**
 * @param { string } rawCode - The code that user typed and submitted.
 * 
 * */ 
export const bundler = async (rawCode: string): Promise<iBuildResult> => {
    try {
        
        // DEBUG: 
        // console.log("[bundler]");
        // console.log(rawCode);

        // 必ずesbuildAPIを使い始める前に呼出す
        if(!isInitialized) {
            await esbuild.initialize(initializeOptions);
            isInitialized = true;
        }

        const buildOptions: esbuild.BuildOptions = {
            entryPoints: ['index.js'],
            // explicitly specify bundle: true
            bundle: true,
            // To not to write result in filesystem.
            write: false,
            // To use plugins which solves import modules.
            plugins: [unpkgPathPlugin(rawCode)],
        };
        

       const result = await esbuild.build(buildOptions);

       // TODO: エラー内容を詳細にして
       if(result === undefined) throw new Error;

    //    // DEBUG:
    //    for (let out of result.outputFiles!) {
    //      console.log(out.path, out.contents, out.text)
    //    };

       return {
        code: result.outputFiles![0].text,
        err: ''
       }
    }
    catch(e) {
        if(e instanceof Error) {
            return {
              code: '',
              err: e.message,
            };
          }
          else throw e;
    }
};