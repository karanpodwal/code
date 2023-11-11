//v7 imports
import staticContent from './api/v1/controllers/static/routes';
import admin from './api/v1/controllers/admin/routes';
import user from './api/v1/controllers/user/routes';
import category from './api/v1/controllers/category/routes'
import quiz from './api/v1/controllers/quiz/routes'
import room from "./api/v1/controllers/room/routes"
import deposit from "./api/v1/controllers/deposit/routes"
import payment from "./api/v1/controllers/paypal/routes";






/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {


  app.use('/api/v1/admin', admin)
  app.use('/api/v1/user', user)
  app.use('/api/v1/static', staticContent)
  app.use('/api/v1/category', category)
  app.use('/api/v1/quiz', quiz)
  app.use('/api/v1/room',room)
  app.use('/api/v1/deposit',deposit)
  app.use('/api/v1/payment',payment)










  return app;
}
