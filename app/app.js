"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const HttpStatus = require("http-status-codes");
const fastify = require("fastify");
const moment = require("moment");
const serveStatic = require('serve-static');
var crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../config') });
const helmet = require("fastify-helmet");
var cron = require('node-cron');
var shell = require("shelljs");
const app = fastify({
    logger: {
        level: 'error',
        prettyPrint: true
    },
    bodyLimit: 5 * 1048576,
});
app.register(require('fastify-formbody'));
app.register(require('fastify-cors'), {});
app.register(require('fastify-no-icon'));
app.register(helmet, { hidePoweredBy: { setTo: 'PHP 5.2.0' } });
app.register(require('fastify-rate-limit'), {
    max: +process.env.MAX_CONNECTION_PER_MINUTE || 1000000,
    timeWindow: '1 minute'
});
app.use(serveStatic(path.join(__dirname, '../public')));
app.register(require('point-of-view'), {
    engine: {
        ejs: require('ejs')
    }
});
app.register(require('fastify-jwt'), {
    secret: process.env.SECRET_KEY
});
app.register(require('fastify-ws'), {});
app.decorate("authenticate", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    let token = null;
    if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
        token = yield request.headers.authorization.split(' ')[1];
    }
    else if (request.body && request.body.token) {
        token = yield request.body.token;
    }
    try {
        const decoded = yield request.jwtVerify(token);
    }
    catch (err) {
        console.log(moment().format('HH:mm:ss.SSS'), 'authenticate fail', err.message);
        reply.send({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED)
        });
    }
}));
app.decorate("checkRequestKey", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    let skey = null;
    if (request.headers.localkey) {
        skey = request.headers.localkey;
    }
    var requestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
    if (!skey || skey !== requestKey) {
        console.log('invalid key');
        reply.send({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: HttpStatus.getStatusText(HttpStatus.UNAUTHORIZED) + ' or invalid key'
        });
    }
}));
app.decorate("serviceMonitoring", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(moment().locale('th').format('HH:mm:ss'), request.raw.url);
}));
const hisConnectionOption = createConnectionOption({
    client: process.env.HIS_DB_CLIENT,
    host: process.env.HIS_DB_HOST,
    user: process.env.HIS_DB_USER,
    password: process.env.HIS_DB_PASSWORD,
    dbName: process.env.HIS_DB_NAME,
    port: process.env.HIS_DB_PORT,
    schema: process.env.HIS_DB_SCHEMA,
    charSet: process.env.HIS_DB_CHARSET,
    encrypt: process.env.HIS_DB_ENCRYPT || true
});
app.register(require('./plugins/db'), {
    connection: hisConnectionOption,
    connectionName: 'dbHIS'
});
const nReferConnectionOption = createConnectionOption({
    client: process.env.REFER_DB_CLIENT || process.env.HIS_DB_CLIENT,
    host: process.env.REFER_DB_HOST || process.env.HIS_DB_HOST,
    user: process.env.REFER_DB_USER || process.env.HIS_DB_USER,
    password: process.env.REFER_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
    dbName: process.env.REFER_DB_NAME || process.env.HIS_DB_NAME,
    port: process.env.REFER_DB_PORT || process.env.HIS_DB_PORT,
    schema: process.env.REFER_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
    charSet: process.env.REFER_DB_CHARSET || process.env.HIS_DB_CHARSET,
    encrypt: process.env.REFER_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true
});
app.register(require('./plugins/db'), {
    connection: nReferConnectionOption,
    connectionName: 'dbRefer'
});
const isOnlineConnectionOption = createConnectionOption({
    client: process.env.IS_DB_CLIENT || process.env.HIS_DB_CLIENT,
    host: process.env.IS_DB_HOST || process.env.HIS_DB_HOST,
    user: process.env.IS_DB_USER || process.env.HIS_DB_USER,
    password: process.env.IS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
    dbName: process.env.IS_DB_NAME || process.env.HIS_DB_NAME,
    port: process.env.IS_DB_PORT || process.env.HIS_DB_PORT,
    schema: process.env.IS_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
    charSet: process.env.IS_DB_CHARSET || process.env.HIS_DB_CHARSET,
    encrypt: process.env.IS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true
});
app.register(require('./plugins/db'), {
    connection: isOnlineConnectionOption,
    connectionName: 'dbISOnline'
});
const cannabisConnectionOption = createConnectionOption({
    client: process.env.CANNABIS_DB_CLIENT || process.env.HIS_DB_CLIENT,
    host: process.env.CANNABIS_DB_HOST || process.env.HIS_DB_HOST,
    user: process.env.CANNABIS_DB_USER || process.env.HIS_DB_USER,
    password: process.env.CANNABIS_DB_PASSWORD || process.env.HIS_DB_PASSWORD,
    dbName: process.env.CANNABIS_DB_NAME || process.env.HIS_DB_NAME,
    port: process.env.CANNABIS_DB_PORT || process.env.HIS_DB_PORT,
    schema: process.env.CANNABIS_DB_SCHEMA || process.env.HIS_DB_SCHEMA,
    charSet: process.env.CANNABIS_DB_CHARSET || process.env.HIS_DB_CHARSET,
    encrypt: process.env.CANNABIS_DB_ENCRYPT || process.env.HIS_DB_ENCRYPT || true
});
app.register(require('./plugins/db'), {
    connection: cannabisConnectionOption,
    connectionName: 'dbCannabis'
});
const timingSch = '0 */1 * * * *';
let timingSchedule = [];
timingSchedule['isonline'] = {};
timingSchedule['nrefer'] = {};
timingSchedule['isonline'].autosend = +process.env.IS_AUTO_SEND === 1 || false;
timingSchedule['isonline'].minute = process.env.IS_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.IS_AUTO_SEND_EVERY_MINUTE) : 0;
timingSchedule['isonline'].hour = process.env.IS_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.IS_AUTO_SEND_EVERY_HOUR) : 0;
if (timingSchedule['isonline'].minute > 0) {
    timingSchedule['isonline'].minute = timingSchedule['isonline'].minute < 5 ? 5 : timingSchedule['isonline'].minute;
    timingSchedule['isonline'].minute = timingSchedule['isonline'].minute > 60 ? (timingSchedule['isonline'].minute % 60) : timingSchedule['isonline'].minute;
    timingSchedule['isonline'].hour = 0;
}
else if (timingSchedule['isonline'].hour > 0) {
    timingSchedule['isonline'].hour = timingSchedule['isonline'].hour > 23 ? (timingSchedule['isonline'].hour % 23) : timingSchedule['isonline'].hour;
}
else {
    timingSchedule['isonline'].autosend = false;
}
timingSchedule['nrefer'].autosend = +process.env.NREFER_AUTO_SEND === 1 || false;
timingSchedule['nrefer'].minute = process.env.NREFER_AUTO_SEND_EVERY_MINUTE ? parseInt(process.env.NREFER_AUTO_SEND_EVERY_MINUTE) : 0;
timingSchedule['nrefer'].hour = process.env.NREFER_AUTO_SEND_EVERY_HOUR ? parseInt(process.env.NREFER_AUTO_SEND_EVERY_HOUR) : 0;
if (timingSchedule['nrefer'].minute > 0) {
    timingSchedule['nrefer'].minute = timingSchedule['nrefer'].minute < 5 ? 5 : timingSchedule['nrefer'].minute;
    timingSchedule['nrefer'].minute = timingSchedule['nrefer'].minute > 60 ? (timingSchedule['nrefer'].minute % 60) : timingSchedule['nrefer'].minute;
    timingSchedule['nrefer'].hour = 0;
}
else if (+timingSchedule['nrefer'].hour > 0) {
    timingSchedule['nrefer'].hour = timingSchedule['nrefer'].hour > 23 ? (timingSchedule['nrefer'].hour % 23) : timingSchedule['nrefer'].hour;
}
else {
    timingSchedule['nrefer'].autosend = false;
}
cron.schedule(timingSch, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const minuteNow = +moment().get('minute') == 0 ? 60 : +moment().get('minute');
    const hourNow = +moment().get('hour');
    if (timingSchedule['nrefer'].autosend && timingSchedule['nrefer'].minute + timingSchedule['nrefer'].hour > 0 &&
        ((timingSchedule['nrefer'].minute > 0 && minuteNow % timingSchedule['nrefer'].minute == 0) ||
            (timingSchedule['nrefer'].hour > 0 && minuteNow == 0 && hourNow % timingSchedule['nrefer'].hour == 0))) {
        doAutoSend(req, res, 'nrefer', './routes/refer/crontab');
    }
    if (timingSchedule['isonline']['autosend'] && timingSchedule['isonline'].minute + timingSchedule['isonline'].hour > 0 &&
        ((timingSchedule['isonline'].minute > 0 && minuteNow % timingSchedule['isonline'].minute == 0) ||
            (timingSchedule['isonline'].hour > 0 && minuteNow == 0 && hourNow % timingSchedule['isonline'].hour == 0))) {
        doAutoSend(req, res, 'isonline', './routes/isonline/crontab');
    }
}));
app.register(require('./routes/index'), { prefix: '/', logger: true });
app.register(require('./routes/setup'), { prefix: '/setup-api', logger: true });
app.register(require('./routes/refer/v3'), { prefix: '/refer', logger: true });
app.register(require('./routes/refer/v3'), { prefix: '/refer/his', logger: true });
app.register(require('./routes/refer/local'), { prefix: '/refer/local', logger: true });
app.register(require('./routes/refer/send'), { prefix: '/refer/send-moph', logger: true });
app.register(require('./routes/hdc/index'), { prefix: '/hdc', logger: true });
app.register(require('./routes/isonline/index'), { prefix: '/isonline', logger: true });
app.register(require('./routes/isonline/login'), { prefix: '/login', logger: true });
app.register(require('./routes/isonline/index'), { prefix: '/iswin', logger: true });
app.register(require('./routes/isonline/index'), { prefix: '/is', logger: true });
app.register(require('./routes/isonline/his'), { prefix: '/his', logger: true });
app.register(require('./routes/isonline/his'), { prefix: '/isonline/his', logger: true });
app.register(require('./routes/isonline/user'), { prefix: '/user', logger: true });
app.register(require('./routes/isonline/user'), { prefix: '/isonline/user', logger: true });
app.register(require('./routes/isonline/report'), { prefix: '/report', logger: true });
app.register(require('./routes/isonline/report'), { prefix: '/isonline/report', logger: true });
app.register(require('./routes/isonline/moph'), { prefix: '/moph', logger: true });
app.register(require('./routes/isonline/ops'), { prefix: '/ops', logger: true });
app.register(require('./routes/pcc/index'), { prefix: '/pcc', logger: true });
app.register(require('./routes/cannabis/index'), { prefix: '/cannabis', logger: true });
app.register(require('./routes/qdrugstore/index'), { prefix: '/qdrugstore', logger: true });
app.register(require('./routes/rp506/index'), { prefix: '/rp506', logger: true });
const port = +process.env.PORT || 3001;
const host = '0.0.0.0';
app.listen(port, host, (err) => {
    app.startServerTime = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
    if (err)
        throw err;
    app.ws
        .on('connection', socket => {
        console.log('Client connected.');
        socket.on('message', msg => socket.send(msg));
        socket.on('close', () => console.log('Client disconnected.'));
    });
    app.ws.on('error', error => {
        console.log('WebSocket server error!', error);
    });
    console.log('>>> ', app.startServerTime, 'HIS Gateway API start', app.server.address());
});
function createConnectionOption(db) {
    if (['mssql'].includes(db.client)) {
        return {
            client: db.client,
            connection: {
                server: db.host,
                user: db.user,
                password: db.password,
                database: db.dbName,
                options: {
                    port: +db.port,
                    schema: db.schema,
                    encrypt: db.encrypt
                }
            }
        };
    }
    if (db.client === 'oracledb') {
        return {
            client: db.client,
            caseSensitive: false,
            connection: {
                connectString: `${db.host}/${db.schema}`,
                user: db.user,
                password: db.password,
                port: +db.port,
                externalAuth: false,
                fetchAsString: ['DATE'],
            }
        };
    }
    else {
        return {
            client: db.client,
            connection: {
                host: db.host,
                port: +db.port,
                user: db.user,
                password: db.password,
                database: db.dbName,
            },
            pool: {
                min: 0,
                max: 7,
                afterCreate: (conn, done) => {
                    conn.query('SET NAMES ' + db.charSet, (err) => {
                        done(err, conn);
                    });
                }
            },
            debug: false,
        };
    }
}
function testOracleConn(db) {
    return __awaiter(this, void 0, void 0, function* () {
        const oracledb = require('oracledb');
        const dbConfig = {
            connectString: `${db.host}/${db.schema}`,
            user: db.user,
            password: db.password,
            externalAuth: false
        };
        let conn;
        try {
            conn = yield oracledb.getConnection(dbConfig);
            console.error('conn', conn);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (conn) {
                try {
                    conn.close();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    });
}
function doAutoSend(req, res, serviceName, functionName) {
    return __awaiter(this, void 0, void 0, function* () {
        let firstProcess = { pid: -1 };
        if (process.env.START_TOOL === 'nodemon') {
            firstProcess.pid = process.pid;
        }
        else {
            var jlist = yield shell.exec('pm2 jlist');
            let pm2Process = jlist && jlist !== '' ? JSON.parse(jlist) : [];
            let processList = [];
            for (let p of pm2Process) {
                if (p.name === process.env.PM2_NAME) {
                    yield processList.push(p);
                }
            }
            if (processList.length) {
                firstProcess = processList[0];
            }
        }
        if (firstProcess.pid === process.pid) {
            console.log(moment().locale('th').format('HH:mm:ss'), `start cronjob '${serviceName}' on PID ${process.pid}`);
            yield require(functionName)(req, res, app.dbHIS, timingSchedule[serviceName]);
        }
    });
}
//# sourceMappingURL=app.js.map