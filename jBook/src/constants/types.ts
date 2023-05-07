/***
 * Message type which is intaracts with workers.
 * 
 * */ 
export interface iMessage {
    order: iOrderToWorker;
};

type iOrderToWorker = "bundle" | "jsxhighlight" | "eslint";