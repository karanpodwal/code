import Joi from "joi";
const fs = require('fs');
import _ from "lodash";
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import responseMessage from '../../../../../assets/responseMessage';
import status from "../../../../enums/status";
import transactionType from "../../../../enums/transactionType";
import transStatusType from "../../../../enums/transactionStatus";
import requestStatus from '../../../../enums/requestStatus';
const axios = require('axios');
const qs = require('qs');
const uuid = require('uuid');

import { userServices } from "../../services/user"
const { findUser, updateUser } = userServices

import { depositServices } from "../../services/deposit";
const { createUserdepost } = depositServices;

import { chipServices } from "../../services/chip";
const { findChip, updateChip, chipList, createChip } = chipServices;
import { transactionServices } from '../../services/transaction';
const { createTransaction } = transactionServices;

const CLIENT_ID = config.get('paypal.client_id');// aashu
const CLIENT_SECRET = config.get('paypal.client_secret');// aashu
// const CLIENT_ID = "ATFt_qkzw7BkDfb7D9W4bCiWQUWcQ8ygVjM1drLb-LRuf1vOj_Cwv-fi5jSCkXWb6a8uN7blcoGiLRNh";// client
// const CLIENT_SECRET = "ATFt_qkzw7BkDfb7D9W4bCiWQUWcQ8ygVjM1drLb-LRuf1vOj_Cwv-fi5jSCkXWb6a8uN7blcoGiLRNh";// client

const PAYPAL_API_BASE = "https://api.sandbox.paypal.com";

import { requestForWithdrawServices } from '../../services/requestForWithdraw';
const { findRequestForWithdraw } = requestForWithdrawServices;


import paypal from 'paypal-rest-sdk';
import { items } from "joi/lib/types/array";
paypal.configure({
    'mode': config.get('paypal.mode'), //sandbox or live
    'client_id': config.get('paypal.client_id'),
    'client_secret': config.get('paypal.client_secret')
});


export class paypalController {


    /**
     * @swagger
     * /payment/generateAccessToken:
     *   get:
     *     summary: Paypal
     *     tags:
     *       - Paypal Payment
     *     description: To generate PayPal payment access token
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: PayPal deposit created successfully.
     *       400:
     *         description: Bad request, validation failed.
     *       500:
     *         description: Internal Server Error.
     */
    async generateAccessToken(req, res, next) {
        try {
            let data = qs.stringify({
                'grant_type': 'client_credentials'
            });
            const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                },
                data: data
            };

