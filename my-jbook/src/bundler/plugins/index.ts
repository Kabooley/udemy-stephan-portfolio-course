import * as esbuild from 'esbuild-wasm';
import axios from 'axios';


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

            // エントリポイントのindex.js専用
            build.onResolve({filter: /(^index\.js$)/}, (args: esbuild.OnResolveArgs) => {
                if(args.path === 'index.js') {
                    return {path: args.path, namespace: 'a'};
                }
            });

            // npmパッケージ他の解決
            // 
            build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
                // DEBUG:
                console.log("[unpkgPathPlugin] onResolve /.*/: ");
                console.log(args.path);
                console.log(args);

                return {
                    namespace: 'a',
                    path: `https://unpkg.com/${args.path}`
                };
            });

            // // npmパッケージの解決
            // build.onResolve({filter: /.*/}, (args: esbuild.OnResolveArgs) => {
            // });

            // -- on load --

            build.onLoad({filter: /(^index\.js$)/ }, () => {
                
                return {
                    loader: 'jsx',
                    contents: inputCode
                }
            });

            // npmパッケージの解決
            // 
            // so far so good.
            build.onLoad({filter: /.*/ }, async (args: esbuild.OnLoadArgs) => {
                const { data, request } = await axios.get(args.path);

                // DEBUG:
                console.log("[unpkgPathPlugin] onLoad packages :" + args.path);
                console.log(args);

                return {
                    loader: 'jsx',
                    contents: data
                }
            });
        }
    }
}