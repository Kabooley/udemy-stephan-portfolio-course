import * as esbuild from 'esbuild-wasm';
import axios from 'axios';

/**
 * @property {string} path - 
 * @property {string} content - 
 * */ 
interface iCachedModule {
    // path of resources which is part of url.
    path: string;
    // Fetched content data.
    onLoadResult: esbuild.OnLoadResult;
};

/**
 * NOTE: Temporary to use.
 * 
 * TODO: This must use client storage api.
 * 
 * */ 
const cache = (() => {
    const _cache: iCachedModule[] = [];

    return {
        get: (path: string): esbuild.OnLoadResult | undefined => {
            const r: iCachedModule | undefined = _cache.find( m => m.path === path);
            if(r === undefined) return undefined;
            return r.onLoadResult;        
        },
        set: (path: string, onLoadResult: esbuild.OnLoadResult): void => {
            _cache.push({path,onLoadResult});
        }
    }
})();



/**
 * @param {string} inputCode - ユーザがエディタに入力したコード
 * 
 * 
 * */ 
export const unpkgPathPlugin = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // -- on resolve --

            build.onResolve({filter: /(^index\.js$)/}, (args: esbuild.OnResolveArgs) => {
                if(args.path === 'index.js') {
                    return {path: args.path, namespace: 'a'};
                }
            });

            // Solves related path
            build.onResolve({ filter: /^\.+\// }, (args: esbuild.OnResolveArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onResolve() filter: /^\.+\//");
                console.log(args);
                
                return {
                    namespace: 'a',
                    path: new URL(args.path, 'http://unpkg.com' + args.resolveDir + '/').href
                };
            })

            // Solves other path
            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onResolve() filter: /.*/");
                console.log(args);

                return {
                    namespace: 'a',
                    path: `http://unpkg.com/${args.path}`
                };
            });

            // -- on load --

            build.onLoad({filter: /(^index\.js$)/ }, () => {
                
                return {
                    loader: 'jsx',
                    contents: inputCode
                }
            });

            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onLoad packages :" + args.path);

                let result: esbuild.OnLoadResult = {}; 
                // Anyway load cached data.
                const cachedContent = cache.get(args.path);
                if(cachedContent !== undefined) {
                    // DEBUG: 
                    console.log("[unpkgPathPlugin] Load cached data.");
                    result = cachedContent;
                }
                else {
                    const { data, request } = await axios.get(args.path);
                    
                    // DEBUG:
                    console.log("[unpkgPathPlugin] cache new data.");
                    console.log(request);
    
                    result = {
                        loader: 'jsx',
                        contents: data,
                        resolveDir: new URL("./", request.responseURL).pathname
                    }
                    // Save result.
                    cache.set(args.path, result);
                }
                return result;
            });
        }
    }
}