// 通过require('http')引入http对象
const http = require('http');
//服务端环境搭建
// 利用http自带方法启动一个后台服务
http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => { //接受三个事件error  data  end
        console.error(err);
    }).on('data', (chunk) => {
        // on'data'暂存入body
        //body.push(chunk.toString()); //存入body
        body.push(chunk);


    }).on('end', () => {
        // buffer类只能处理二进制缓存区
        body = Buffer.concat(body).toString(); //把数组里的内容拼起来concat
        console.log("body:", body);
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end('Hello World\n');
    });


}).listen(8088);
//console.log("server started");