const http = require('http');
//服务端环境搭建

http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => { //接受三个事件error  data  end
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk.toString()); //存入body


    }).on('end', () => {
        body = buffer.concat(body).toString(); //把内容拼起来concat
        console.log("body:", body);
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end('Hello World\n');
    });


}).listen(8088);
console.log("server started");