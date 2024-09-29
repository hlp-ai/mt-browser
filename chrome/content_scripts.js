
chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'goback') {  // 来自popup的恢复网页消息
        console.log('refresh');
        window.location.reload();
    }

    if (request.todo == "translated") {  // background的取词翻译结果消息
        var res = request.result
        var db = document;
        var w = window;
        if (w.parent != undefined)
            db = w.parent.document;

        var box = document.createElement("div");
        box.style = "position:fixed; left:0; right:0; top:0; bottom:0; z-index:200;";
        db.body.appendChild(box);

        var dialog_box = document.createElement("div");
        dialog_box.style =
            "width:500px; height:200px; padding:10px; border-radius:5px; background-color:#fff; box-shadow:2px 0 2px #666, -2px 0 2px #666, 0 2px 2px #666, 0 -2px 2px #666; position:absolute; top:50%; margin-top:-100px; left:50%; margin-left:-250px;";
        box.appendChild(dialog_box);

        var h2 = document.createElement("h2");
        h2.innerHTML = "译文";
        h2.style = "line-height:40px; height:40px; font-size:20px; text-align:center; border-bottom:1px solid #ccc; margin:0;";
        dialog_box.appendChild(h2);

        var result = document.createElement("div");
        result.innerHTML = res;
        result.style =
            "overflow:auto; line-height:24px; font-size:16px; border-bottom:1px solid #ccc; padding:5px; height:95px;";
        result.setAttribute('dir', 'ltr');
        dialog_box.appendChild(result);

        var bottom = document.createElement("div");
        bottom.style = "text-align:right; padding:5px; height:45px;";
        bottom.innerHTML = '<button style="background-color:#6495ed; width:20%; font-size:18px; min-width:15%; padding:2px; float:right;">确定</button>';
        dialog_box.appendChild(bottom);

        var ok_btn = bottom.children[0];
        // 确定按钮处理事件
        ok_btn.onclick = function () {
            db.body.removeChild(box);
        }
    }

    if (request.todo == 'text_direction') {  //来自background的页面文字显示方向改变消息
        document.body.style.direction = "ltr";
        document.getElementsByClassName("js-dialog").style.direction = "ltr";  // ???
    }

    if(request.todo == 'failed'){  // background取词翻译失败消息
        alert(request.message)
    }
})

