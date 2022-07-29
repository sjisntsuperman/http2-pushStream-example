const http2 = require('http2')
const path = require('path')
const fs = require('fs')

const baseDir = __dirname
const publicPath = path.join(baseDir, '../public')
const helper = require('./helper')

const { HTTP2_HEADER_PATH } = http2.constants
const options = {
    key: fs.readFileSync(path.join(baseDir, '../ssl/key.pem')),
    cert: fs.readFileSync(path.join(baseDir, '../ssl/cert.pem'))
};

const server = http2.createSecureServer(options, onRequest)
const publicFiles = helper.getFiles(publicPath)

function onRequest(req, res) {
    const reqPath = req.url == '/' ? 'index.html' : req.url
    const file = publicFiles.get(reqPath)

    if (!file) {
        res.statusCode = 404
        res.end()
        return
    }
    
    if (req.url == '/index.html') {
        ServerPush(res.stream, '/test1.js')    
    }
    
    res.stream.respondWithFD(file.fileDescriptor, {
        'headers': file.headers
    })
}

function ServerPush(_stream, _path) {
    const file = publicFiles.get(_path)

    if (!file) {
        return
    }

    _stream.pushStream({ [HTTP2_HEADER_PATH]: _path }, (err, serverPushStream) => {
        if (err) {
            throw err
        }
        serverPushStream.respondWithFD(file.fileDescriptor, {
            'headers': file.headers
        })
    })
}

server.listen(3000, (err) => {
    if (err) {
        console.error(err)
    }
    console.log('server is listening on 3000')
})