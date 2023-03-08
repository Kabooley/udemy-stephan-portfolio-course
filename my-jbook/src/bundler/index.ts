import * as esbuild from 'esbuild-wasm';

interface iBuildResult {
    code: string;
    err: string;
};


const initializeOptions: esbuild.InitializeOptions = {
    wasmURL:  './node_modules/esbuild-wasm/esbuild.wasm',
    worker: true
};

// const buildOptions: esbuild.BuildOptions = {
//     entryPoints: ['index.js'],
//     // explicitly specify bundle: true
//     bundle: true,
//     // To not to write result in filesystem.
//     write: false,
//     // To use plugins which solves import modules.
//     plugins: [],
// };

export const bundler = async (code: string): Promise<iBuildResult> => {
    try {
        // 必ずesbuildAPIを使い始める前に呼出す
        await esbuild.initialize(initializeOptions);

    //     // Filesystemはないのでネットワーク上から必要な依存関係を取得してくる
    //    const result = await esbuild.build(buildOptions);

    //    if(result === undefined) throw new Error;

    //    // DEBUG:
    //    for (let out of result.outputFiles!) {
    //      console.log(out.path, out.contents, out.text)
    //    };

    //    return {
    //     code: result.outputFiles![0].text,
    //     err: ''
    //    }

    
        // DEBUG: 
        console.log("[bundler]");
    
        // For a while, test with this transform code.
        const result = await esbuild.transform(code, {
            loader: 'jsx',
            target: 'es2015'
        });

        // DEBUG:
        console.log(result);

        return {
            code: result.code,
            err: ''
        };
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