            const result = await axios.request(config);
            return res.json(new response(result.data, "Access token has been generated successfully."));

        } catch (error) {
            console.error("Error creating PayPal payment:", error);
            return next(error);
        }
    }

    //**************************************** Updated *****************************/


    /**
     * @swagger
     * /payment/buyChip:
     *   post:
     *     tags:
     *       - Paypal Payment
     *     description: buyCoin
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - in: body
     *         name: buyChip 
     *         description: amount in USD
     *         schema:
     *           type: object
     *           required:
     *             - amount
     *           properties:
     *             amount:
     *               type: string
     *             url:
     *               type: string
     *     responses:
     *       200:
     *         description: Successfully done.
     *       500:
     *         description: Internal server error.
     *       501:
     *         description: Something went wrong.
     */

    async buyChip(req, res, next) {
        const validationSchema = {
            amount: Joi.string().required(),
            url: Joi.string().required(),
        };
        try {
            const { amount, url } = await Joi.validate(req.body, validationSchema);
            let [userResult] = await Promise.all([
                findUser({ _id: req.userId, status: { $ne: status.DELETE } })
            ]);
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let paymentUrl;

            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": `${config.get('paypal.success_url')}?userId=${userResult._id}&amount=${amount}&url=${url}`,//success url
                    "cancel_url": `${config.get('paypal.failure_url')}?userId=${userResult._id}&amount=${amount}&url=${url}`//cancel url
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Chips",
                            "sku": "001",
                            "price": amount.toString(),
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": amount.toString()
                    },
                    "description": `Payment for chips with amount of ${amount}`
                }]
            };
            console.log("create_payment_json===??", create_payment_json);
            try {
                paypal.payment.create(create_payment_json, async (paymentErr, payData) => {
                    console.log("payData===>>>", paymentErr, payData);
                    if (paymentErr) {
                        return next(paymentErr);
                        // throw apiError.invalid(responseMessage.FAILED_TRANSACTION);
                    } else {
                        for (let i = 0; i < payData.links.length; i++) {
                            if (payData.links[i].rel === 'approval_url') {
                                paymentUrl = payData.links[i].href;
                            }
                        }
                        return res.json(new response(paymentUrl, responseMessage.DETAILS_FETCHED));
                    }
                });
            } catch (payError) {
                console.log("catch error line no 1229 ===>>", payError);
                return next(payError);
            }


        } catch (error) {
            console.log("catch error line no 900 ===>>", error);
            return next(error);
        }
    }


    async success(req, res, next) {
        try {
            const payerId = req.query.PayerID;
            const paymentId = req.query.paymentId;
            const userId = req.query.userId;
            const totalAmount = req.query.amount;
            const url = req.query.url;
            const execute_payment_json = {
                "payer_id": payerId,
                "transactions": [{
                    "amount": {
                        "currency": "USD",
                        "total": totalAmount.toString()
                    }
                }]
            };

            paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
                if (error) {
                    console.log("error during exec===>>0", error.response);
                    // throw error;
                    return next(error);
                } else {
                    const chipEntry = await findChip({ userId: userId });

                    const depositAmountInUSD = parseFloat(totalAmount);
                    if (chipEntry) {
                        await updateChip({ _id: chipEntry._id }, { $inc: { amountInUSD: depositAmountInUSD, chipQuantity: depositAmountInUSD } });
                    } else {
                        await createChip({
                            userId: userId,
                            chipQuantity: depositAmountInUSD,
                            amountInUSD: depositAmountInUSD,
                        });
                    }

                    await Promise.all([
                        updateUser({ _id: userId }, { $inc: { balance: depositAmountInUSD } }),
                        createTransaction({
                            transactionHash: payment.id,
                            userId: userId,
                            amount: totalAmount,
                            quantity: payment.transactions[0]["item_list"]["items"][0]["quantity"],
                            transactionType: transactionType.DEPOSIT,
                            transactionStatus: transStatusType.COMPLETE,
                            receipt: payment,
                            isPaypalPayment: true
                        })
                    ]);
                    // return res.json(new response(payment, responseMessage.PAYMENT_SUCCESS));
                    // fs.readFile("./success.html", function (error, pgResp) {
                    //     console.log("error==>>", error, "  pgResp=====>>", pgResp);
                    //     if (error) {
                    //         res.writeHead(404);
                    //         res.write('Contents you are looking are not found for success case.');
                    //     } else {
                    //         res.writeHead(200, { 'Content-Type': 'text/html' });
                    //         res.write(pgResp);
                    //     }
                    //     res.end();
                    // });
                    return res.redirect(url);
                }

            });
        }
        catch (error) {
            return next(error);
        }
    }

    async failure(req, res, next) {
        try {
            const userId = req.query.userId;
            const totalAmount = req.query.amount;
            await createTransaction({
                userId: userId,
                amount: totalAmount,
                transactionType: transactionType.DEPOSIT,
                transactionStatus: transStatusType.CANCEL,
                isPaypalPayment: true
            })
            // throw apiError.badRequest(responseMessage.FAILED_TRANSACTION);
            fs.readFile('./failure.html', function (error, pgResp) {
                if (error) {
                    res.writeHead(404);
                    res.write('Contents you are looking are not found for failure case.');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(pgResp);
                }
                res.end();
            });
        }
        catch (error) {
            return next(error);
        }
    }


    //**************************  Create Payouts Paypal *************************************************/
    /**
     * @swagger
     * /payment/withdraw:
     *   post:
     *     tags:
     *       - Paypal Payment
     *     description: withdraw
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - in: body
     *         name: swap 
     *         description: recipientType ?? EMAIL || BANK_ACCOUNT
     *         schema:
     *           type: object
     *           required:
     *             - orderId
     *           properties:
     *             receiverEmail:
     *               type: string
     *             amount:
     *               type: string
     *             recipientType:
     *               type: string
     *             accountId:
     *               type: string
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async withdraw(req, res, next) {
        const validationSchema = {
            amount: Joi.string().required(),
            recipientType: Joi.string().required(),
            receiverEmail: Joi.string().optional(),
            accountId: Joi.string().optional()
        };
        try {
            const { recipientType, receiverEmail, amount, accountId } = await Joi.validate(req.body, validationSchema);
            let [userResult] = await Promise.all([
                findUser({ _id: req.userId, status: { $ne: status.DELETE } })
            ]);
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (Number(userResult.balance) < Number(amount)) {
                throw apiError.badRequest(responseMessage.INSUFFICIENT_FUND);
            }
            let items = [
                {
                    "recipient_type": recipientType,
                    "amount": {
                        "value": amount,
                        "currency": "USD"
                    },
                    "note": "Thanks for your patronage!",
                    "sender_item_id": generateUserBatchID(),
                    "notification_language": "en-US"
                }
            ];
            if (recipientType === "EMAIL") {
                items[0]["receiver"] = receiverEmail;
            } else {
                let findAccountRes = await findRequestForWithdraw({ _id: accountId, userId: userResult._id, status: status.ACTIVE, requestStatus: requestStatus.APPROVE })
                if (!findAccountRes) {
                    throw apiError.notFound(responseMessage.BANK_ACCOUNT_NOT_FOUND);
                }
                items[0]["receiver"] = {
                    "bank_account": {
                        "account_number": findAccountRes.accountNumber ? findAccountRes.accountNumber : "1234567890",
                        "bank_name": findAccountRes.bankName ? findAccountRes.bankName : "Example Bank",
                        "bank_routing_number": findAccountRes.routingNumber ? findAccountRes.routingNumber : "123456789",
                        "account_type": findAccountRes.accountType ? findAccountRes.accountType : "CHECKING"
                    }
                }
            }
            var data = JSON.stringify({
                "sender_batch_header": {
                    "sender_batch_id": `Payouts_${new Date().getTime()}`,
                    "email_subject": "You have a payout!",
                    "email_message": "You have received a payout! Thanks for using our service!"
                },
                "items": items
            });
            const authToken = await getAccessToken();
            var config = {
                method: 'post',
                url: 'https://api-m.sandbox.paypal.com/v1/payments/payouts',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                data: data
            };
            const result = await axios(config);
            if (result) {
                let batchId = result.data.links[0].href.split('https://api.sandbox.paypal.com/v1/payments/payouts/')[1];
                const obj = {
                    batchId: batchId,
                    data: result.data
                }
                const executed = await executeBatchPayout(batchId);
                if (executed) {
                    // return res.json(new response(obj, responseMessage.PAYOUT_BATCH_CREATED));
                    await Promise.all([
                        createTransaction({
                            amount: Number(amount),
                            userId: userResult._id,
                            transactionType: transactionType.WITHDRAW,
                            receipt: executed,
                            transactionStatus: transStatusType.COMPLETE,
                        }),
                        updateUser({ _id: userResult._id }, { $inc: { balance: -amount } })
                    ]);
                    return res.json(new response(executed, responseMessage.PAYOUT_SUCCESS));
                } else {
                    throw apiError.internal(responseMessage.FAILED);
                }
            }

        } catch (error) {
            console.log("payout error==>>", error);
            return next(error);
        }
    }

    // /**
    //  * @swagger
    //  * /payment/executePayout/{batchId}:
    //  *   get:
    //  *     tags:
    //  *       - Paypal Payment
    //  *     description: executePayout
    //  *     produces:
    //  *       - application/json
    //  *     parameters:
    //  *       - name: token
    //  *         description: token
    //  *         in: header
    //  *         required: true
    //  *       - name: batchId
    //  *         description: batchId
    //  *         in: path
    //  *         required: true
    //  *     responses:
    //  *       200:
    //  *         description: Returns success message
    //  */

    async executePayout(req, res, next) {
        const validationSchema = {
            batchId: Joi.string().required()
        };
        try {
            const { batchId } = await Joi.validate(req.params, validationSchema);
            const authToken = await getAccessToken();
            var config = {
                method: 'get',
                url: `https://api-m.sandbox.paypal.com/v1/payments/payouts/${batchId}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            };
            const result = await axios(config);
            if (result) {
                return res.json(new response(result.data, responseMessage.PAYMENT_SUCCESS));
            }
        } catch (error) {
            console.log("error==>>", error);
            return next(error);
        }
    }

    /**
     * @swagger
     * /payment/paymentHistory/{batchId}:
     *   get:
     *     tags:
     *       - Paypal Payment
     *     description: paymentHistory
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: batchId
     *         description: batchId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */

    async paymentHistory(req, res, next) {
        const validationSchema = {
            batchId: Joi.string().required()
        };
        try {
            const { batchId } = await Joi.validate(req.params, validationSchema);
            const authToken = await getAccessToken();
            var config = {
                method: 'get',
                url: `https://api.sandbox.paypal.com/v1/payments/payouts/${batchId}?page_size=1000&page=1`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            };
            const result = await axios(config);
            if (result) {
                return res.json(new response(result.data, responseMessage.DETAILS_FETCHED));
            }
        } catch (error) {
            console.log("error==>>", error);
            return next(error);
        }
    }





}


export default new paypalController();


function generateUserBatchID() {
    return uuid.v4();
}


const getAccessToken = async () => {
    try {
        var axios = require('axios');
        var data = qs.stringify({
            'grant_type': 'client_credentials'
        });
        var requestData = {
            method: 'post',
            url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET
            },
            data: data
        };

        const result = await axios(requestData);
        if (result) {
            return result.data.access_token;
        }

    } catch (error) {
        console.log("catch error===>>", error);
    }
}
// module.exports = { getAccessToken };

const executeBatchPayout = async (batchId) => {
    try {
        // const { batchId } = await Joi.validate(req.params, validationSchema);
        const authToken = await getAccessToken();
        var config = {
            method: 'get',
            url: `https://api-m.sandbox.paypal.com/v1/payments/payouts/${batchId}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };
        const result = await axios(config);
        if (result) {
            return result.data;
        }
    } catch (error) {
        console.log("Execute batch payout error==>>>", error);
        return false;
    }
}