browser.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'goback') {
        console.log('refresh')
        window.location.reload()
    }
    if (request.todo == "translate") {
        //alert(request.result)
        var res = request.result
        var db = document;
        var w = window;
        if (w.parent != undefined) {
            db = w.parent.document;
        }
        var box = document.createElement("div");
        db.body.appendChild(box);
        box.style = "position: fixed;left:0;right:0;top:0;bottom:0;z-index:200;";
        var div = document.createElement("div");
        box.appendChild(div);
        div.style =
            "width:500px;height:200px;padding:10px;border-radius:5px;background-color: #fff;box-shadow: 2px 0 2px #666 , -2px 0 2px #666,0 2px 2px #666,0 -2px 2px #666;position: absolute;top:50%;margin-top:-100px;left:50%;margin-left:-250px;";
        var h2 = document.createElement("h2");
        h2.innerHTML = "译文";
        h2.style = "line-height:40px;height:40px;font-size:20px;text-align:center;border-bottom:1px solid #ccc;margin:0;";
        div.appendChild(h2);
        var condiv = document.createElement("div");
        condiv.innerHTML = res;
        condiv.style =
            "overflow:auto;line-height:24px;font-size:16px;border-bottom:1px solid #ccc;text-indent: 2rem;padding:5px;height:95px;";
        div.appendChild(condiv);
        var btn = document.createElement("div");
        btn.style = "text-align:right;padding:5px;height:45px;";
        div.appendChild(btn);
        btn.innerHTML = '<button style="background-color:#6495ed;width:20%;height:36px;padding:2px;float:right;">确定<tton>';
        var qd = btn.children[0];
        qd.onclick = function () {
            db.body.removeChild(box);
        }
    }
})
