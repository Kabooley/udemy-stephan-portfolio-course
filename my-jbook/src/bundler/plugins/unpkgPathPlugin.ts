import * as esbuild from 'esbuild-wasm';

/**
 * @param {string} inputCode - ユーザがエディタに入力したコード
 * 
 * 
 * */ 
export const unpkgPathPlugin = (): esbuild.Plugin => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {

            // Solves entry point file.
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
       }
    }
}