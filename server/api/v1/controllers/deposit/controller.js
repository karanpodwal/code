import Joi from "joi";
import Mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import userModel from "../../../../models/user";
import staticModel from "../../../../models/static";
import commonFunction from "../../../../helper/util";
import jwt from "jsonwebtoken";
import status from "../../../../enums/status";
import moment from "moment";
import Deposit from "../../../../models/deposit";
const Chip = require("../../../../models/chip");
// import { createDeposit } from "../../services/deposit";

const paypal = require("paypal-rest-sdk");

import { userServices } from "../../services/user";

const { findUserData } = userServices;

import { depositServices } from "../../services/deposit";
const { createUserdepost } = depositServices;

import { chipServices } from "../../services/chip";
const { findChip, updateChip, chipList, createChip } = chipServices;

function createPayPalPayment(amount, callback) {
  const paymentData = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "Deposit",
              price: amount,
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          total: amount,
          currency: "USD",
        },
        description: "Deposit to your account",
      },
    ],
    redirect_urls: {
      return_url: "http://yourwebsite.com/success",
      cancel_url: "http://yourwebsite.com/cancel",
    },
  };

  paypal.payment.create(paymentData, callback);
}

paypal.configure({
  mode: "sandbox",
  client_id:
    "Accsoj1E4a2MtCxv7_9BbqqNZK9KaHaft4Hx_om07yDdwDD_p6uRSkvATv6G3UEr7s2Q9jD7-bi7T4Wa",
  client_secret:
    "EGxa2DuMBoY7aqfwG2_BjAfMiSD1L2SDT-_ELmAfyYvWNfj_oilNCWvmlEMUrt1j_oiPHPj6_8GhnQdJ",
});

// export async function createPayPalPayment(amount) {
//   // Payment details
//   const paymentData = {
//     intent: "sale",
//     payer: {
//       payment_method: "paypal",
//     },
//     transactions: [
//       {
//         amount: {
//           total: amount, // The total amount for the payment
//           currency: "USD", // Currency code (e.g., USD)
//         },
//         description: "Deposit to your account",
//       },
//     ],
//     redirect_urls: {
//       return_url: "http://yourwebsite.com/success",
//       cancel_url: "http://yourwebsite.com/cancel",
//     },
//   };

//   return new Promise((resolve, reject) => {
//     paypal.payment.create(paymentData, (error, payment) => {
//       if (error) {
//         console.error("Error creating PayPal payment:", error);
//         reject(error);
//       } else {
//         // Extract the approval URL from the payment.links array
//         const approvalUrl = payment.links.find(
//           (link) => link.rel === "approval_url"
//         );
//         console.log(approvalUrl);
//         if (!approvalUrl) {
//           console.error("Approval URL not found in PayPal response.");
//           reject(new Error("Approval URL not found."));
//         } else {
//           resolve({
//             paymentId: payment.id,
//             approvalUrl: approvalUrl.href,
//             status: payment.state,
//             transactionId: null, // You can update this once the payment is completed
//           });
//         }
//       }
//     });
//   });
// }

export class amountController {
  // /**
  //  * @swagger
  //  * /deposit/userDosit:
  //  *   post:
  //  *     summary: Create a PayPal deposit for a user.
  //  *     tags:
  //  *       - deposit
  //  *     description: Create a PayPal deposit for a user.
  //  *     produces:
  //  *       - application/json
  //  *     parameters:
  //  *       - name: token
  //  *         description: User token (authentication required)
  //  *         in: header
  //  *         required: true
  //  *       - name: amount
  //  *         description: Amount to deposit.
  //  *         in: formData
  //  *         required: true
  //  *     responses:
  //  *       200:
  //  *         description: PayPal deposit created successfully.
  //  *       400:
  //  *         description: Bad request, validation failed.
  //  *       500:
  //  *         description: Internal Server Error.
  //  */

  // async userDosit(req, res, next) {
  //   const validationSchema = {
  //     amount: Joi.string().required(),
  //   };
  //   try {
  //       // Validate the request body
  //       const validatedBody = await Joi.validate(req.body, validationSchema);

  //       let userResult = await findUserData({ _id: req.userId, status: { $ne: status.DELETE } });
  //       if (!userResult) {
  //           throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  //       }

  //       if (validatedBody.amount <= 0) {
  //         return res.status(400).json({ message: 'Invalid amount' });
  //       }
  //       const payment = await createPayPalPayment(validatedBody.amount);

  //       if (!payment) {
  //         throw apiError.internalServerError('Payment creation failed');
  //       }

  //       if (payment.status === 'completed') {
  //         const deposit = {
  //           userId: isAuthenticated.userId, // Use the authenticated user's ID
  //           amount: validatedBody.amount,
  //           transactionId: payment.transactionId,
  //           type: 'Credit',
  //         };

