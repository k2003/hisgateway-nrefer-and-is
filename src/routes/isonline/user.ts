/// <reference path="../../../typings.d.ts" />

import * as Knex from 'knex';
import * as fastify from 'fastify';
import * as HttpStatus from 'http-status-codes';
import * as moment from 'moment';

import { IsUserModel } from '../../models/isonline/users';
const userModel = new IsUserModel;

const router = (fastify, { }, next) => {
  var db: Knex = fastify.dbISOnline;

  fastify.post('/', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    verifyToken(req, res);
    let id: number = req.body.idSeach;
    userModel.list(db, id)
      .then((results: any) => {
        if (id > 0) {
          console.log("is_user id: " + id);
          res.send({ ok: true, rows: results[0] });
        } else {
          console.log("is_user. " + results.length + ' record<s> founded.');
          res.send({ ok: true, rows: results });
        }
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      });
  })

  fastify.post('/getbyid', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    verifyToken(req, res);
    let id: number = req.body.idSeach;
    userModel.getByID(db, id)
      .then((results: any) => {
        console.log("user id: " + id + ', ' + results.length + ' record<s> founded.');
        res.send({ ok: true, rows: results[0] });
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      });
  })

  fastify.post('/getbyusername', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    verifyToken(req, res);
    let userName: string = req.body.userName;
    userModel.getByUserName(db, userName)
      .then((results: any) => {
        res.send({ ok: true, rows: results[0] });
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      });
  })

  fastify.post('/selectData', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    verifyToken(req, res);
    let tableName = req.body.tableName;
    let selectText = req.body.selectText;
    let whereText = req.body.whereText;
    let groupBy = req.body.groupBy;
    let orderText = req.body.orderText;

    userModel.selectSql(db, tableName, selectText, whereText, groupBy, orderText)
      .then((results: any) => {
        console.log("\nget: " + tableName + ' = ' + results[0].length + ' record<s> founded.');
        res.send({ ok: true, rows: results[0] });
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      });
  })

  fastify.post('/save', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    verifyToken(req, res);
    let id = req.body.id;
    let data = req.body.data;

    userModel.saveUser(db, id, data)
      .then((results: any) => {
        console.log("\save: user id: " + id);
        res.send({ ok: true, rows: results[0] });
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      });
  })

  fastify.post('/remove', { preHandler: [fastify.serviceMonitoring] }, async (req: fastify.Request, res: fastify.Reply) => {
    verifyToken(req, res);
    let id = req.body.id;

    userModel.remove(db, id)
      .then((results: any) => {
        console.log("\delete: user id: " + id);
        res.send({ ok: true, id: id });
      })
      .catch(error => {
        res.send({ ok: false, error: error })
      });
  })

  async function verifyToken(req, res) {
    let token: string = null;

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    try {
      await fastify.jwt.verify(token);
      return true;
    } catch (error) {
      console.log('authen fail!', error.message);
      res.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: error.message
      })
    }
  }

  next();
}

module.exports = router;
