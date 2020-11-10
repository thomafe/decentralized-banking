const request = require('request');

export class Partner {

    address: string;

    constructor(address: string) {
        this.address = address;
    }

    getHash(){
        return new Promise((resolve, reject) => {

            const options = {
                uri: this.address + "/hash",
                method: 'GET',
            };

            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(body);
                } else {
                    resolve(null);
                }
            });

        });
    }

    getAccounts(){
        return new Promise((resolve, reject) => {

            const options = {
                uri: this.address + "/",
                method: 'GET',
            };

            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(JSON.parse(body));
                } else {
                    resolve(null);
                }
            });

        });
    }

    submit(sender: string, receiver: string, amount: number): Promise<string> {
        return new Promise((resolve, reject) => {

            const options = {
                uri: this.address + "/" + sender + "/" + receiver + "/" + amount,
                method: 'PUT',
                json: {
                    sender: sender,
                    receiver: receiver,
                    amount: amount
                }
            };

            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(body);
                } else {
                    resolve(null);
                }
            });

        });
    }

}