  //         // Save the deposit data to the database
  //         const savedDeposit = await createDeposit(deposit);

  //         if (savedDeposit) {
  //           const depositAmountInUSD = parseFloat(validatedBody.amount);
  //           const chipEntry = await findChip({ userId: isAuthenticated.userId });

  //           if (chipEntry) {
  //             chipEntry.chipQuantity += depositAmountInUSD;
  //             await updateChip(chipEntry);
  //           } else {
  //             const newChipEntry = {
  //               userId: isAuthenticated.userId,
  //               chipQuantity: depositAmountInUSD,
  //               amountInUSD: depositAmountInUSD,
  //             };
  //             await createChip(newChipEntry);
  //           }

  //           return res.status(200).json({ message: 'Payment successful. Deposit data stored and chips added.' });
  //         } else {
  //           throw apiError.internalServerError('Deposit saving failed');
  //         }
  //       } else {
  //         return res.status(400).json({ message: 'Payment not successful.' });
  //       }
  //     } catch (error) {
  //       console.error('Error handling deposit:', error);
  //       return next(error);
  //     }
  //   };

  // /**
  //  * @swagger
  //  * /deposit/userDosit:
  //  *   post:
  //  *     summary: Create a PayPal deposit for a user.
  //  *     tags:
  //  *       - deposit
  //  *     description: Create a PayPal deposit for a user.
  //  *     produces:
  //  *       - application/json
  //  *     parameters:
  //  *       - name: token
  //  *         description: User token (authentication required)
  //  *         in: header
  //  *         required: true
  //  *       - name: amount
  //  *         description: Amount to deposit.
  //  *         in: formData
  //  *         required: true
  //  *     responses:
  //  *       200:
  //  *         description: PayPal deposit created successfully.
  //  *       400:
  //  *         description: Bad request, validation failed.
  //  *       500:
  //  *         description: Internal Server Error.
  //  */

  // async userDosit(req, res, next) {
  //   const validationSchema = {
  //     amount: Joi.string().required(),
  //   };

  //   try {
  //     const validatedBody = await Joi.validate(req.body, validationSchema);
  //     const userResult = await findUserData({
  //       _id: req.userId,
  //       status: { $ne: status.DELETE },
  //     });

  //     if (!userResult) {
  //       throw apiError.notFound(responseMessage.USER_NOT_FOUND);
  //     }

  //     if (validatedBody.amount <= 0) {
  //       return res.status(400).json({ message: "Invalid amount" });
  //     }
  //     let approvalUrl = null;
  //     createPayPalPayment(
  //       validatedBody.amount,
  //       async function (error, payment) {
  //         if (error) {
  //           console.error("Error creating PayPal payment:", error);
  //           return next(error);
  //         }

  //         // Extract the approval URL from the payment.links array
  //         const approvalLink = payment.links.find(
  //           (link) => link.rel === "approval_url"
  //         );

  //         if (!approvalLink) {
  //           console.error("Approval URL not found in PayPal response.");
  //           return next(new Error("Approval URL not found."));
  //         }

  //         approvalUrl = approvalLink.href;
  //         // Create a deposit object
  //         const deposit = new Deposit({
  //           userId: req.userId,
  //           approvalUrl: approvalLink.href,
  //           amount: validatedBody.amount,
  //           transactionId: payment.id,
  //           type: "Credit",
  //         });

  //         try {
  //           const savedDeposit = await createUserdepost(deposit);
  //           console.log("Deposit saved:", savedDeposit);
  //           console.log("url", approvalUrl);

  //           if (payment.state === "completed") {
  //             const depositAmountInUSD = parseFloat(validatedBody.amount);
  //             const chipEntry = await findChip({ userId: req.userId });

  //             if (chipEntry) {
  //               chipEntry.chipQuantity += depositAmountInUSD;
  //               await updateChip(chipEntry);
  //             } else {
  //               const newChipEntry = new Chip({
  //                 userId: req.userId,
  //                 chipQuantity: depositAmountInUSD,
  //                 amountInUSD: depositAmountInUSD,
  //               });
  //               await createChip(newChipEntry);
  //             }
  //           }
  //           res.status(200).json({
  //             message: "PayPal deposit created and saved successfully.",
  //             approvalUrl: approvalUrl.href,
  //           });
  //         } catch (saveError) {
  //           console.error("Error saving deposit:", saveError);
  //           return next(saveError);
  //         }
  //       }
  //     );
  //   } catch (error) {
  //     console.error("Error creating PayPal deposit:", error);
  //     return next(error);
  //   }
  // }

