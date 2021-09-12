const css = require('css');
const EOF = Symbol("EOF");

let currentToken = null;

let currentAttribute = null;

let stack = [{ type: "document", children: [] }];
let currentTextNode = null;

let currentTextNode = null;

let rules = [];

function addCSSRules(text) {
    var ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}

function match(element, selector) {
    if (!selector || !element.attributes)
        return false;
    if (selector.charAt(0) == "#") {
        var attr = element.attributes.filter(attr.name === "id")[0]
        if (attr && attr.value === selector.replace("#", ''))
            return true;
    } else if (selector.charAt(0) == ".") {
        var attr = element.attributes.filter(attr => attr.name === "class")[0]
        if (attr && attr.value === selector.replace(".", ''))
            return true;
    } else {
        if (element.tagName === selector) {
            return true;
        }
    }
}

function specificity(selector) {
    var p = [0, 0, 0, 0]
    var selectorParts = selector.split(" ");
    for (var part of selectorParts) {
        if (part.charAt(0) == "#") {
            p[1] += 1;
        } else if (part.charAt(0) == ".") {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compare(sp1, sp2) {
    if (sp1[0] - sp2[0])
        return sp1[0] - sp2[0];
    if (sp1[1] - sp2[1])
        return sp1[1] - sp2[1];
    if (sp1[2] - sp2[2])
        return sp1[2] - sp2[2];
    return sp1[3] - sp2[3];

}

function computeCSS(element) {
    var element = stack.slice().reverse();
    if (!element.computedStyle)
        element.computedStyle = {};

    for (let rule of rules) {
        var selectorParts = rule.selectors[0].split(" ").reverse();

        if (!match(element, selectorParts[0]))
            continue;
        var i = 1;
        for (var i = 0; i < Elements.length; i++) {
            if (match(Elements[i], selectorParts[j])) {
                j++;

            }

        }
        if (j >= selectorParts.length)
            matched = true;

        if (matched) {
            var sp = specificity(rule.selectorParts[0]);
            var computedStyle = element.computedStyle;
            for (var declartion of rule.declartions) {
                if (!computedStyle[declartion.property])
                    computedStyle[declartion.property] = {}

                if (!computedStyle[declartion.property].specificity) {
                    computedStyle[declartion.property].value = declartion.value
                    computedStyle[declartion.property].specificity = sp

                } else if (compare(computedStyle[declartion.property].specificity, sp) < 0) {
                    computedStyle[declartion.property].value = declartion.value
                    computedStyle[declartion.property].specificity = sp

                }


            }
        }
    }
}

function emit(token) {
    let top = stack[stack.length - 1];

    if (token.type == "startTag") {
        let element = {
            type: "element",
            children: [],
            attributes: []
        };

        element.tagName = token.tagName;

        for (let p in token) {
            if (p != "type" || p != "tagName")
                element.attributes.push({
                    name: p,
                    value: token[p]
                });
        }

        computeCSS(element);

        top.children.push(element);
        if (!token.isSelfClosing)
            stack.push(element);

        currentTextNode = null;

    } else if (token.type == "endTag") {
        if (top.tagName != token.tagName) {
            throw new Error("Tag start end doesn't match!");
        } else {
            if (top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }

        currentTextNode = null;
    } else if (token.type == "text") {
        if (currentTextNode == null) {
            currentTextNode = {
                type: "text",
                content: ""
            }
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }



}


//给定一个唯一性EOF 强迫状态机终止
//const EOF = Symbol("EOF"); //EOF :end of file

//加入状态完成状态迁移
function data(c) {
    if (c == "<") {
        //标签开始状态
        return tagOpen;

    } else if (c == EOF) {
        emit({
            type: "EOF"
        });
        //返回结束状态
        return;

    } else {
        emit({
            type: "text",
            content: c
        });
        //返回文本节点
        return data;
    }

}

function tagOpen(c) {
    if (c == "/") {
        //结束标签开头
        return endTagOpen;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c);
    } else {
        emit({
            type: "text",
            content: c
        });
        return;
    }
}
//处理异常逻辑
function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        }
        return tagName(c);

    } else if (c == ">") {
        //endTagOpen之后有>报错

    } else if (c == EOF) {
        //报错

    } else {

    }
}

function tagName(c) {
    //以标签名称以空白符结束，并进入属性状态

    if (c.match(/^[\t\n\f ]$/)) {
        //有效的空白符 4种 tab ，换行，禁止符，空格

        return beforeAttributeName;
    } else if (c == "/") {
        //  进入/自封闭标签
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c
            //如果有字符就在里面
        return tagName;
    } else if (c == ">") {
        emit(currentToken);
        //结束标签回到data
        return data;
    } else {
        currentToken.tagName += c
        return tagName;
    }
}

function beforeAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c == "/" || c == ">" || c == EOF) {
        return afterAttributeName(c);
    } else if (c == "=") {
        //return beforeAttributeName;
    } else {
        currentAttribute = {
            name: " ",
            value: ""
        }
        return AttributeName(c);
    }
}


///////////////////////////////////////















function selfClosingStartTag(c) {
    if (c == ">") {
        currentToken.isSelfClosing = true;
        return data;
    } else if (c == "EOF") {

    } else {

    }
}





// 使用parseHTML函数
module.exports.parseHTML = function parseHTML(html) {
    // 初始状态
    let state = data;
    for (let c of html) {
        //循环并调用状态机操作
        state = state(c);
    }
    //给定一个唯一性EOF 强迫状态机终止
    state = state(EOF);

}