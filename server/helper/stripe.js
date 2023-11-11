import config from "config";
const stripeScrecteKey = config.get('stripe_secret_key')
var stripe = require('stripe')(stripeScrecteKey);


const createToken = async (number, month, year, cvv) => {
    const token = await stripe.tokens.create({
        card: {
            number: number || '4242424242424242',
            exp_month: month || 1,
            exp_year: year || 26,
            cvc: cvv || '123',
        },
    });
    return token;
};


const createCustomer = async (stripeToken) => {
    const customer = await stripe.customers.create({
        description: 'Stripe API customer create.',
        source: stripeToken
    });
    return customer;
};

const createCharge = async (amount, tokenId, currency) => {
    const charge = await stripe.charges.create({
        amount: amount * 100,
        currency: currency,
        source: tokenId,
        description: 'Stripe API charge create',
    });
    return charge;
};

const retrieveToken = async (stripeToken) => {
    const result = await stripe.tokens.retrieve(stripeToken);
    return result;
};

const paymentIntent = async (amount, cardId, customerId) => {
    const result = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: 'usd',
        payment_method_types: ['card'],
        payment_method: cardId,
        customer: customerId
    });
    return result;
}

const createPayout = async (amount, destinationAccount) => {
    // const payout = await stripe.payouts.create({
    //     amount: amount * 100,
    //     currency: 'usd',
    //     method: "individual",
    //     destination: destinationAccount,
    //     source_type: "bank"
    // });
    // return payout;
    const payout = await stripe.payouts.create(
        {
            amount: Number(amount) * 100,
            currency: 'usd',
            //   method: 'instant',
        },
        {
            stripeAccount: destinationAccount,
        }
    );
    return payout
}
const createbankAccount = async (country, account_holder_name, routing_number, account_number) => {
    const bankAccountData = {
        country: country,
        currency: "usd",
        account_holder_name: account_holder_name,
        account_holder_type: 'individual',
        routing_number: routing_number,
        account_number: account_number
    };
    const bankAccountToken = await stripe.tokens.create({
        bank_account: bankAccountData,
    });
    return bankAccountToken;
}

const verifyBankAccount = async (customerId, bankId) => {
    const bankAccount = await stripe.customers.verifySource(
        customerId,
        bankId,
        { amounts: [32, 45] }
    );
    return bankAccount
}

const customerSource = async (customerId, bankId) => {
    const bankAccount = await stripe.customers.createSource(
        customerId,
        { source: bankId }
    );
}

const productCreate = async () => {
    const product = await stripe.products.create({
        name: 'Depoist',
    });

    return product.id;
}

const priceCreate = async (amount, tokenId, currency) => {
    const price = await stripe.prices.create({
        unit_amount: amount,
        currency: currency,
        product: tokenId,
    });

    return price.id;
}

const createLink = async (price) => {
    const paymentLink = await stripe.paymentLinks.create({
        line_items: [
            {
                price: price,
                quantity: 1,
            },
        ],
        after_completion: {
            type: 'redirect',
            redirect: { url: "https://chat.openai.com/" }  // yhn par fornt ned k url ayga

        },
    });
    console.log("============================>>paymentLink", paymentLink)
    return paymentLink.url;
}

const checkOutsessioncreate = async (priceId, customerId, success, failure) => {
    const session = await stripe.checkout.sessions.create({
        success_url: success,//success url
        cancel_url: failure,//failure url
        line_items: [
            { price: priceId, quantity: 1 }
        ],
        mode: 'payment',
        customer: customerId//save customer referenceid 
    });
    return session
}

const createCustomerUsingEmailAndName = async (name, email) => {
    const customer = await stripe.customers.create({
        name: name,
        email: email
    });
    console.log("====================>>>>customer", customer)
    return customer.id;
};
const getStripeBalance = async () => {
    const customer = await stripe.balance.retrieve();
    console.log("====================>>>>balance", customer)
    return customer
};
const accountCreate = async (email) => {
    const account = await stripe.accounts.create({
        type: 'custom',
        country: 'US',
        email: email,
        business_type: 'individual',
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
    });
    return account.id
}

const updateAccount = async (id, ip) => {
    const accountupdate = await stripe.accounts.update(
        id,
        {
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: ip,
                // user_agent: req.get('User-Agent')
                // business_profile: {
                //     mcc: "7399",
                //     url: "https://fast.com"
                // },
                // individual: {
                //     address: {
                //         city: "Suite 164",
                //         line1: "1117 East Putnam Avenue, suite #164",
                //         postal_code: "06878",
                //         state: "Connecticut"
                //     },
                //     dob: {
                //         day: "25",
                //         month: "04",
                //         year: "1996"
                //     },
                //     email: "no-vishnu@mobiloite.com",
                //     first_name: "vishnu",
                //     last_name: "deo",
                //     phone: "8521529565"
                // }
            }
        }
    );
    return accountupdate.id
}
const externalAccount = async (id, holderName, routingNumber, accountNumber) => {
    const account = await stripe.accounts.createExternalAccount(
        id,
        {
            "external_account": {
                "object": "bank_account",
                "country": "US",
                "currency": "usd",
                "account_holder_name": holderName,
                "account_holder_type": "individual",
                "routing_number": routingNumber,
                "account_number": accountNumber
            }
        }
    );
    return account
}

const transfers = async (amount, destination) => {
    const transfer = await stripe.transfers.create({
        amount: Number(amount) * 100,
        currency: "usd",
        destination: destination,
    });

    return transfer
}

const getPayoutInformation = async (id) => {
    // console.log("=====================<<<>>", id)
    try {
        const payouts = await stripe.payouts.retrieve('po_1NrnKWPbZU9xlMBpxdcuQL6s');
        // const payout = await stripe.payouts.retrieve(
        //     'po_1NpUNhPbZU9xlMBpNQXoOHZT'
        //   );
        // const payouts = await stripe.payouts.list({
        //     limit: 3,
        // });
        console.log("payouts================>>", payouts)

        return payouts
    } catch (error) {
        console.log("====================>>", error)
    }

}





module.exports = {
    createToken,
    createCustomer,
    createCharge,
    retrieveToken,
    paymentIntent,
    createPayout,
    createbankAccount,
    verifyBankAccount,
    customerSource,
    productCreate,
    priceCreate,
    createLink,
    checkOutsessioncreate,
    createCustomerUsingEmailAndName,
    getStripeBalance,
    accountCreate,
    updateAccount,
    externalAccount,
    transfers,
    getPayoutInformation
};