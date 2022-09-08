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
        queue.sendToQueue("omni.cfg.auth", {time: new Date().valueOf(), channel: "whatsapp_wr", data: qr});
    }
});

wcli.on('authenticated', () => {
    logger.log('info', "AUTHENTICATED");
});

wcli.on('disconnected', () => {
    queue.sendToQueue("omni.cfg.events", {time: new Date().valueOf(), channel: "whatsapp_wr", event: "disconnection"});
});

wcli.on('auth_failure', msg => {
    logger.log('error', `AUTHENTICATION FAILURE: ${msg}`);
});

wcli.on('ready', () => {
    logger.log('info', "ready");
    if(process.env.QR_VAR) {delete process.env.QR_VAR}
});

wcli.on('message', async message => {
    message.service = "whatsapp_scrapper"
    try {
        queue.sendToQueue("omni.from.ext", message);
    } catch (error) {
        logger.log('error', error);
    }
});

queue.consume("omni.whatsapp_wr.to.ext", message => {
    try {
        const {number, msg} = JSON.parse(message.content.toString());
        const ret = wcli.sendMessage(number, msg);
    } catch (error) {
        logger.log('error', error);
    }
});