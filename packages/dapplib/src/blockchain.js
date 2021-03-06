const { Solana } = require('./solana');
const bs58 = require('bs58');
const { struct } = require('buffer-layout');


module.exports = class Blockchain {

    /**
     * @dev Reads data from an account
     */
    static async get(env, accountName) {
        let solana = new Solana(env.config);
        let account = env.config.programInfo.programAccounts[accountName];
        if (!account) {
            throw new Error(`Account ${accountName} does not exist.`);
        }

        let accountInfo = await solana.getAccountInfo(account.publicKey); // Convert from base58
        let layoutItem = Solana.getDataLayouts().filter((item) => { return item.name === accountName });
        let layout = layoutItem.length > 0 ? layoutItem[0].layout : null;
        let resultData = null;

        let accda = accountInfo.data
        let chunks = [], i = 8, n = accda.length, len = 74;
        chunks.push(accda.slice(i, i += 74));
        while (i < n) {
            chunks.push(accda.slice(i, i += len));
        }

        if (accountInfo && layout) {
            resultData = layout.decode(accountInfo.data);
        }


        return {
            callAccount: account.publicKey,
            callData: chunks
        }
    }

    /**
     * @dev Updates an account's data
     */
    static async put(env, accountName, data) {
        let solana = new Solana(env.config);

        let txReceipt = await solana.submitTransaction({
            keys: [{ pubkey: Solana.getPublicKey(env.config.programInfo.programAccounts[accountName].publicKey), isSigner: false, isWritable: true }],
            payer: Solana.getSigningAccount(bs58.decode(env.config.programInfo.programAccounts['payer'].privateKey)),
            programId: Solana.getPublicKey(env.config.programInfo.programId),
            data
        });

        let network = env.config.httpUri.indexOf('devnet') ? 'devnet' : 'mainnet';
        return {
            txHash: txReceipt,
            explorer: `https://explorer.solana.com/tx/${txReceipt}?cluster=${network}`
        }
    }

    /**
     * @dev Calls a program function
     */
    static async post(env, tx, args) {
        return 'Not implemented';
    }
}
