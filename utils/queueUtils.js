function amqpuri(){
  const amqp_user = process.env.AMPQ_USER || "admin";
  const amqp_secret = process.env.AMPQ_SECCRET || "admin";
  const amqp_host = process.env.AMPQ_HOST || "localhost";
  const amqp_port = process.env.AMPQ_PORT || "5672";

  return `amqp://${amqp_user}:${amqp_secret}@${amqp_host}:${amqp_port}`
}

function connect(){
  return require('amqplib').connect(amqpuri())
                           .then(conn => conn.createChannel());
}

function createQueue(channel, queue){
  return new Promise((resolve, reject) => {
    try{
      channel.assertQueue(queue, { durable: true });
      resolve(channel);
    }
    catch(err){ reject(err) }
  });
}

function sendToQueue(queue, message){
  connect()
    .then(channel => createQueue(channel, queue))
    .then(channel => channel.sendToQueue(queue, Buffer.from(JSON.stringify(message))))
    .catch(err => console.log(err))
}

function consume(queue, callback){
  connect()
    .then(channel => createQueue(channel, queue))
    .then(channel => channel.consume(queue, callback, { noAck: true }))
    .catch(err => console.log(err));
}

module.exports = {
  sendToQueue,
  consume
}