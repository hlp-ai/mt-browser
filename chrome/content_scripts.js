// var px, py, sx, sy;
// var list = [];
// var lastbutton = null;
// var lastFrame = null;
// var inBtn = false;
// var inFrame = false;
// var isPlayAudio = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'goback') {
        console.log('refresh')
        window.location.reload()
    }
    if (request.todo == "translate") {
        alert(request.result)
        var res = request.result
        // createFyFrame(px, py, sx, sy, res)
    }
})


// //注册鼠标弹起事件
// if (document.body.addEventListener) {
//     document.body.addEventListener("mouseup", onEventTranslate, false);
// } else {
//     document.body.attachEvent("onmouseup", onEventTranslate);
// }

// /**
//  * 是否全部为中文
//  * @param {*} a
//  */
// function isAllChinese(a) {
//     var b = /^[\u4e00-\u9fa5]+$/;
//     if (b.test(a)) {
//         return true;
//     } else {
//         return false;
//     }
// }
// /**
//  * 触发翻译事件
//  * @param {*} c
//  */
// function onEventTranslate(c) {
//     var b = "";
//     var a = c.srcelement ? c.srcelement : c.target;
//     //获取到鼠标划取到的词
//     if (document.getSelection) {
//         b = document.getSelection();
//     } else {
//         if (document.selection) {
//             b = document.selection.createRange().text;
//         }
//     }
//     if (inBtn) {
//         return;
//     }
//     if (inFrame) {
//         return;
//     }
//     onCloseFrame();
//     onClosebutton();
//     b = String(b);
//     b = b.replace(/^\s*/, "").replace(/\s*$/, "");
//     if (b == "") {
//         return;
//     }
//     if (a.tagName == "INPUT" || a.tagName == "IMG") {
//         return;
//     }
//     if (b.length > 500) {
//         return;
//     }
//     if (isAllChinese(b)) {
//         return;
//     }
//     if (b.indexOf("<") == 1 || b.indexOf(">") == 1) {
//         return;
//     }
//     if (b !== "") {
//         px = c.pageX;
//         py = c.pageY;
//         sx = c.screenX;
//         sy = c.screenY;
//         getTranslate(b, c.pageX, c.pageY, c.screenX, c.screenY);
//     }
// }
// //获取翻译信息
// function getTranslate(d, b, a, e, c) {
//     chrome.runtime.sendMessage({
//         action: "trans",
//         word: d,
//         source: 'en',
//         target: 'zh',
//         format: 'text'
//     },
//         function (f) {
//             var g = f;
//             createFyBtn(b, a, e, c);
//             $("#fanyiWrapper").click(function () {
//                 createFyFrame(d, b, a, e, c, g);
//                 $(this).hide();
//             });
//         });
// }
// //创建翻译悬浮框
// function createFyFrame(c, b, e, d, s) {
//     var t = "";
//     var l = "";
//     var j = s.text;
//     var a = $("<div></div>");
//     a.attr("id", "fanyiContainer");
//     var h = document.createElement("div");
//     for (var p = 0; p < j.length; p++) {
//         t += j[p]["dst"];
//     }
//     for (var p = 0; p < j.length; p++) {
//         l += j[p]["src"];
//     }

