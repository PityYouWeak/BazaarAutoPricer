// ==UserScript==
// @name         Bazaar Auto Price - PityYouWeak
// @namespace    PityYouWeak
// @version      0.8
// @description  description
// @author       PityYouWeak
// @match        *.torn.com/bazaar.php*
// @updateURL    https://github.com/PityYouWeak/Torn/raw/main/BazaarAutoPricer/bazaarAutoPricer.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const apikey = 'YOUR API KEY HERE'
const callFromItemMarket = true
const callFromBazaar = false

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

  return lowest_market_price + 10
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.classList && node.classList.contains('input-money-group')) {
        const li = node.closest('li.clearfix') || node.closest('li[id^=item]')
        const input = node.querySelector('.input-money[type=text]')
        if (li) {
          const itemID = li.querySelector('img').src.split('items/')[1]
          input.addEventListener('focus', function(e) {
            if (this.id.includes('price-item')) this.value = ''
            if (this.value === '') {
              lmp(itemID).then((price) => {
                  const hidden = node.querySelector('.input-money[type=hidden]')
                  hidden.remove();
                  var ev = new Event('input', { bubbles: true});
                  ev.simulated = true;
                  this.value = price;
                  this.dispatchEvent(ev);
              })
            }
          })
        }
      }
    }
  }
})

const wrapper = document.querySelector('#bazaarRoot')
observer.observe(wrapper, { subtree: true, childList: true })