import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import { createDBInstance } from '../../storage';


const cacheDB: LocalForage = createDBInstance({
    name: 'modules cache'
});


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
                const cachedResult = await cacheDB.getItem<esbuild.OnLoadResult>(args.path);
                if(cachedResult) {
                    // DEBUG: 
                    console.log("[unpkgPathPlugin] Load cached data.");
                    result = cachedResult;
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
                    cacheDB.setItem<esbuild.OnLoadResult>(args.path, result);
                }
                return result;
            });
        }
    }
}