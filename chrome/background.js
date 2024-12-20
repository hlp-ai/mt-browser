var chrome = chrome || browser

let notificationShown = false;

// 显示错误通知
function showErrorNotification(title, message) {
    if(!notificationShown){  // 通知没有显示
        notificationShown = true;

        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon-48.png",
            title: title,
            message: message
        }, function () {
            setTimeout(function () {
                notificationShown = false;
            }, 2000);
        });
    }
}

// 创建取词翻译语言菜单
chrome.runtime.onInstalled.addListener(async function () {
    // 创建取词翻译菜单
    let menuItem = {
        "id": "pickTranslate",
        "title": "YiMT翻译",
        "contexts": ["selection"]
    };
    chrome.contextMenus.create(menuItem);

    let lang_list = [
    {"id": "en", "title": "英语", "contexts": ["selection"], "parentId": "pickTranslate"},
    {"id": "zh", "title": "汉语", "contexts": ["selection"], "parentId": "pickTranslate"},
    {"id": "vi", "title": "越南语", "contexts": ["selection"], "parentId": "pickTranslate"}
    ]

    // let resp = await APIQuery('GET', 'languages', null)
    // 语言列表子菜单
    for (lang of lang_list) {
        /*let menuItem = {
            "id": lang.code,
            "title": lang.cname,
            "contexts": ["selection"],
            "parentId": "pickTranslate"
        };*/
        chrome.contextMenus.create(lang);
    }
});

// 取词翻译处理
chrome.contextMenus.onClicked.addListener(async function (clickData) {
    if (clickData.selectionText) {
        var transword = clickData.selectionText;  // 选中的内容
        var source_lang = 'auto';
        var target_lang = clickData.menuItemId;  // 被点击的菜单选项卡id

        if(target_lang=="pickTranslate")
            return;

        chrome.storage.sync.get('settings', async function (data) {
            //console.log("datasetting: " + !data.settings);
            if (!data.settings) {
                var defaultsettings = {
                    'api-endpoint':"http://127.0.0.1:5555/",
                    'api-key': ""
                };
                data.settings = defaultsettings;
            }
            //console.log(data.settings['api-endpoint']);
            var ak = data.settings['api-key'];
            if(typeof ak === 'undefined')
                ak = "";

            var endpoint = data.settings['api-endpoint'];
            if (endpoint.charAt(endpoint.length - 1) !== '/')
                endpoint += '/';

            // 发送翻译请求
            const res = await fetch(endpoint + "translate", {
                method: "POST",
                body: JSON.stringify({q: transword, source: source_lang, target: target_lang,
                                      format: "text", api_key: ak}),
                headers: { "Content-Type": "application/json" }
            }).catch(function (err) {
                console.log(err);

                // 向content-scirpt发送错误显示消息
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {todo: "failed", message: err.message})
                });
                // showErrorNotification("connect failed", "Translation failed: " + err);
            });

            // transresult = clickData.selectionText
            trans_json = await res.json()
            if (trans_json.error) {
                showErrorNotification("服务器处理失败", "错误信息: " + trans_json.error);
            } else {
                console.log(trans_json.translatedText)

                // 弹出框中显示翻译结果
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {todo: "translated", result: trans_json.translatedText })
                });
            }
        })
    }
})

// popup和content脚本消息处理
chrome.runtime.onMessage.addListener(

    function (request, sender, sendResponse) {
        if (request.action === "translate") {  // 来自注入代码的翻译消息
            console.log('Get translation from server')

            // 修改页面文字显示方向，TODO: 补充RTL语言代码列表判断
            if (request.sl === "ar") {  // 源语言RTL，翻译结果要LTR
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { todo: "text_direction" })
                })
            }

            // 发送翻译消息给翻译服务器
            APIQuery('POST', 'translate',
                JSON.stringify({
                    q: request.text,
                    source: request.sl,
                    target: request.tl,
                    format: request.type,
                    api_key: request.ak}))
                .then(jsn => sendResponse(jsn));
                /*.then(function (jsn) {
                    if(jsn.error){
                        console.log('Translation error: ' + jsn.error)

                        showErrorNotification("翻译失败", "错误信息: " + jsn.error);

                        sendResponse(null);
                    }else{
                        sendResponse({type: request.type, text: jsn.translatedText});
                    }
                })*/

            return true;
        }

        if (request.action === "inject") {  // 来自popup的翻译注入消息
            console.log('Inject script for translation')

            // 在注入页面中执行翻译脚本doTranslate
            chrome.tabs.query({ active: true })
            .then(tabId => chrome.scripting.executeScript(
                {
                    target: { tabId: tabId[0].id },
                    func: doTranslate,
                    args: [request.sl, request.tl, request.api_key],
                }))
            .then(sendResponse(null));

            return true;
        }
    }
);


