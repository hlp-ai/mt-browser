chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.cmd === 'goback') {
        console.log('refresh')
        window.location.reload()
    }
})
