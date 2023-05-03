import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from '../bundler/plugins/unpkgPathPlugin';
import { fetchPlugins } from '../bundler/plugins/fetch';

type iOrderToWorker = "bundle" | "jsxhighlight" | "eslint";

/***
 * @property {string} code - Code sent from main thread and about to be bundled.
 * @property {string} bundledCode - Bundled code to be send to main tread.
 * @property {Error | null} err - Error occured amoung bundling process.
 * @property {}
 * */ 
export interface iMessageBundleWorker {
    code?: string;
    bundledCode?: string;
    err?: Error | null;
    order: iOrderToWorker;
};

interface iBuildResult {
    code: string;
    err: string;
};

const initializeOptions: esbuild.InitializeOptions = {
    // wasmURL:  '/esbuild.wasm',
    worker: true,
    wasmURL: 'http://unpkg.com/esbuild-wasm@0.17.16/esbuild.wasm'
};

let isInitialized: boolean = false;

/**
 * Validate origin is valid or not.
 * */ 
const validateOrigin = (origin: string): boolean => {
    const expression = /^http:\/\/localhost\:8080\/?/;
    const regex = new RegExp(expression);

    return origin.match(regex) ? true : false;
};

/**
 * @param { string } rawCode - The code that user typed and submitted.
 * 
 * */ 
const bundler = async (rawCode: string): Promise<iBuildResult> => {
    try {
        console.log(isInitialized);
        
        // 必ずesbuildAPIを使い始める前に呼出す
        if(!isInitialized) {
            await esbuild.initialize(initializeOptions);
            isInitialized = true;
            console.log("initialized");
        }

        const buildOptions: esbuild.BuildOptions = {
            entryPoints: ['index.js'],
            // explicitly specify bundle: true
            bundle: true,
            // To not to write result in filesystem.
            write: false,
            // To use plugins which solves import modules.
            plugins: [fetchPlugins(rawCode), unpkgPathPlugin()],
        };
        

       const result = await esbuild.build(buildOptions);

       console.log(result);

       // TODO: エラー内容を詳細にして
       if(result === undefined) throw new Error;

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

self.onmessage = (e:MessageEvent<iMessageBundleWorker>): void => {

        
    // DEBUG: 
    console.log("[bundle.worker.ts] got message");
    console.log(e);
    console.log(self.location.origin);

    // Validate origin
    if(!validateOrigin(e.origin)) return;
    // Filter necessary message
    if(e.data.order !== "bundle") return;


    
    // DEBUG: 
    console.log("[bundle.worker.ts] start bundle process...");

    const { code } = e.data;

    if(code) {
        bundler(code)
        .then((result: iBuildResult) => {
            if(result.err.length) throw new Error(result.err);

            // DEBUG:
            console.log("[budle.worker.ts] sending bundled code");

            self.postMessage({
                bundledCode: result.code,
                err: null
            });
        })
        .catch((e) => {
            
            // DEBUG:
            console.log("[budle.worker.ts] sending Error");
            
            self.postMessage({
                bundledCode: "",
                err: e
            });
        });
    }
}