/*******************************************************
 * Fetch libraries from CDN
 * *****************************************************/ 
self.onmessage = (e) => {
    const { order, path, version } = e.data;
    if(order !== "fetchLibs") return;

    fetchLibraries()
    .then()
    .catch((e) => {
        if (process.env.NODE_ENV !== 'production') {
            console.error(e);
          }
    });
}