import {Partner} from "./Partner";
const crypto = require('crypto');

const express = require('express');
const app = express();

const port = parseInt(process.argv[2]);

// -- partner calls
const nodes: Array<Partner> = new Array<Partner>();
const accounts: { [account: string]: number } = {};

// ----------------------- API for Interaction with BankAccount (User Interface) ---------------------------------------

/**
 *  Get current database of all accounts and balances
 */
app.get("/all", (req, res) => {
    res.send(getDatabase());
})

/**
 * Get current database hash
 */
app.get("/hash", (req, res) => {
    res.send(getDatabaseHash());
})

/**
 * Get balance of one specific account (address)
 */
app.get('/:address', (req, res) => {
    return res.send(accounts[req.params.address].toFixed(0));
});

/**
 * Transfer to account
 */
app.post('/:sender/:receiver/:amount', async (req, res) => {

    // perform transaction locally
    const resultHash = doTransaction(req.params.sender, req.params.receiver, parseInt(req.params.amount));

    // if successful try to reach consensus with all nodes
    if (resultHash){
        const consensus = await submitTransfer(req.params.sender, req.params.receiver, parseInt(req.params.amount))

        // consensus compares with local hash => we reach and agreement
        if (consensus == resultHash) {
            console.log("Reached consensus with hash " + consensus);
            return res.sendStatus(200);
        } else {
            // revert the transaction
            console.log("Failed reaching consensus, reverting transaction");
            doTransaction(req.params.receiver, req.params.sender, parseInt(req.params.amount));
            res.sendStatus(400);
        }

    } else {
        res.sendStatus(400);
    }

});

// --------------------------------------- API for network communication -----------------------------------------------

/**
 * Called by other nodes when submitting new transaction
 */
app.put("/:sender/:receiver/:amount", (req, res) => {

    // perform transaction locally
    const resultHash = doTransaction(req.params.sender, req.params.receiver, parseInt(req.params.amount));

    if (resultHash)
        res.send(resultHash);
    else
        res.sendStatus(400);

});

// --------------------------------------- Application & WebServer -----------------------------------------------------

(async () => {
    console.log("Banking Client Starting");

    console.log(process.argv.slice(3).length +  " Partners provided");
    process.argv.slice(3).forEach(partner => {
        nodes.push(new Partner(partner));
    })

    console.log("Syncing with partners");
    const hashMap = {};
    let leadHashCount = 0;
    let leadHashNode = null;

    // ask each node for current hash and find the hash with most occurrence
    for(let node of nodes){
        const nodeHash:any = await node.getHash();
        if (nodeHash) {
            hashMap[nodeHash] = (hashMap[nodeHash] ? hashMap[nodeHash] : 0) + 1;
            if (hashMap[nodeHash] > leadHashCount){
                leadHashCount = hashMap[nodeHash];
                leadHashNode = node;
            }
        }
    }

    if (leadHashNode){
       console.log("Found leading hash (" + leadHashCount + ")");
       (await leadHashNode.getAccounts()).forEach(account => accounts[account.address] = account.balance);
        console.log("Synced (" + Object.keys(accounts).length + ") accounts");
    } else {
        console.error("Network empty, creating initially transfer");
        accounts["root"] = 1000;
    }

    // start web-server
    app.listen(port, () => {
        console.log(`Banking Client listening at http://localhost:${port}`)
    });
})();

const submitTransfer = async (sender: string, receiver: string, amount: number): Promise<string> => {

    // submit transfer to all clients and request hash
    const results = {};
    for(let node of nodes){
        const hash = await node.submit(sender, receiver, amount);
        if (hash){
            if (results[hash])
                results[hash]++;
            else
                results[hash] = 1;
        }
    }

    // compare and find hash with most occurrence's
    let maxConsensus = 0;
    let maxConsensusHash = "";
    Object.keys(results).forEach(hash => {
        if (results[hash] > maxConsensus) {
            maxConsensus = results[hash];
            maxConsensusHash = hash;
        }
    });

    // if at least one census was reached
    return (maxConsensus > 0) ? maxConsensusHash : null;
}

const doTransaction = (sender: string, receiver: string, amount: number): string => {

    // check if valid sender
    if (!accounts[sender])
        return null;

    // check if sender has enough balance
    const balanceSender = accounts[sender];
    if (balanceSender < amount)
        return null;

    // do transfer
    accounts[sender] = balanceSender - amount;
    accounts[receiver] = (accounts[receiver] ? accounts[receiver] : 0) + amount;

    console.log(`Transferred ${amount} from ${sender} to ${receiver}`);
    return getDatabaseHash();
}

const getDatabase = ():Array<{ address: string, balance: number }> => {
    return Object.keys(accounts)
        .map(account => {
            return { address: account, balance: accounts[account]}
        });
}

const getDatabaseHash = ():string => {
    let content = "";
    Object.keys(accounts).forEach(entry => {
        content += entry + ":" + accounts[entry] + ";"
    });
    return crypto.createHash('md5').update(content).digest('hex').toString();
}