//     h.innerHTML = '<div style="padding:13px 13px;width:257px;border:1px solid #ccc;border-radius:2px;box-shadow:0 0 5px #ccc;background:#fff;text-align:left;font-family:\'微软雅黑\';"><div><span style="font-size:13px;display:inline-block;font-family:\'微软雅黑\';">译文:</span></div><p id="content" style="white-space:normal;margin-top:8px;font-size:13px;font-family:\'微软雅黑\';color:#333;padding:0;line-height:18px;width:257px;">' + t + '</p>'
//     //h.innerHTML = '<div style="padding:13px 13px;width:257px;border:1px solid #ccc;border-radius:2px;box-shadow:0 0 5px #ccc;background:#fff;text-align:left;font-family:\'微软雅黑\';"><div><span style="font-size:13px;display:inline-block;font-family:\'微软雅黑\';">译文:</span><audio src="http://tts.baidu.com/text2audio?lan=en&pid=101&ie=UTF-8&text=' + l + '" visibility:hidden;></audio><img id="playVoice" src="' + chrome.runtime.getURL("imgs/voice.png") + '" style="vertical-align:baseline;margin-left:7px;display:inline-block;position:relative;top:3px;left:0;cursor:pointer;width:18px;height:15px;"><img style="float:right;" id="closeFrame" src="' + chrome.runtime.getURL("imgs/close.png") + '"></div><p id="content" style="white-space:normal;margin-top:8px;font-size:13px;font-family:\'微软雅黑\';color:#333;padding:0;line-height:18px;width:257px;">' + t + '</p>';
//     a[0].appendChild(h);
//     var o = 310;
//     var g = 100;
//     var f = 0;
//     var m = 0;
//     var n = screen.availWidth;
//     var r = screen.availHeight;
//     var k = 10;
//     if (e + o < n) {
//         f = c;
//     } else {
//         f = c - o - 20;
//     }
//     a[0].style.left = f + "px";
//     if (d + g + 20 < r) {
//         m = b;
//     } else {
//         m = b - g - 20;
//     }
//     a[0].style.top = m + 10 + "px";
//     a[0].style.position = "absolute";
//     a[0].style.zIndex = 10002;
//     document.body.style.position = "static";
//     document.body.appendChild(a[0]);
//     list.push(a);
//     $("#fanyiContainer").mouseover(function () {
//         inFrame = true;
//     }).mouseout(function () {
//         inFrame = false;
//     });
//     $("#closeFrame").hover(function () {
//         $(this).attr("src", chrome.runtime.getURL("imgs/close_hover.png"));
//     },
//         function () {
//             $(this).attr("src", chrome.runtime.getURL("imgs/close.png"));
//         });
//     if (lastFrame != null) {
//         if (lastFrame.css("left") !== $button.css("left")) {
//             document.body.removeChild(lastFrame[0]);
//         }
//     }
//     lastFrame = a;
//     $("#closeFrame").click(function () {
//         inFrame = false;
//         $("#fanyiContainer").hide();
//     });
//     $("#moreMean").click(function () {
//         inFrame = false;
//         $("#fanyiContainer").hide();
//     });
//     $("#playVoice").hover(function () {
//         if (!isPlayAudio) {
//             $(this).attr("src", chrome.runtime.getURL("imgs/voice_hover.png"));
//         }
//     },
//         function () {
//             if (!isPlayAudio) {
//                 $(this).attr("src", chrome.runtime.getURL("imgs/voice.png"));
//             }
//         });
//     $("#playVoice").click(function () {
//         var j = this;
//         isPlayAudio = true;
//         $(this).siblings("audio")[0].play();
//         var i = $(this).siblings("audio");
//         i[0].play();
//         $(this).attr("src", chrome.runtime.getURL("imgs/sound.gif"));
//         i.unbind("ended").bind("ended",
//             function () {
//                 isPlayAudio = false;
//                 $(j).attr("src", chrome.runtime.getURL("imgs/voice.png"));
//             });
//     });
// }
// //创建翻译按钮
// function createFyBtn(h, g, e, d) {
//     var a = $("<div></div>");
//     a.attr("id", "fanyiWrapper");
//     a.html("译");
//     a.css({
//         height: "32px",
//         width: "33px",
//         "font-family": "微软雅黑",
//         "font-size": "14px",
//         "text-align": "center",
//         "line-height": "32px",
//         color: "#fff",
//         "background-color": "#4395FF",
//         "border-radius": "2px",
//         cursor: "pointer",
//         "z-index": "99999"
//     });
//     var j = 35;
//     var l = 35;
//     var f = 0;
//     var i = 0;
//     var b = screen.availWidth;
//     var c = screen.availHeight;
//     var k = 10;
//     if (e + j < b) {
//         f = h;
//     }
//     a[0].style.left = f + "px";
//     i = g;
//     a[0].style.top = i + 10 + "px";
//     a[0].style.position = "absolute";
//     document.body.style.position = "static";
//     document.body.appendChild(a[0]);
//     $("#fanyiWrapper").mouseover(function () {
//         inBtn = true;
//     }).mouseout(function () {
//         inBtn = false;
//     });
//     list.push(a);
//     if (lastbutton !== null) {
//         if (lastbutton.css("left") !== a.css("left")) {
//             document.body.removeChild(lastbutton[0]);
//         }
//     }
//     lastbutton = a;
// }
// //移除Frame(翻译悬浮框)框
// function onCloseFrame() {
//     if (inFrame) {
//         return;
//     }
//     if (lastFrame != null) {
//         while (list.length != 0) {
//             document.body.removeChild(list.pop()[0]);
//         }
//         lastFrame = null;
//         return true;
//     }
//     return false;
// }
// //移除按钮
// function onClosebutton() {
//     if (inBtn) {
//         return;
//     }
//     if (lastbutton != null) {
//         while (list.length != 0) {
//             document.body.removeChild(list.pop()[0]);
//         }
//         lastbutton = null;
//         return true;
//     }
//     return false;
// }
// //消除水印
// function loadCssCode(code) {
//     var style = document.createElement('style');
//     style.type = 'text/css';
//     style.rel = 'stylesheet';
//     //for Chrome Firefox Opera Safari
//     var head = document.getElementsByTagName('head')[0];
//     style.appendChild(document.createTextNode(code));
//     head.appendChild(style);
// }
// loadCssCode(".__web-inspector-hide-shortcut__{visibility: hidden !important;}")
// document.querySelector("#watermark > div.__wm").className = "__wm __web-inspector-hide-shortcut__"
