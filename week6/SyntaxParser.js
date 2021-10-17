// 基础语法的定义，实现语法分析 用状态机实现语法树
import { scan } from "./LexParser.js";

let syntax = {
        // 把program展开，是一个广度优先搜索的过程 
        // 接受EOF来终止，否则不知道何时结束
        program: [
            ["StatementList", "EOF"]
        ],
        // 是或的关系 ，有两个分支，第二个不会产生新的token
        StatementList: [
            ["Statement"],
            ["StatementList", "Statement"]
        ],
        // Statement有9种可能性， Statement的token是9个其中之一
        Statement: [
            // 表达式
            ["ExpressionStatement"],

            ["IfStatement"],
            ["WhileStatement"],
            // 变量声明
            ["VariableDeclaration"],
            ["FunctionDeclaration"],
            ["Block"],
            ["BreakStatement"],
            ["ContinueStatement"],
            ["FunctionDeclaration"]
        ],
        FunctionDeclaration: [
            ["function", "Identifier", "(", ")", "(", "Expression", ")", ]
        ],
        BreakStatement: [
            ["break", ";"]
        ],
        ContinueStatement: [
            ["continue", ";"]
        ],
        Block: [
            ["{", "StatementList", "}"],
            ["{", "}"]
        ],
        WhileStatement: [
            ["while", "(", "Expression", ")", "Statement"]
        ],
        // 递归关系
        IfStatement: [
            ["if", "(", "Expression", ")", "Statemen"]
        ],
        VariableDeclaration: [
            // ["let", "Identifier", ";"]
            ["var", "Identifier", ";"]
        ],
        FunctionDeclaration: [
            // 没有变量的函数
            ["function", "Identifier", "(", ")", "{", "StatementList", "}"]
        ],
        ExpressionStatement: [
            ["Expression", ";"]
        ],
        Expression: [
            ["AssignmentExpression"]
        ],
        AssignmentExpression: [
            // 左手边
            ["LeftHandSideExpression", "=", "LogicalORExpression"],
            ["LogicalORExpression"]
        ],
        LogicalORExpression: [
            ["LogicalANDExpression"],
            ["LogicalORExpression", "||", "LogicalANDExpression"]
        ],
        LogicalANDExpression: [
            ["AdditiveExpression"],
            ["LogicalANDExpression", "&&", "AdditiveExpression"]
        ],
        AdditiveExpression: [
            // 加法，递归
            ["MultiplicativeExpression"],
            ["AdditiveExpression", "+", "MultiplicativeExpression"],
            ["AdditiveExpression", "-", "MultiplicativeExpression"]
        ],
        MultiplicativeExpression: [
            ["LeftHandSideExpression"],
            ["MultiplicativeExpression", "*", "LeftHandSideExpression"],
            ["MultiplicativeExpression", "/", "LeftHandSideExpression"],


        ],
        LeftHandSideExpression: [
            ["CallExpression"],
            ["NewExpression"]
        ],
        CallExpression: [
            ["MemberExpression", "Arguments"],
            [" CallExpression", "Arguments"]
        ],
        Arguments: [
            ["(", ")"],
            ["(", "ArgumentList", ")"]
        ],
        ArgumentLis: [
            ["AssignmentExpression"],
            ["ArgumentList", ",", "AssignmentExpression"]
        ],
        NewExpression: [
            ["MemberExpression"],
            ["new", "NewExpression"]
        ],
        MemberExpression: [
            ["PrimaryExpression"],
            ["PrimaryExpression", ".", "Identifier"],
            ["PrimaryExpression", "[", "Expression", "]"]
        ],

        PrimaryExpression: [
            ["(", "Expression", ")"],
            // ["Number"]有七种表达式
            ["Literal"],
            // 变量
            ["Identifier"]
        ],
        // 基本类型
        Literal: [

            // ["Number"]
            // 词法结构
            ["NumericLiteral"],
            ["StringLiteral"],
            ["BooleanLiteral"],
            ["NullLiteral"],
            // 子类三种object，语法结构，类似于字符串
            ["RegularExpressionLiteral"],
            ["ObjectLiteral"],
            ["ArrayLiteral"]
        ],
        ObjectLiteral: [
            ["{", "}"],
            ["{", "PropertyList", "}"]
        ],
        // 递归结构
        PropertyList: [
            ["Property"],
            ["PropertyList", ",", "Property"]
        ],
        Property: [
            ["StringLiteral", ":", "AdditiveExpression"],
            ["Identifier", "：", "AdditiveExpression"]
        ]








    }
    // 创建哈希表
let hash = {

}

function closure(state) {
    // 存入哈希表
    hash[JSON.stringify(state)] = state;

    let queue = [];
    for (let symbol in state) {
        if (symbol.match(/^\$/)) {
            continue;
        }
        queue.push(symbol);
    }
    // 运用广度优先搜索循环    shift和push可以组成入队出队
    while (queue.length) {
        let symbol = queue.shift;
        console.log(symbol);
        // 有终结符
        if (syntax[symbol]) {
            // 找规则
            for (let rule of syntax[symbol]) {
                if (!state[tule[0]])
                    queue.push(rule[0]);
                let current = state
                for (let part of rule) {
                    if (!current[part])
                    // 变成一个新的start状态
                        current[part] = {}
                    current = current[part];
                }
                current.$reduceType = symbol;
                current.$reduceLength = rule.length;

            }
        }
    }

    for (let symbol in state) {
        if (symbol.match(/^\$/)) {
            continue;

        }
        // 为了避免死循环，加入判断
        if (hash[JSON.stringify(state[symbol])])
        // 如果有就把节点替换掉
            state[symbol] = hash[JSON.stringify(state[symbol])];
        else closure(state[symbol]);


    }
}
// 结束状态
let end = {
        $isEnd: true
    }
    // 初始状态
let start = {
    // 进入下一个状态
    "program": end
        // "program": {isEnd:true}
}

closure(start);

let source = `
var a;
`

export function parse(source) {
    let stack = [start]
    let symbolStack = [];

    function reduce() {
        let state = stack[stack.length - 1];
        if (state.$reduceType) {
            // 存起来
            let children = [];
            for (let i = 0; i < state.$reduceLength; i++) {
                stack.pop()
                children.push(symbolStack.pop());

            }
            return {
                type: state.$reduceType,
                children: children.reverse()
            };
        } else {
            throw new Error("unexpected token");
        }
    }

    function shift(symbol) {
        // 栈顶
        let state = stack[stack.length - 1];

        if (symbol.type in state) {
            stack.push(state[symbol.type]);
            symbolStack.push(symbol);

        } else {
            shift(reduce());
            shift(symbol)
        }


    }
    for (let symbol of scan(source)) {
        shift(symbol);
    }
    return reduce();
}