var chrome = chrome || browser


document.addEventListener('DOMContentLoaded', async function () {

    try {
        request_ad();  // 每次显示翻译框都会刷新广告

        // 从服务器获取语言和设置语言选择
        let resp = await APIQuery('GET', 'languages', null)
        let trTo = document.getElementById('translateto')
        let trFrom = document.getElementById('translatefrom')
        let opt = document.createElement('option');
        opt.value = "auto"
        opt.innerText = "自动检测"
        trFrom.appendChild(opt)
        let browserLang = navigator.language.split("-")[0];  // 浏览器语言
        // console.log(typeof (resp))
        // console.log(resp)
        for (lang of resp) {
            let opt = document.createElement('option');
            opt.value = lang.code
            opt.innerText = lang.name
            trFrom.appendChild(opt)
            let opt2 = opt.cloneNode(true)
            if (lang.code == browserLang)
                opt2.selected = true
            trTo.appendChild(opt2)
        }
    } catch (e) { /*maybe display some UI? don't know*/ }

    // 主视图可见
    setView('main')

    // 翻译按钮事件
    document.getElementById('doTranslate').addEventListener('click', async function () {
        //console.log("sending msg")
        ak = document.getElementById('api_key').value;
        if(typeof ak ==='undefined')
            ak = "";

        // 通过background发送翻译请求给服务器
        let resp = await chrome.runtime.sendMessage({
            action: "inject",
            sl: document.getElementById('translatefrom').value,
            tl: document.getElementById('translateto').value,
            api_key: ak
        });

        //console.log("rcv'd ", resp);

        // 关闭翻译框
        window.close()
    })

    // 恢复网页按钮事件
    document.getElementById('goback').addEventListener('click', async function () {
        // console.log("sending msg")
        // 向content-script发送页面恢复消息
        function sendMessageToContentScript(message, callback) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
                    if (callback) callback(response);
                });
            });
        }
        sendMessageToContentScript({ cmd: 'goback', value: '你好，我是popup！' }, function (response) {
            console.log('来自content的回复：' + response);
        });

        window.close();
    })

    // 设置按钮事件
    document.getElementById('settingsbtn').addEventListener('click', function () {
        setView('settings');  // 显示设置框
    })

    // 设置框中回退按钮事件
    document.querySelectorAll('.btnToMainView').forEach(function (item) {
        item.addEventListener('click', function () {
            setView('main');  // 显示翻译框
        })
    })

    getSettings(function (data) {
        let settings = [...document.querySelectorAll('.setting')]
        for (s of settings) {
            s.value = data.settings[s.dataset['storename']]
        }
    });

    // 保存设置按钮事件
    document.getElementById('saveSettings').addEventListener('click', function () {
        let settings = [...document.querySelectorAll('.setting')]
        let collection = {};
        for (s of settings) {
            if (!('storename' in s.dataset)) {
                continue
            }
            collection[s.dataset['storename']] = s.value;
        }
        chrome.storage.sync.set({ settings: collection });  // 保存设置
        setView('main');
    })
})

function setView() {
    // 所有view都不可见
    var views = document.querySelectorAll('.view');
    [...views].forEach((v) => {
        v.style.display = 'none';
    });

    // 参数指定的view显示
    for (var view of arguments) {
        var el = document.querySelector('.view_' + view);
        el.style.display = 'block';
    }
}



/* FIXME 2 functions below are duplicated */
// 和服务器通信
function APIQuery(method, route, body) {
    return new Promise(function (resolve, reject) {
        getSettings(function (data) {
            fetch(data.settings['api-endpoint'] + route, {
                method: method,
                body: body,
                headers: { "Content-Type": "application/json" }
            }).then(function (res) {
                res.json().then(function (jsn) {
                    resolve(jsn)
                }).catch(function (err) {
                    reject(err)
                })
            }).catch(function (err) {
                reject(err)
            });
        })
    })


}

// 获取设置并执行操作cb
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

// 插件端请求广告，暂时放入请求url的链接
async function request_ad(){
    const res = await APIQuery('POST', 'request_ad', JSON.stringify({platform:"plugin"}));
    //console.log(res);

    ad_id = res.ad_id;
    type = res.type;
    content = res.content;
    url = res.url;

    getSettings(function (data) {
        server = data.settings['api-endpoint'];
        url = server + "click_ad?ad_id=" + ad_id + "&platform=plugin" + "&url=" + url;

        // 翻译框和设置框2个广告区域
        document.getElementsByClassName("ad-container")[0].innerHTML = "<a href='" + url + "' target='_blank'>" + content + "</a>";
        document.getElementsByClassName("ad-container")[1].innerHTML = "<a href='" + url + "' target='_blank'>" + content + "</a>";
    });

    //url = "http://127.0.0.1:5555/click_ad?ad_id=" + ad_id + "&platform=plugin" + "&url=" + url;

    //console.log(ad_id, type, content, url);
    // 翻译框和设置框2个广告区域
    //document.getElementsByClassName("ad-container")[0].innerHTML = "<a href='" + url + "' target='_blank'>" + content + "</a>";
    //document.getElementsByClassName("ad-container")[1].innerHTML = "<a href='" + url + "' target='_blank'>" + content + "</a>";
}