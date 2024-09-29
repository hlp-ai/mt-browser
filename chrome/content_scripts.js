
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

        var div = document.createElement("div");
        div.style =
            "width:500px; height:200px; padding:10px; border-radius:5px; background-color:#fff; box-shadow:2px 0 2px #666, -2px 0 2px #666, 0 2px 2px #666, 0 -2px 2px #666; position:absolute; top:50%; margin-top:-100px; left:50%; margin-left:-250px;";
        box.appendChild(div);

        var h2 = document.createElement("h2");
        h2.innerHTML = "译文";
        h2.style = "line-height:40px; height:40px; font-size:20px; text-align:center; border-bottom:1px solid #ccc; margin:0;";
        div.appendChild(h2);

        var condiv = document.createElement("div");
        condiv.innerHTML = res;
        condiv.style =
            "overflow:auto; line-height:24px; font-size:16px; border-bottom:1px solid #ccc; text-indent: 2rem; padding:5px; height:95px;";
        condiv.setAttribute('dir', 'ltr');
        div.appendChild(condiv);

        var btn = document.createElement("div");
        btn.style = "text-align:right; padding:5px; height:45px;";
        btn.innerHTML = '<button style="background-color:#6495ed; width:20%; min-width:15%; height:36px; padding:2px; float:right;">确定</button>';
        div.appendChild(btn);

        var qd = btn.children[0];
        qd.onclick = function () {
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

