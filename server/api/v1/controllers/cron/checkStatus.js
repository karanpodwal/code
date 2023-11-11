import { CronJob } from "cron";
import { transactionServices } from "../../services/transaction"
const { transactionList, updateTransaction } = transactionServices
import transactionName from '../../../../enums/transactionName'
import transactionStatus from '../../../../enums/transactionStatus'
const axios = require('axios');
import crypto from 'crypto';
import config from "config";
import { userServices } from '../../services/user'
import userType from "../../../../enums/userType";
const { findUserData, updateUser } = userServices
import { roomServices } from '../../services/room'
const { roomList, updateRoom } = roomServices
import status from "../../../../enums/status";


// let checkTransactionStatusAndUpdate = async () => {
//     try {
//         let transactionRes = await transactionList({ transactionName: transactionName.COIN, transactionStatus: transactionStatus.PENDING })
//         console.log("=============>>>>>>>", transactionRes.length)
//         if (transactionRes.length == 0) {
//             commonCron.start();
//         } else {
//             commonCron.stop();
//         }
//         for (let i = 0; i < transactionRes.length; i++) {
//             const privateApiKey = config.get('coin_payment.privateKey');
//             const publicApiKey = config.get('coin_payment.publicKey');
//             const payload = {
//                 version: "1",
//                 key: publicApiKey,
//                 cmd: "get_tx_info",
//                 txid: transactionRes[i].txn_id,
//             };
//             const hmacPayload = Object.keys(payload).sort().map((key) => `${key}=${payload[key]}`).join("&");
//             const hmac = crypto.createHmac("sha512", privateApiKey).update(hmacPayload).digest("hex");
//             const headers = {
//                 HMAC: hmac,
//                 "Content-Type": "application/x-www-form-urlencoded",
//             };
//             const responseData = await axios.post("https://www.coinpayments.net/api.php", hmacPayload, { headers });
//             if (responseData.status == 200) {
//                 console.log("============================================>>43", responseData.data.result)
//                 if (responseData.data.result.status == 1 || responseData.data.result.status == 100 || responseData.data.result.status_text == "Complete") {
//                     let userBalance = await findUserData({ _id: transactionRes[i].userId })
//                     let adminBalance = await findUserData({ userType: userType.ADMIN })
//                     await Promise.all([
//                         updateUser({ _id: userBalance._id }, { balance: Number(userBalance.balance) + Number(responseData.data.result.amountf) }),
//                         updateUser({ _id: adminBalance._id }, { coinBalance: Number(adminBalance.coinBalance) + Number(responseData.data.result.amountf) }),
//                         updateTransaction({ _id: transactionRes[i]._id }, { transactionStatus: transactionStatus.COMPLETE })])
//                 } else if (responseData.data.result.status == -1) {
//                     await updateTransaction({ _id: transactionRes[i]._id }, { transactionStatus: transactionStatus.CANCEL })
//                 } else {
//                     await updateTransaction({ _id: transactionRes[i]._id }, { transactionStatus: transactionStatus.PENDING })
//                 }
//             }
//             if (i === transactionRes.length - 1) {
//                 commonCron.start();
//             }
//         }
//     } catch (error) {
//         commonCron.start();
//         console.log("==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>check transaction cron error 42", error)
//     }
// }

// let liveRoomStatusChange = async () => {
//     try {
//         let roomRes = await roomList({ status: status.ACTIVE, islive: true })
//         console.log("=============>>>>>>>", roomRes.length)
//         if (roomRes.length == 0) {
//             commonCron.start();
//         } else {
//             commonCron.stop();
//         }
//         for (let i = 0; i < roomRes.length; i++) {

//             const targetTime = roomRes[i].fromTime;
//             // const currentTime = new Date().toLocaleTimeString("en-US", { hour12: false })
//             const currentTime = new Date()
//             const [targetHours, targetMinutes, targetSecond] = targetTime.split(":");
//             // const roomTimeStamp = new Date().setHours(Number(targetHours), Number(targetMinutes), Number(targetSecond))
//             const roomTimeStamp = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth()+1, currentTime.getDate() , targetHours, targetMinutes, targetSecond));
//             // const [currentTimeHours, currentTimeMinutes, currentTimeSecond] = currentTime.split(":");
//             // const currentstamp = new Date().setHours(Number(currentTimeHours), Number(currentTimeMinutes), Number(currentTimeSecond))
//             const currentstamp = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth()+1, currentTime.getDate(), currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()));
//             console.log("==========================>>>>>>>",currentstamp,roomTimeStamp)
//             if (Number(currentstamp) > Number(roomTimeStamp)) {
//                 let updateRes = await updateRoom({ _id: roomRes[i]._id }, { islive: false })
//                 console.log("====================>>>>>>", updateRes.fromTime)
//             }

//             if (i === roomRes.length - 1) {
//                 commonCron.start();
//             }
//         }
//     } catch (error) {
//         commonCron.start();
//         console.log("==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>liveRoomStatusChange 87", error)
//     }
// }


// let commonCron = new CronJob('*/2 * * * * *', async () => {
//     await Promise.all([checkTransactionStatusAndUpdate(), liveRoomStatusChange()])
// });




// commonCron.start();