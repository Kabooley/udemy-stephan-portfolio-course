import localforage from 'localforage';

/***
 * NOTE: いかなるlocalforageのAPIを使うよりも前に呼び出さなくてはならない。
 * 
 * */ 
localforage.config({
    // 使用する優先ドライバー。他にlocalstorageやwebsqlもあるっぽい。
    driver: localforage.INDEXEDDB,
    // localStorage では、これは localStorage に格納されているすべてのキーのキー プレフィックスとして使用されます。
    name: "jBbook",
    // size: web sqlを使うなら指定できる
    // データストアの名前
    storeName: "jBbook_ds",
    // スキーマバージョン番号。1.0とする以外使わない。
    version: 1.0,
    description: "indexeddb for my-jbook app"
});

export const createDBInstance = (configs: LocalForageOptions): LocalForage => {
    return localforage.createInstance(configs);
};