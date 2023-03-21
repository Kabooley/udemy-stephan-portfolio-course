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
export const fetchPlugins = (inputCode: string): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // Fetches modules on entry point file 
            build.onLoad({filter: /(^index\.js$)/ }, () => {
                return {
                    loader: 'jsx',
                    contents: inputCode
                }
            });

            // Check cached module
            build.onLoad({ filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                // Anyway load cached data.
                const cachedResult = await cacheDB.getItem<esbuild.OnLoadResult>(args.path);
                if(!cachedResult) {
                    return;
                }
                return cachedResult;
            });

            // CSS Modules will be embeded to HTML as style tag
            build.onLoad({filter: /\S+\.css$/ }, async (args: esbuild.OnLoadArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onLoad packages :" + args.path);

                let result: esbuild.OnLoadResult = {}; 
                const { data, request } = await axios.get(args.path);

                const escaped = data
                .replace(/\n/g, '')
                .replace(/"/g, '\\"')
                .replace(/'/g, "\\'");
                const content = `
                    const style = document.createElement("style");
                    style.innerText = '${escaped}';
                    document.head.appendChild(style);
                `;
        
                result = {
                    loader: 'jsx',
                    contents: content,
                    resolveDir: new URL("./", request.responseURL).pathname
                }
                cacheDB.setItem<esbuild.OnLoadResult>(args.path, result);
                return result;
            });

            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onLoad packages :" + args.path);

                let result: esbuild.OnLoadResult = {}; 
                
                const { data, request } = await axios.get(args.path);

                result = {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL("./", request.responseURL).pathname
                }
                cacheDB.setItem<esbuild.OnLoadResult>(args.path, result);
                return result;
            });
        }
    }
}