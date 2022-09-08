var qrcode = require('qrcode-terminal');
const queue = require('../utils/queueUtils');

queue.consume("omni.cfg.auth", message => {
    const message2 = JSON.parse(message.content.toString());
    qrcode.generate(message2.data, {small: true});  
});

queue.consume("omni.from.ext", message => {
    const message2 = JSON.parse(message.content.toString());
    console.log(message2);
});