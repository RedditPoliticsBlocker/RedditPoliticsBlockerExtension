var data_url = "https://rocky-crag-41069.herokuapp.com/filterList/test.json";
//chrome.storage.sync.clear()

async function politicsBlock() {
    // Vars
    var secondsTilUpdate = 30 * 60; // Every half hour

    //------------------------------------------
    // Start INIT
    var denylists = await getStorageData('polBlock')
    denylists = denylists.polBlock;
    filterReddit(denylists);
    
    // Check if denylists need to be updated
    const curr_time = Date.now();
    if ((denylists == null) || 
        (denylists.lastUpdatedTime == null) || 
        ((curr_time - denylists.lastUpdatedTime) / 1000 > secondsTilUpdate)) {
            
        // Update list
        chrome.storage.sync.clear()
        denylists = null;
        denylists = await updateFilterList(denylists, data_url, curr_time);
    } 
    // END INIT
    //------------------------------------------

    filterReddit(denylists);
}
async function updateFilterList(denylists, data_url, curr_time) {
    const res = await fetch(data_url);
    var temp = await res.json();

    if (denylists == null) {
        denylists = temp;
    } else {
        for (var key in temp.subreddit) {
            denylists.subreddit[key] = temp.subreddit[key];
        }
        for (var key in temp.permalink) {
            denylists.permalink[key] = temp.permalink[key];
        }
    }
    denylists.lastUpdatedTime = curr_time;
    await setStorageData({
        'polBlock': denylists
    })
    return denylists;
}

var set_subreddit = new Set(["politics", "PoliticalHumor"]); 

function filterReddit(denylists) {
    var count = 0;
    $("#siteTable").children().each(function () {
        var subreddit = $(this)[0].getAttribute("data-subreddit")
        var permalink = $(this)[0].getAttribute("data-permalink")
        
        if (denylists == null) {
            if (set_subreddit.has(subreddit)) {
                $(this)[0].remove();
                return;
            }
        } else {
            if (subreddit) {
                if (denylists.subreddit[subreddit]) {
                    count += 1;
                    $(this)[0].remove();
                    return;
                }
                if (denylists.permalink[permalink]) {
                    count += 1;
                    $(this)[0].remove();
                    return;
                }
            }
        }
    });
    
    $(".linkflairlabel ").each(function () {
        var flair = $(this)[0].getAttribute("title");
        if (flair == "Politics") {
            $(this).parents()[3].remove(); // 3 layers up
        }
    });
    /*
    // Publish Count
    console.log(count.toString());
    if (count > 9) {
        chrome.browserAction.setBadgeText({text: "10+"});
    } else {
        chrome.browserAction.setBadgeText({text: count.toString()});
    }
    */
}

const getStorageData = key =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.get(key, result =>
            chrome.runtime.lastError
             ? reject(Error(chrome.runtime.lastError.message))
             : resolve(result)))
    const setStorageData = data =>
    new Promise((resolve, reject) =>
        chrome.storage.sync.set(data, () =>
            chrome.runtime.lastError
             ? reject(Error(chrome.runtime.lastError.message))
             : resolve()))

const promisifyNoFail = function(thisArg, fnName, outFn = r => r) {
    const fn = thisArg[fnName];
    return function() {
        return new Promise(resolve => {
            fn.call(thisArg, ...arguments, function() {
                if ( chrome.runtime.lastError instanceof Object ) {
                    void chrome.runtime.lastError.message;
                }
                resolve(outFn(...arguments));
            });
        });
    };
};
politicsBlock();