// 和服务器通信
function APIQuery(method, route, body) {

    return new Promise(function (resolve, reject) {
        getSettings(function (data) {
            fetch(data.settings['api-endpoint'] + route, {
                method: method,
                body: body,
                headers: { "Content-Type": "application/json" }})
            .then(response => response.json())
            .then(jsn => resolve(jsn))
            .catch(err => showErrorNotification("服务器连接失败", "错误信息: " + err));
        })
    })
}


function getSettings(cb) {
    chrome.storage.sync.get('settings', function (data) {
        if (!data.settings) {
            let defaultsettings = {
                'api-endpoint': 'http://127.0.0.1:5555/',
                'api-key': ""
            }
            cb({ settings: defaultsettings })
            return
        }
        let settings = data.settings;
        if (!settings['api-endpoint'].endsWith('/')) {
            settings['api-endpoint'] += '/';
        }
        // cb(data)
        cb({ settings: settings });
    })
}


/*************************************
 *     content-script注入脚本函数
 *************************************/
async function doTranslate(sl, tl, ak) {
    if (window.__ltActive) {  // 正在或已经翻译？
        return
    }
    window.__ltActive = true

    let __nodesToTranslate = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                              'p', 'span', 'div',
                              'li', 'a', 'label', 'figcaption', "button", "header",
                              'em', "strong", 'b', 'i'];
    let __translationCache = {};  // 翻译缓存

    let resp = await translate(document.title, 'text', sl, tl)   // 翻译标题
    document.title = resp.translatedText

    // 处于性能原因，只翻译视窗中可见部分，当视窗改变时，重新扫描DOM进行翻译
    // document.addEventListener('scroll', translateDom);
    let scrollTimer;
    let resizeTimer;
    let clickTimer;
    
    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(translateDom, 200);
    });
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(translateDom, 200);
    });

    window.addEventListener('click', () => {
        clearTimeout(clickTimer);
        clickTimer = setTimeout(translateDom, 200);
    });
    
    translateDom();  // 翻译页面

    // 翻译页面
    async function translateDom() {
        // 寻找可翻译元素
        nodes = findtranslatableElements();

        translateNodes(nodes, sl, tl);  // 翻译节点集
    }

    // 成批翻译, 通过background和服务器通信实现翻译
    async function translateBatch(texts, type, sl, tl) {
        // 向background发送翻译消息
        let responses = await chrome.runtime.sendMessage({
            action: "translate",
            type: type,
            text: texts,
            sl: sl,
            tl: tl,
            ak: ak
        });

        return responses;
    }

    // 翻译给定节点集
    async function translateNodes(allNodes, sl, tl) {
        let textRequests = [];
        let htmlRequests = [];
    
        for (let i = 0; i < allNodes.length; i++) {
            let node = allNodes[i];
    
            if (node.innerHTML == node.innerText) {
                if (node.innerText.length <= 100 && __translationCache[node.innerText]) { // 短文本查询翻译缓存
                    node.innerText = __translationCache[node.innerText];
                    setNodeTranslated(node);
                    continue;
                }
    
                textRequests.push({
                    text: node.innerText,
                    node: node
                });
            } else {
                if (node.innerHTML.length <= 200 && __translationCache[node.innerHTML]) {  // 短内容节点查询翻译缓存
                    node.innerHTML = __translationCache[node.innerHTML];
                    setNodeTranslated(node);
                    continue;
                }
    
                htmlRequests.push({
                    text: node.innerHTML,
                    node: node
                });
            }
        }
    
        if (textRequests.length > 0) {
            // 成批翻译
            let textResponses = await translateBatch(textRequests.map(req => req.text), 'text', sl, tl);
            //alert(textResponses);
            if (textResponses.error) {
                alert(textResponses.error);
                return;
            }

            let texttranslations = textResponses.translatedText;
            for (let i = 0; i < texttranslations.length; i++) {
                let resp = texttranslations[i];
                let req = textRequests[i];
    
                if (req.text.length <= 100) {
                    __translationCache[req.text] = resp;
                }
    
                req.node.innerText = resp;
                setNodeTranslated(req.node);
            }
        }
    
        if (htmlRequests.length > 0) {
            // 成批翻译
            let htmlResponses = await translateBatch(htmlRequests.map(req => req.text), 'html', sl, tl);
            //alert(htmlResponses);
            if (htmlResponses.error) {
                alert(htmlResponses.error);
                return;
            }

            let htmltranslations = htmlResponses.translatedText;
            for (let i = 0; i < htmltranslations.length; i++) {
                let resp = htmltranslations[i];
                let req = htmlRequests[i];
    
                if (req.text.length <= 200) {
                    __translationCache[req.text] = resp;
                }
    
                req.node.innerHTML = resp;
                setNodeTranslated(req.node);
                if (req.node.childNodes) {
                    [...req.node.childNodes].forEach(n => {
                        let tagName = n.tagName ? n.tagName.toLowerCase() : ''
                        if (n && __nodesToTranslate.includes(tagName)) {
                            setNodeTranslated(n)
                        }
                    })
                }
            }
        }
    }

    // 设置节点已经翻译
    function setNodeTranslated(node) {
        node.dataset.__ltTranslated = 'true'
    }

    // 节点是否已翻译
    function getNodeTranslated(node) {
        return node.dataset.__ltTranslated === 'true';
    }

    // 将节点设置为在翻译队列中
    function setNodeQueued(node) {
        node.dataset.__ltQueued = 'true';
    }

    // 节点是否在翻译队列中
    function getNodeQueued(node) {
        return node.dataset.__ltQueued === 'true';
    }

    // 寻找可以翻译的节点元素
    function findtranslatableElements() {
        let allNodes = [];  // 待翻译节点集

        for (tagName of __nodesToTranslate) {  // 对每个可翻译节点
            let nodeList = document.getElementsByTagName(tagName);
            let nodes = Array.prototype.slice.call(nodeList);  // 将nodelist转换成数组
            nodes = filterTranslatable(nodes);  // 过滤掉非文本节点
            // nodes = filterHidden(nodes);  // 过滤掉不可见的节点
            nodes = filterInViewport(nodes);  // 过滤掉不在视窗中的节点
            nodes = filterTranslated(nodes);  // 过滤掉已翻译结点
            nodes = filterQueued(nodes);  // 过滤掉在翻译队列中的节点

            // 节点放入翻译队列中, 简单设置标记
            for (n of nodes)
                setNodeQueued(n);

            allNodes = allNodes.concat(nodes);
        }

        allNodes = filterChilds(allNodes);  // 过滤掉翻译节点中的儿子节点

        // 对翻译节点按位置排序
        allNodes.sort(function (a, b) {
            let ab = a.getBoundingClientRect();
            let bb = b.getBoundingClientRect();

            return ab.top - bb.top;
        });

        return allNodes;
    }

    // 过滤掉在翻译队列中的节点
    function filterQueued(nodes) {
        unqueuedNodes = [];

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!getNodeQueued(node))  // 不在翻译队列中
                unqueuedNodes.push(node);
        }
        return unqueuedNodes;
    }

    // 过滤掉已翻译节点
    function filterTranslated(nodes) {
        untranslatedNodes = [];

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!getNodeTranslated(node)) // 未翻译
                untranslatedNodes.push(node);
        }
        return untranslatedNodes;
    }

    // 过滤掉不在视窗中的节点
    function filterInViewport(nodes) {
        viewportNodes = [];

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (isInViewport(node))
                viewportNodes.push(node);
        }
        return viewportNodes;
    }

    // 节点是否在视窗中
    function isInViewport(node) {
        let bounding = node.getBoundingClientRect();
        return (
            bounding.top >= 0 &&
            bounding.left >= 0 &&
            /* multiply viewport height by 1.5 so when scrolling down, the just-in-time translation isn't as noticable.
            as we will have half a viewport already translated. this is kinda bad if there a large image you scroll past fast.
            but it's better than nothing, for now. */
            bounding.top <= (window.innerHeight || document.documentElement.clientHeight) * 1.5 &&
            bounding.left <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // 过滤掉不含文本节点
    function filterTranslatable(nodes) {
        translateableNodes = [];

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (hasTranslateableText(node))
                translateableNodes.push(node);
        }
        return translateableNodes;
    }

    // 节点是否是文本节点，或儿子节点是否有文本节点
    function hasTranslateableText(node) {
        // 节点是非空文本节点
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() != "")
            return true;

        // 是否有儿子节点是非空文本节点
        node = node.firstChild;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() != "")
                return true;

            node = node.nextSibling;
        }
        return false;
    }

    function filterHidden(nodes) {
        visibleNodes = [];

        // 元素是否可见
        function isHidden(el) {
            return (el.offsetParent === null);
        }

        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (!isHidden(node))
                visibleNodes.push(node);
        }
        return visibleNodes;
    }

    // 过滤掉翻译节点中重复的儿子节点
    function filterChilds(nodes) {
        topLevelNodes = [];

        for (let i = 0; i < nodes.length; i++) {
            let child = nodes[i];
            var node = child;
            var found = false;
            while (node.parentNode) {
                node = node.parentNode;

                // 节点是翻译节点集中其他节点子节点
                if (includesNode(nodes, node)) {
                    found = true;
                    break;
                }
            }
            if (!found)
                topLevelNodes.push(child);
        }
        return topLevelNodes;
    }

    // 节点是否在节点集中存在
    function includesNode(haystack, needle) {
        for (n of haystack) {
            if (needle.isSameNode(n))
                return true;
        }
        return false;
    }

    async function translate(txt, type, sl, tl) {
        let resp = await chrome.runtime.sendMessage({action: "translate", type: type, text: txt, sl: sl, tl: tl, ak: ak })
        return resp
    }

}