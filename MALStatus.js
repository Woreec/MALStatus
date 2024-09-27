// ==UserScript==
// @name         MALStatus
// @version      1.1.3
// @description
// @author       Woreec
// @grant        GM_setValue
// @grant        GM_getValue
// @namespace    https://github.com/Woreec/MALStatus
// @match        https://myanimelist.net/*
// @downloadURL  https://raw.githubusercontent.com/Woreec/MALStatus/refs/heads/main/MALStatus.js
// @updateURL    https://raw.githubusercontent.com/Woreec/MALStatus/refs/heads/main/MALStatus.js
// ==/UserScript==


// Get Status from page, and send to be StatusScript (addStatus)
function StatusScript() {
    const LOCATION_HREF = location.href;
    const URL_REGEX = /https:\/\/myanimelist\.net\/(anime|manga)\/([1-9][0-9]?[0-9]?[0-9]?[0-9]?[0-9]?)\/?.*/;
    const URL_PHP_REGEX = /https:\/\/myanimelist\.net\/(anime|manga)\.php\?id\=([1-9][0-9]?[0-9]?[0-9]?[0-9]?[0-9]?)\/?.*/;


    // Anime Seasonal
    if (LOCATION_HREF.includes('https://myanimelist.net/anime/season')) {
        let results = document.getElementsByClassName('link-title');
        for (let i = 0; i < results.length; i++) {
            if (!document.getElementById('status' + i)) {
                let url = results[i].href;
                let urlDecoded = decodeURIComponent(url);
                let id = url.split('/')[4];
                let selector = 'a[href="' + urlDecoded + '"].link-title';
                addStatus('anime', i, url, id, selector, false, true);
            }
        }
    }
}

// Get get status and add to page
function addStatus(type, count, url, id, selector, parent = false, tile = false, producer = false) {
    let styleId = "";
    let styleIdEnd = "";

    if (tile) {
        // Determine text color based on status
        let textColor = '';
        if (CheckStatusAge(id)) {
            let statusText = storedAnimeStatus[id][0];
            if (statusText === "Currently Airing") {
                textColor = 'color: #8e0000;';
            } else if (statusText === "Finished Airing") {
                textColor = 'color: green;';
            }
        }
        styleId = '<h3 class="h3_anime_subtitle" id="status' + count + '" style="font-weight: bold; ' + textColor + '">';
        styleIdEnd = '</h3>';

    } else {
        // Determine text color based on status
        let textColor = '';
        if (CheckStatusAge(id)) {
            let statusText = storedAnimeStatus[id][0];
            if (statusText === "Currently Airing") {
                textColor = 'color: #8e0000;';
            } else if (statusText === "Finished Airing") {
                textColor = 'color: green;';
            }
        }
        styleId = '<div style="font-weight:bold; ' + textColor + '" id="status' + count + '">';
        styleIdEnd = '</div>';
    }

    if (type === 'anime') {
        if (producer) {
            document.getElementsByClassName('category')[count].style.visibility = 'hidden';
        }

        // Check if the status exists
        if (CheckStatusAge(id)) {
            document.querySelectorAll(selector).forEach(function (element) {
                // Find the parent .title-text element
                let titleTextElement = element.closest('.title-text');
                if (titleTextElement) {
                    // Insert the HTML as a sibling above the h2 element
                    titleTextElement.insertAdjacentHTML('afterbegin', styleId + storedAnimeStatus[id][0] + styleIdEnd);
                }
            });
        } else {
            // If the status doesn't exist, get the English title
            getStatus(type, url, id, selector, parent, styleId, styleIdEnd, count);
        }
    }
}


// Request Status from MAL and send to be stored (storeAnimeStatus)
function getStatus(type, url, id, selector, parent, styleId, styleIdEnd, count) {
    // Create new request
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'document';

    // Set the callback
    xhr.onload = function () {
        if (xhr.readyState === xhr.DONE && xhr.status === 200 && xhr.responseXML !== null) {
            // === Get the Status ===
            let spaceitPadElements = xhr.responseXML.querySelectorAll('.spaceit_pad');
            let statusText = '';
            spaceitPadElements.forEach(function (element) {
                let darkTextElement = element.querySelector('.dark_text');
                if (darkTextElement && darkTextElement.innerText.trim() === 'Status:') {
                    // Get the status text after the "Status:" span
                    statusText = darkTextElement.nextSibling.textContent.trim();
                }
            });

            // === Store the Status ===
            if (type === 'anime') {
                storeAnimeStatus(id, statusText);// Store the status
            }

            // === Insert Status into the Document ===
            addStatus(type, count, url, id, selector, parent)

        }
    };

    // Send the request
    xhr.open('GET', url);
    xhr.send();
}
function storeAnimeStatus(id, status) {
    storedAnimeStatus[id] = [status, Date.now()];
    GM_setValue('status', storedAnimeStatus);
}

function CheckStatusAge(id) {
    if (storedAnimeStatus.hasOwnProperty(id)) {
        if (typeof storedAnimeStatus[id][0] === 'string' && storedAnimeStatus[id][0] !== 'Finished Airing') {
            let dateNow = Date.now();
            let dateOld = storedAnimeStatus[id][1];
            if (dateNow - dateOld > 10800000) {
                return false;
            }
        }
        return true;
    }
    return false;
}


var storedAnimeStatus = GM_getValue('status')

if (!storedAnimeStatus) {
    GM_setValue('status', {});
    storedAnimeStatus = {};
}


// Launch actual script
console.log('Status Scritp Running')
StatusScript();
