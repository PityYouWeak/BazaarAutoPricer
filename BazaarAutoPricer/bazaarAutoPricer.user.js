// ==UserScript==
// @name         Bazaar Auto Price - PityYouWeak
// @namespace    PityYouWeak
// @version      0.9
// @description  description
// @author       PityYouWeak
// @match        *.torn.com/bazaar.php*
// @grant        GM_xmlhttpRequest
// @updateURL    https://github.com/PityYouWeak/Torn/raw/main/BazaarAutoPricer/bazaarAutoPricer.user.js
// ==/UserScript==

const apikey = 'YOUR API KEY'
const callFromItemMarket = true
const callFromBazaar = true
const lessToTheMarketPrice = 10;

const torn_api = async (args) => {
  const a = args.split('.');
  const b = a[1].split('/');
  //if (a.length!==4) throw(`Bad argument in torn_api(args, key): ${args}`)
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest ( {
      method: "GET",
      url: `https://api.torn.com/${a[0]}/${b[0]}?selections=${a[3]}&key=${apikey}`,
      headers: {
        "Content-Type": "application/json"
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

  if (callFromItemMarket == true)
  {
     const prices = await torn_api(`market.${itemID}.itemmarket`)
     if (prices.error) {APIERROR = true; return 'API key error'}
     for (const market in prices) {
      for (const lid in prices[market]) {
       if (lowest_market_price === null) lowest_market_price = prices[market][lid].cost
       else if (prices[market][lid].cost < lowest_market_price) lowest_market_price = prices[market][lid].cost
      }
    }
  }

  if (callFromBazaar == true)
  {
   const bazaarPrices = await torn_api(`market.${itemID}.bazaar`)

   if (bazaarPrices.error){APIERROR = true; return 'API key error'}
     for (const market in bazaarPrices) {
      for (const lid in bazaarPrices[market]) {
        if (lowest_market_price === null) lowest_market_price = bazaarPrices[market][lid].cost
        else if (bazaarPrices[market][lid].cost < lowest_market_price) lowest_market_price = bazaarPrices[market][lid].cost
      }
    }
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
              let hasRemove = this.parentElement.parentElement.parentElement.querySelector('[class^=remove]');
              if (this.value === '' || hasRemove) {
              lmp(itemID).then((price) => {
                  let itemAmount = this.parentElement?.parentElement.parentElement.parentElement.parentElement.querySelector(".item-amount")?.textContent;
                  let amount = this.parentElement.parentElement.parentElement.querySelector('.clear-all');
                  hack(this,price);
                  if (amount !== null && itemAmount !== '') {
                    hack(amount,itemAmount);
                  }
                  this.dispatchEvent(event);
              })
            }
          })
        }
          else if (input2) {
              const itemID = input2.parentElement.parentElement.parentElement.querySelector('img').src.split('items/')[1]
              input2.addEventListener('focus', function(e) {
              let hasRemove = this.parentElement.parentElement.parentElement.querySelector('[class^=remove]');
                  if (hasRemove) {
              lmp(itemID).then((price) => {
                  let itemAmount = this.parentElement?.parentElement.parentElement.parentElement.parentElement.querySelector(".item-amount")?.textContent;
                  let amount = this.parentElement.parentElement.parentElement.querySelector('.clear-all');
                  hack(this,price);
                  if (amount !== null && itemAmount !== '') {
                    hack(amount,itemAmount);
                  }
                  this.dispatchEvent(event);
                  this.blur();
              })
            }
          })
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