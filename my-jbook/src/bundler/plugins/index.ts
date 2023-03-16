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
    content: string;
};

// Modules will be stored here.
const cachedModules: iCachedModule[] = [];

// HELPER method.
const getCachedModuleContent = (path: string): string | undefined => {
    const module: iCachedModule | undefined = cachedModules.find( m => m.path === path);
    if(module === undefined) return undefined;
    return module.content;
};



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
                console.log(args);
                console.log(request);

                // キャッシュ済かどうかは毎度チェックしないといかんが
                // 講義だとそれをnpmパッケージに丸投げしている
                return {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL("./", request.responseURL).pathname
                }
            });
        }
    }
}