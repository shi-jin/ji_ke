function getStyle(element) {
    if (!element.style)
        element.style = {};

    for (let prop in element.computedStyle) {
        var p = element.computedStyle.value;
        element.style[prop] = element.computedStyle[prop].value;

        // 用px结尾的标记为纯数字
        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);

        }
        if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);

        }

    }
    return element.style;
}

function layout(element) {
    if (!element.computedStyle)
        return;

    var elementStyle = getStyle(element);
    // 如果display不是flex就跳出 ，因为只能处理flex
    if (elementStyle.display !== 'flex')
        return;
    // 把文本节点都过滤掉
    var items = element.children.filter(e => e.type === 'element');
    // 为了支持order属性
    items.sort(function(a, b) {
        return (a.order || 0) - (b.order || 0);

    });
    // 取出style，就可以做主轴和交叉轴处理了
    var style = elementStyle;

    ['width', 'height'].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            // 变成null方便后期统计判断
            style[size] === 'null';
        }
    })


    // 确保用到的属性都有一个值
    if (!style.flexDirection || style.flexDirection === 'auto')
        style.flexDirection = 'row';

    if (!style.alignItems || style.alignItems === 'auto')
        style.alignItems = 'stretch';

    if (!style.justifyContent || style.justifyContent === 'auto')
        style.justifyContent = 'flex-start';

    if (!style.flexWrap || style.flexWrap === 'auto')
        style.flexWrap = 'nowrap';

    if (!style.alignContent || style.alignContent === 'auto')
        style.alignContent = 'stretch';

    var mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;
    if (style.flexDirection === 'row') {
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = '+1';
        // 初始值
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    // 从右往左排
    if (style.flexDirection === 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = '-1';
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if (style.flexDirection === 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = '+1';
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }



    if (style.flexDirection === 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = '-1';
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    // 反向换行，交叉轴，开始结束互换
    if (style.flexWrap === 'wrap-reverse') {
        var tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;

    } else {
        crossBase = 0;
        crossSign = 1;
    }
    // 如果父元素没有设置主轴尺寸 ，就由子元素自动撑开，无论如何所有元素都能排进同一行
    var isAutoMainSize = false;
    if (!style[mainSize]) {
        elementStyle[mainSize] = 0;
        for (var i = 1; i < items.length; i++) {
            var item = items[i];
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0))
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
        }
        isAutoMainSize = true;
        // style.flexWrap = 'nowrap';

    }
    // 把元素收进行
    var flexLine = []
        // 所有行放进一个数组
    var flexLines = [flexLine]
        // 剩余空间=父元素的主轴尺寸
    var mainSpace = elementStyle[mainSize];
    var crossSpace = 0;
    // 循环所有元素flexitem
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemStyle = getStyle(item);
        // 属性取出来，如果没有主轴尺寸就给0
        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;

        }
        // 如果有flex属性，说明这个元素是可伸缩的，无论多少个都可以放进这个行
        if (itemStyle.flex) {
            flexLine.push(item);
        } else if (style.flexWrap === 'nowrap' && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            // 交叉轴尺寸itemStyle[crossSize]
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
            // 给crossSpace取高，最大的交叉轴尺寸
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            flexLine.push(item);

        } else {
            // 如果比主轴大，就压缩和主轴一样大
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];


            }
            // 剩余的空间不足以容纳剩余的元素
            if (mainSpace < itemStyle[mainSize]) {
                // 1.如果放不下
                // 采取换行，主轴剩余空间存到这一行
                flexLine.mainSpace = mainSpace;
                // 交叉轴空间
                flexLine.crossSpace = crossSpace;
                // 创建新行

                flexLine = [item];
                // 放进所有行的数组里
                flexLines.push(flexLine);

                // 重置属性
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                // 2.如果能放下
                flexLine.push(item);
            }
            // 算主轴和交叉轴尺寸
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0))
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            mainSpace -= itemStyle[mainSize];
        }

    }
    // 写循环的技巧
    // 元素收集进line
    // 如果元素最后没了就给最后一行+上mainSpace
    // 当有剩余空间会给一个mainSpace
    flexLine.mainSpace = mainSpace;

    // console.log(items);

    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        // 保存crossSpace
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }


    if (mainSpace < 0) {
        // 1单行逻辑
        // 对所有元素等比压缩
        // 容器尺寸-期望尺寸     实际尺寸style[mainSize]
        var scale = style[mainSize] / (style[mainSize] - mainSize);
        var currentMain = mainBase;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            // 找出样式
            var itemStyle = getStyle(item);
            // flex没有权利等比压缩
            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;

            }
            // 如果有主轴尺寸
            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            // 算出元素位置

            itemStyle[mainStart] = currentMain;
            // 压缩后位置
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];

        }

    } else {
        // 多行逻辑
        flexLines.forEach(function(items) {
            var mainSpace = items.mainSpace;
            var flexTotal = 0;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var itemStyle = getStyle(item);
                // 如果有flex

                if ((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))) {
                    flexTotal += itemStyle.flex;
                    continue;

                }


            }
            // 如果有flex,把main均匀分配给每个flex
            if (flexTotal > 0) {
                var currentMain = mainBase;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var itemStyle = getStyle(item);
                    if (itemStyle.flex) {
                        // 比例划分
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;

                    }
                    itemStyle[mainStart] = currentMain
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd];
                }

            } else {
                // 如果没有flex就用justifyContent
                if (style.justifyContent === 'flex-start') {
                    var currentMain = mainBase;
                    var step = 0;
                }
                if (style.justifyContent === 'flex-end') {
                    var currentMain = mainSpace * mainSign * mainBase;
                    var step = 0;
                }
                if (style.justifyContent === 'center') {
                    var currentMain = mainSpace / 2 * mainSign + mainBase;
                    var step = 0;
                }
                if (style.justifyContent === 'space-between') {
                    var step = mainSpace / (items.length - 1) * mainSign;
                    var currentMain = mainBase;
                }

                if (style.justifyContent === 'space-around') {
                    var step = mainSpace / items.length * mainSign;
                    var currentMain = step / 2 + mainBase;
                }

                for (var i = 0; i < item.length; i++) {
                    var item = items[1];
                    itemStyle[mainStart] = currentMain
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
                    currentMain = itemStyle[mainEnd] + step;
                }
            }

        })
    }


    var crossSpace;

    if (!style[crossSize]) {
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        for (var i = 0; i < flexLines.length; i++) {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLines[i].crossSpace;
        }
    } else {
        crossSpace = style[crossSize]
        for (var i = 0; i < flexLines[i].length; i++) {
            crossSpace -= flexLines[i].crossSpace;
        }
    }


    if (style.flexWrap === 'wrap-reverse') {
        crossBase = style[crossSize];

    } else {
        crossBase = 0;
    }
    // 总体交叉轴尺寸/行数
    var lineSize = style[crossSize] / flexLines.length;

    var step;
    if (style.alignContent === 'flex-start') {
        crossBase += 0;
        step = 0;

    }


    if (style.alignContent === 'flex-end') {
        crossBase += crossSign * crossSpace;
        step = 0;

    }
    if (style.alignContent === 'center') {
        crossBase += crossSign * crossSpace / 2;
        step = 0;

    }
    if (style.alignContent === 'space-between') {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);

    }

    if (style.alignContent === 'space-around') {

        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;

    }
    if (style.alignContent === 'stretch') {

        crossBase += 0;
        step = 0;

    }
    flexLines.forEach(function(items) {
        var lineCrossSize = style.alignContent === 'stretch' ?
            items.crossSpace + crossSpace / flexLines.length :
            items.crossSpace;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var itemStyle = getStyle(item);

            var align = itemStyle.alignSelf || style.alignItems;

            if (itemStyle[crossSize] === null)
                itemStyle[crossSize] = (align === 'stretch') ? lineCrossSize : 0
            lineCrossSize: 0

            if (align === 'flex-start') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];

            }
            if (align === 'flex-end') {

                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize]

            }

            if (align === 'center') {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];

            }
            if (align === 'stretch') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) ?
                    itemStyle[crossSize] : lineCrossSize)
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart])
            }


        }
        crossBase += crossSign * (lineCrossSize + step);

    });
    console.log(items);


}

module.exports = layout;