  /**
   * @swagger
   * /deposit/paypal:
   *   post:
   *     summary: Create a PayPal deposit for a user.
   *     tags:
   *       - deposit
   *     description: Create a PayPal deposit for a user.
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: User token (authentication required)
   *         in: header
   *         required: true
   *       - name: amount
   *         description: Amount to deposit.
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: PayPal deposit created successfully.
   *       400:
   *         description: Bad request, validation failed.
   *       500:
   *         description: Internal Server Error.
   */
  async paypal(req, res, next) {
    const validationSchema = {
      amount: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const userResult = await findUserData({
        _id: req.userId,
        status: { $ne: status.DELETE },
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (validatedBody.amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      let approvalUrl = null;
      createPayPalPayment(
        validatedBody.amount,
        async function (error, payment) {
          if (error) {
            console.error("Error creating PayPal payment:", error);
            return next(error);
          }

          // Extract the approval URL from the payment.links array
          const approvalLink = payment.links.find(
            (link) => link.rel === "approval_url"
          );

          if (!approvalLink) {
            console.error("Approval URL not found in PayPal response.");
            return next(new Error("Approval URL not found."));
          }

          approvalUrl = approvalLink.href;

          res.status(200).json({ approvalUrl });
        }
      );
    } catch (error) {
      console.error("Error creating PayPal payment:", error);
      return next(error);
    }
  }



  /**
 * @swagger
 * /deposit/createpayment:
 *   post:
 *     summary: Create a createpayment deposit for a user.
 *     tags:
 *       - deposit
 *     description: Create a createpayment deposit for a user.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: User token (authentication required)
 *         in: header
 *         required: true
 *       - name: amount
 *         description: Amount to deposit.
 *         in: formData
 *         required: true
 *     responses:
 *       200:
 *         description: PayPal deposit created successfully.
 *       400:
 *         description: Bad request, validation failed.
 *       500:
 *         description: Internal Server Error.
 */
  async createpayment(req, res) {
    const validationSchema = {
      amount: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const userResult = await findUserData({
        _id: req.userId,
        status: { $ne: status.DELETE },
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (validatedBody.amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: 'http://localhost:1990/api/v1/deposit/success',
          cancel_url: "http://localhost:1990/api/v1/deposit/cancel",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Deposit",
                  price: validatedBody.amount,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              total: validatedBody.amount,
              currency: "USD",
            },
            description: "Deposit to your account",
          },
        ],
      };


      paypal.payment.create(create_payment_json, async (error, payment) => {
        if (error) {
          throw error;
        } else {
          //   for (let i = 0; i < payment.links.length; i++) {
          //     if (payment.links[i].rel === "approval_url") {
          //       res.redirect(payment.links[i].href);

          //     }
          const approvalLink = payment.links.find(
            (link) => link.rel === "approval_url"
          );
          let approvalUrl = approvalLink.href;
          const deposit = new Deposit({
            userId: req.userId,
            amount: validatedBody.amount,
            type: "Credit",
            transactionId: payment.id, // Save the transactionId
          });
          const savedDeposit = await createUserdepost(deposit);
          res.status(200).json({ userId: req.userId, approvalUrl, transactionId: payment.id, });
        }


      }
      )
    } catch (error) {
      console.error("Error creating PayPal deposit:", error);
      return next(error);
    }
  }

  async success(req, res) {
    try {
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;

      const executePayment = {
        payer_id: payerId,
      };

      paypal.payment.execute(paymentId, executePayment, async (error, payment) => {
        if (error) {
          console.error('Error executing PayPal payment:', error);
          res.redirect('/cancel');
        } else {

          const deposit = await Deposit.findOneAndUpdate(
            { transactionId: payment.id },
            { type: 'Debit', status: 'Completed' },
            { new: true }
          );

          if (!deposit) {
            console.error('Deposit record not found for transactionId:', payment.id);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          // const user = await Deposit.findById(deposit.userId);

          // if (!user) {
          //   console.error('User not found with userId:', deposit.userId);
          //   res.status(500).json({ message: 'Internal server error' });
          //   return;
          // }
          // user.chipQuantity += deposit.amount;

          // const chip = await Chip.findOneAndUpdate(
          //   { userId: deposit.userId },
          //   { $inc: { chipQuantity: deposit.amount } }, 
          //   { new: true, upsert: true }
          // );

          res.send('Payment Success');
        }
      });
    } catch (error) {
      console.error("Error executing PayPal deposit:", error);
      return next(error);
    }
  }
  async cancel(req, res) {
    res.send('Payment canceled.');
  }



  // async success(req, res) {

  //   try{
  //     const payerId = req.query.PayerID;
  //     const paymentId = req.query.paymentId;


  //     const executePayment = {
  //       payer_id: payerId,
  //     };

  //     paypal.payment.execute(paymentId, executePayment, (error, payment) => {
  //       if (error) {
  //         console.error('Error executing PayPal payment:', error);
  //         res.redirect('/cancel');
  //       } else {
  //         res.send('Payment Success'); 
  //       }
  //     });
  //   }
  //   catch(error){
  //     console.error("Error creating PayPal deposit:", error);
  //     return next(error);
  //   }}




}


export default new amountController();
