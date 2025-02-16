// ==UserScript==
// @name         Bazaar Auto Price - PityYouWeak
// @namespace    PityYouWeak
// @version      2.0
// @description  description
// @author       PityYouWeak
// @match        *.torn.com/bazaar.php*
// @grant        GM_xmlhttpRequest
// @updateURL    https://github.com/PityYouWeak/Torn/raw/main/BazaarAutoPricer/bazaarAutoPricer.user.js
// ==/UserScript==

const apikey = 'YOUR API KEY'
const callFromBazaar = true
const lessToTheMarketPrice = 10;

const torn_api = async (args) => {
  const a = args.split('.');
  const b = a[1].split('/');
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest ( {
      method: "GET",
      url: `https://api.torn.com/v2/${a[0]}/${b[0]}/itemmarket?offset=0`,
      headers: {
        "Content-Type": "application/json",
          "Authorization":  `ApiKey ${apikey}`
      },
      onload: (response) => {
          try {
            const resjson = JSON.parse(response.responseText)
            resolve(resjson)
          } catch(err) {
              alert(err)
            reject(err)
          }
      },
      onerror: (err) => {
          alert(err)
        reject(err)
      }
    })
  })
}


var event = new Event('keyup')
var APIERROR = false

async function lmp(itemID) {

  if(APIERROR === true) { alert("api ERROR"); return 'API key error' }

  let lowest_market_price = null

  if (callFromBazaar == true)
  {
const bazaarPrices = await torn_api(`market.${itemID}.bazaar`)

   if (bazaarPrices.error){APIERROR = true; return 'API key error'}
   lowest_market_price = bazaarPrices['itemmarket']['listings'][0].price
  }

  return lowest_market_price - lessToTheMarketPrice;
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.classList) {
        const input = node.querySelector('.input-money[type=text]')
        const input2 = node.querySelector('.input-money')
        if (input) {
          const itemID = input.parentElement?.parentElement.parentElement.parentElement.parentElement.querySelector('img').src.split('items/')[1];//li.querySelector('img').src.split('items/')[1]
          input.addEventListener('focus', function(e) {
              lmp(itemID).then((price) => {
                  let itemAmount = this.parentElement?.parentElement.parentElement.parentElement.parentElement.querySelector(".item-amount")?.textContent;
                  let amount = this.parentElement.parentElement.parentElement.querySelector('.clear-all');
                  let chkBox = this.parentElement?.parentElement.parentElement.parentElement.parentElement.querySelector(".checkbox-css");
                  hack(this,price);
                  if (amount !== null && itemAmount !== '' && chkBox == null) {
                    hack(amount,itemAmount);
                  }
                  this.dispatchEvent(event);
                  this.blur();
              })
            },{once: true})
        }
        else if (input2) {
          const itemID = input2.parentElement.parentElement.parentElement.querySelector('img').src.split('items/')[1]
          input2.addEventListener('focus', function(e) {
          let hasRemove = this.parentElement.parentElement.parentElement.querySelector('[class^=remove]');
          if (hasRemove || !doneUpdate) {
            lmp(itemID).then((price) => {
                let itemAmount = this.value;
                hack(this,price);
                this.dispatchEvent(e);
                this.blur();
                this.removeEventListener('focus',input2);
              })
            }
          },{once: true})
        }
      }
    }
  }
})

function hack(inp,price)
{
    const input = inp;
    input.value = price;
    let event = new Event('input', { bubbles: true });
    event.simulated = true;
    let tracker = input._valueTracker;
    if (tracker) {
        tracker.setValue(1);
    }
    input.dispatchEvent(event);
}

const wrapper = document.querySelector('#bazaarRoot')
observer.observe(wrapper, { subtree: true, childList: true })