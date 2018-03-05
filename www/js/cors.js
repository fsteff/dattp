MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations, observer) {
    replaceClickHandlers()
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  attributes: true,
  childList: true,
  characterData: true
  //...
});

const targetWindow = window.parent
replaceClickHandlers()

const repl = window.location.replace
window.location.replace = (str) => {
    console.log(repl)
    repl(str)
}

/*window.addEventListener('unload', (evt) => {
    var url = evt.target.URL
    if(! url.startsWith(window.location.protocol + '//' + window.location.host) || ! url.endsWith('?cors=true'))
        targetWindow.postMessage({location: evt.target.URL}, '*')
})*/

function replaceClickHandlers(){
    for (var ls = document.links, numLinks = ls.length, i=0; i<numLinks; i++){
        const href = ls[i].href
        ls[i].onclick = () => {
            targetWindow.postMessage({location: href}, '*')
            return false
        } // TODO: '*' is insecure
    }

}