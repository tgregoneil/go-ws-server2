#!/usr/local/bin/node
// index.js    go-ws-server2

module.exports = function (p0) {
    // mandatory p0: {port, initConnection, fromClient, wsc, isSecure, privkeyFileName, certFileName}
    // optional p0: {onClose, onListening, fromClient, log}

const v = {

    port: p0.port,
    initConnection: p0.initConnection,
    fromClient: p0.fromClient,

    onClose: p0.hasOwnProperty('onClose') ? p0.onClose : ()=>v.log('onclose'),
    onListening: p0.hasOwnProperty('onListening') ? p0.onListening : ()=>v.log('onlistening'),
        // if onListening is a provided callback fn, it is presumed that robust mode is entered so 
        // that if a port is already in use, a connection with a new port 
        // will be continually re-tried until a free port is found

    ws0: require('ws'),
    ws: null,

    wsc: p0.wsc,

    log: p0.log ? p0.log : console.log,

        // used if secure connection
    fs: require('fs'),
    https: require('https'),
    isSecure: p0.isSecure,
    privkeyFileName: p0.privkeyFileName,
    certFileName: p0.certFileName,

};

const A = {};


//---------------------
A.init = () => {

    let wss;

    v.log(`isSecure: ${v.isSecure}`);
    if (v.isSecure) {

        const privkey = v.fs.readFileSync(v.privkeyFileName, 'utf8');
        const cert = v.fs.readFileSync(v.certFileName, 'utf8');
    //v.log(`crt:\n${cert}`);

        const credentials = {key: privkey, cert: cert};
        const httpsServer = v.https.createServer(credentials);
            // v.https = require('https')
            // in v = {} section for private variables, above

        httpsServer.listen(v.port);

        wss = new v.ws0.Server({server: httpsServer});

    } else {

        wss = new v.ws0.Server({port: v.port});

    } // end if (v.isSecure)
    

    if (v.onListening) {

        wss.on('error', function (err) {
            
            if (err.code === 'EADDRINUSE') {

                v.log(`port ${v.port} is in use ... generating a new port`);
                v.port = f.genPort();

                A.init();
                return;

            } else {

                v.onListening('wsServer.init.err: ' + err);

            } // end if (err.match(/EADDRINUSE/))
            
        });
            
    
        wss.on('listening', function () {
            
            //v.log('listening');
            v.onListening(v.port);
        });

    } // end if (v.onListening)
    
    wss.on('connection', cb.initConnection);

};  // end A.init


const cb = {};
//---------------------
cb.initConnection = (ws, req) => {
    
    v.log('Server ip: ' + 
        ws._socket.remoteAddress + 
        '    req.connection.remoteAddress: ' + JSON.stringify(req.connection.remoteAddress)
    );
        //v.log('ws.upgradeReq: ' + JSON.stringify(ws.upgradeReq) + '\n');
        //v.log('req.connection: ' + JSON.stringify(req.connection) + '\n');
        //v.log('req.headers: ' + JSON.stringify(req.headers) + '\n');

    v.ws = ws;
    ws.on('message', function message(msg) {

        v.log('go-ws-server2:  incoming');
//        const msgS = msg.toString();
//        const msgO = JSON.parse(msgS);

        const msgO = JSON.parse(msg);

        v.fromClient(msgO);
    });

    ws.on('close', function close() {

        v.onClose();
    });

}; // end cb.initConnection 

const f = {};
//---------------------
f.genPort = () => {
    
    const rnd = Math.random();
    const rndPort = Math.round(rnd*20000 + 30000);

    return rndPort;

}; // end f.genPort


const P = {};

//---------------------
P.toClient = (msgOb) => {
    
    v.ws.send(JSON.stringify(msgOb));

}; // end P.toClient 

A.init();

return P;

};



