const net = require("net");
// 引用parser.js文件
const parser = require("./parser.js");

//1.设计一个HTTP请求类
//
class Request {
    //Request收集信息
    constructor(options) {
        //把options传入的数据做整理
        //存入默认值属性
        this.method = options.method || "GET";
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || "/";
        //默认空对象
        this.body = options.body || {};
        this.headers = options.headers || {};
        //2.一定要有Content-Type否则body无法解析
        //补全Content-Type
        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        if (this.headers["Content-Type"] === "application/json")
            this.bodyText = JSON.stringify(this.body);
        else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded")
        //用&符号分割，key在等号左，value在=右边  右边的值需要encodeURIComponent操作
        //3.Object.keys取出body的所有属性，map，join   body是KV格式
        //4.不同的Content-type影响body的格式
            this.bodyText = Object.keys(this.body).map(key => '${key}=${encodeURIComponent(this.body[key])}').join('&');
        //5.如果Content-Length不正确，会是一个非法请求
        //补全Content-Length
        this.headers["Content-Length"] = this.bodyText.length;
    }

    toString() {
            return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r  
${this.bodyText}`    
    }

// send函数把请求发送到服务器，是异步的，返回Promise
    send(connection) {
        //在已经建立好多连接上connection把请求发出去，如果连接没有传，就自己根据传进来的host,port自己创建新tcp连接
        return new Promise((resolve, reject) => {
                const parser = new ResponseParser;
                if (connection) {
                    //写的信息发送出去
                    connection.write(this.toString());
                } else {
                    //如果没有传参就创建一个
                    connection = net.createConnection({
                        host: this.host,
                        port: this.port
                    }, () => {
                        //如果创建成功就回调，把内容写进去
                        connection.write(this.toString());
                    })
            }
            connection.on('data', (data) => {
                console.log(data.toString());
                //变成字符串传给parser
                parser.receive(data.toString());
                if (parser.isFinished) {
                    //如果 parser结束就把Promise结束掉
                    resolve(parser.response);
                    connection.end();
                }
                

            }); 
            connection.on('error', (err) => {
                //如果遇到错误
                reject(err);
                //关掉，防止出错还占着连接
                connection.end();
            });



        });
    }
}


class Response{

}

  



class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE =0;   //状态机的另一种写法
        this.WAITING_STATUS_LINE_END =1;
        this.WAITING_HEADER_NAME =2;
        this.WAITING_HEADER_SPACE =3;
        this.WAITING_HEADER_VALUE =4;
        this.WAITING_HEADER_LINE_END =5;
        this.WAITING_HEADER_BLOCK_END =6;
        this.WAITING_BODY =7;

        this.current = this.WAITING_STATUS_LINE;//存储结果
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;

        
    }

    get isFinished(){
        return this.bodyParser && this.bodyParser.isFinished;
    }

    get response(){
        this.statusLine.match(/http\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers:this.headers,
            body:this.bodyParser.content.join('')

        }
    }


//receive接收字符串
    receive(string){ 
        for(let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }
    receiveChar(char) {
        //状态机代码
        if(this.current ===this.WAITING_STATUS_LINE){
            if(char === '\r'){
                this.current = this.WAITING_STATUS_LINE_END;
            }else{
                this.statusLine += char;
            }
        }else if(this.current=== this.WAITING_STATUS_LINE_END){
            if(char === '\n'){
                this.current=this.WAITING_HEADER_NAME;
            }
        }else if(this.current === this.WAITING_HEADER_NAME){
            if(char === ':'){
                this.current = this.WAITING_HEADER_SPACE;
            }else if(char === '\r'){
                this.current = this.WAITING_HEADER_BLOCK_END;
                if(this.headers['Transfer-Encoding'] === 'chunked')
                   this.bodyParser = new TrunkedBodyParser();
            }else{
                this.headerName += char;
            }
        }else if (this.current === this.WAITING_HEADER_SPACE){
            if(char === ''){
                this.current =this.WAITING_HEADER_VALUE;
            }
        }else if(this.current=== this.WAITING_HEADER_VALUE){
            if(char === '\r'){
                this.current = this.WAITING_STATUS_LINE_END;
                this.headers[this.headerName ] = this.headerValue;
                this.headerName = "";
                this.headerValue = "";
            }else{
                this.headerValue += char;
            }
        }else if (this.current === this.WAITING_HEADER_LINE_END){
            if(char === '\n'){
                this.current = this.WAITING_HEADER_NAME;
            }
        }else if (this.current === this.WAITING_HEADER_BLOCK_END){
            if(char ==='\n'){
                this.current = this.WAITING_BODY;
            }
        }else if(this.current === this.WAITING_BODY){
            this.bodyParser.receiveChar(char);
        }

    }
}

class TrunledBodyParser{
    constructor(){
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END =1;
        this.READING_TRUNK =2;
        this.WAITING_NEW_LINE =3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current= this.WAITING_LENGTH;
    }
    receiveChar(char){
        if(this.current === this .WAITING_LENGTH){
            if(char === '\r'){
                if(this.length ===0){
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            }else{
                this.length *=16;
                this.length +=parseInt(char,16);
            }
        }else if(this.current === this.WAITING_LENGTH_LINE_END){
            if(char ==='\n'){
                this.current = this.READING_TRUNK;
            }
        }else if (this.current=== this.READING_TRUNK){
            this.content.push(char);
            this.length --;
            if(this.length ===0){
                this.current = this.WAITING_NEW_LINE;
            }
        }else if(this.current === this.WAITING_NEW_LINE){
            if(char === '\r'){
                this.current = this.WAITING_NEW_LINE_END;
            }
        }else if(this.current===this.WAITING_NEW_LINE_END){
            if(char==='\n'){
                this.current = this.WAITING_LENGTH;
            }
        }
    }
}

void async function() {
    let request = new Request({
        method: "POST", //http
        host: "127.0.0.1", //ip
        port: "8088",//tcp
        path: "/", //http
        headers: {
            //用自己的方式描述js对象
            ["X-Foo2"]: "customed"
        },
        body: {
            name: "winter"
        }
    });

    let response = await request.send(); //请求结束调用send方法
    // 通过parser方法编程DOM树

    let dom = parser.parseHTML(response.body);
    console.log(JSON.stringify(dom,null,"  "));

    console.log(dom);
}();