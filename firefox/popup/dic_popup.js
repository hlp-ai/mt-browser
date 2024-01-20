var chrome = chrome || browser

document.addEventListener('DOMContentLoaded', async function () {

    try {
        request_ad();
        let resp = await APIQuery('GET', 'languages', null)
        let trTo = document.getElementById('translateto')
        let trFrom = document.getElementById('translatefrom')
        let opt = document.createElement('option');
        opt.value = "auto"
        opt.innerText = "自动检测"
        trFrom.appendChild(opt)
        let browserLang = navigator.language.split("-")[0];
        for (lang of resp) {
            let opt = document.createElement('option');
            opt.value = lang.code
            opt.innerText = lang.name
            trFrom.appendChild(opt)
            let opt2 = opt.cloneNode(true)
            if (lang.code == browserLang) {
                opt2.selected = true
            }
            trTo.appendChild(opt2)
        }
    } catch (e) { /*maybe display some UI? don't know*/ }

    setView('main')
    // request_ad();

    document.getElementById('doTranslate').addEventListener('click', async function () {
        console.log("sending msg")
        var ak = document.getElementById('api_key').value;
        if(typeof ak === 'undefined'){
            ak = "";
        }
        let resp = await chrome.runtime.sendMessage({
            action: "inject",
            sl: document.getElementById('translatefrom').value,
            tl: document.getElementById('translateto').value,
            api_key: ak
        });
        let source_lang = document.getElementById('translatefrom').value;
        if (source_lang == "ar") {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { todo: "change" })
            })
        }
        console.log("rcv'd ", resp);
        window.close()
    })

    document.getElementById('settingsbtn').addEventListener('click', function () {
        setView('settings')
    })

    document.querySelectorAll('.btnToMainView').forEach(function (item) {
        item.addEventListener('click', function () {
            setView('main')
        })
    })

    getSettings(function (data) {
        let settings = [...document.querySelectorAll('.setting')]
        for (s of settings) {
            s.value = data.settings[s.dataset['storename']]
        }
    });

    document.getElementById('saveSettings').addEventListener('click', function () {
        let settings = [...document.querySelectorAll('.setting')]
        let collection = {};
        for (s of settings) {
            if (!('storename' in s.dataset)) {
                continue
            }
            collection[s.dataset['storename']] = s.value;
        }
        chrome.storage.local.set({ settings: collection });
        setView('main');
    })
})


function setView() {
    var views = document.querySelectorAll('.view');
    [...views].forEach((v) => {
        v.style.display = 'none';
    });

    for (var view of arguments) {
        var el = document.querySelector('.view_' + view);
        el.style.display = 'block';
    }
}

document.getElementById('goback').addEventListener('click', async function () {
    console.log("sending msg")
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



/* FIXME 2 functions below are duplicated */
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


function getSettings(cb) {
    chrome.storage.local.get('settings', function (data) {
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
    console.log(res);

    ad_id = res.ad_id;
    type = res.type;
    content = res.content;
    url = res.url;

    console.log(ad_id, type, content, url);
    document.getElementsByClassName("ad-container")[0].innerHTML = "<a href='" + url + "' target='_blank'>" + content + "</a>";
    document.getElementsByClassName("ad-container")[1].innerHTML = "<a href='" + url + "' target='_blank'>" + content + "</a>";
}