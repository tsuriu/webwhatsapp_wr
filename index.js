const { Client, LocalAuth } = require('whatsapp-web.js');
const queue = require('./utils/queueUtils');
const logger = require('./utils/logger').logger;

const wcli = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox'],}
});

wcli.initialize();

wcli.on('loading_screen', (percent, message) => {
    logger.log('info', `LOADING SCREEN: ${percent}, ${message}`);
});

wcli.on('qr', (qr) => {
    if((process.env.QR_VAR && process.env.QR_VAR !== qr) || (!process.env.QR_VAR)) { 
        process.env.QR_VAR = qr
        queue.sendToQueue(process.env.WWWR_CONFIG_AUTH, {time: new Date().valueOf(), channel_service: process.env.WWWR_PREFIX, data: qr});
    }
});

wcli.on('authenticated', () => {
    logger.log('info', "AUTHENTICATED");
    queue.sendToQueue(process.env.WWWR_CONFIG_EVENTS, {time: new Date().valueOf(), channel_service: process.env.WWWR_PREFIX, event: "AUTHENTICATED"});
});

wcli.on('disconnected', () => {
    queue.sendToQueue(process.env.WWWR_CONFIG_EVENTS, {time: new Date().valueOf(), channel_service: process.env.WWWR_PREFIX, event: "DISCONNECTED"});
});

wcli.on('auth_failure', msg => {
    logger.log('error', `AUTHENTICATION FAILURE: ${msg}`);
});

wcli.on('ready', () => {
    logger.log('info', "ready");
    if(process.env.QR_VAR) {delete process.env.QR_VAR}
    queue.sendToQueue(process.env.WWWR_CONFIG_EVENTS, {time: new Date().valueOf(), channel_service: process.env.WWWR_PREFIX, event: "READY"});
});

wcli.on('message', async message => {
    message.service = process.env.WWWR_PREFIX
    try {
        queue.sendToQueue(process.env.WWWR_WWWR_MESSAGE_IN_QUEUE, message);
    } catch (error) {
        logger.log('error', error);
    }
});

queue.consume(process.env.WWWR_WWWR_MESSAGE_IN_QUEUE, message => {
    try {
        const {number, msg} = JSON.parse(message.content.toString());
        const ret = wcli.sendMessage(number, msg);
    } catch (error) {
        logger.log('error', error);
    }
});