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


//?????????????????????EOF ?????????????????????
//const EOF = Symbol("EOF"); //EOF :end of file

//??????????????????????????????
function data(c) {
    if (c == "<") {
        //??????????????????
        return tagOpen;

    } else if (c == EOF) {
        emit({
            type: "EOF"
        });
        //??????????????????
        return;

    } else {
        emit({
            type: "text",
            content: c
        });
        //??????????????????
        return data;
    }

}

function tagOpen(c) {
    if (c == "/") {
        //??????????????????
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
//??????????????????
function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        }
        return tagName(c);

    } else if (c == ">") {
        //endTagOpen?????????>??????

    } else if (c == EOF) {
        //??????

    } else {

    }
}

function tagName(c) {
    //?????????????????????????????????????????????????????????

    if (c.match(/^[\t\n\f ]$/)) {
        //?????????????????? 4??? tab ??????????????????????????????

        return beforeAttributeName;
    } else if (c == "/") {
        //  ??????/???????????????
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c
            //???????????????????????????
        return tagName;
    } else if (c == ">") {
        emit(currentToken);
        //??????????????????data
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





// ??????parseHTML??????
module.exports.parseHTML = function parseHTML(html) {
    // ????????????
    let state = data;
    for (let c of html) {
        //??????????????????????????????
        state = state(c);
    }
    //?????????????????????EOF ?????????????????????
    state = state(EOF);

}