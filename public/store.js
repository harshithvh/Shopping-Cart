// This is the client side
// Getting an error since I am using legacy version of Stripe Checkout couldn't figure out how to migrate to current version.

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else {
    ready()
}

function ready() {
    var removeCartItemButtons = document.getElementsByClassName('btn-danger')
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem)
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}

// StripeCheckout: obtained from https://checkout.stripe.com/checkout.js from the store.ejs
var stripeHandler = StripeCheckout.configure({
    key: stripePublicKey, // obtained from store.ejs
    locale: 'en',
    token: function(token) {

        // We wanna get all the id's and the quantity of the items that the user purchased
        var items = []
        var cartItemContainer = document.getElementsByClassName('cart-items')[0]
        var cartRows = cartItemContainer.getElementsByClassName('cart-row') // cartRows contains the total number of items in the cart
        for (var i = 0; i < cartRows.length; i++) {
            var cartRow = cartRows[i] // Get each item in the cart
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0] // Get the quantity of each item
            var quantity = quantityElement.value
            var id = cartRow.dataset.itemId //Get the id of the item

            items.push({
                id: id,
                quantity: quantity
            })
            // Now we have to send this to the server
            // we can send info to server using the easiest way: fetch that allows us to send req to server and get back info asynchronously
        }

        // sending info to a route /purchase on our server through POST
        fetch('/purchase', {
            method: 'POST',
            // since we are sending JSON type
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // we are receiving back json type from server
            },
            // data that we are sending to the server
            body: JSON.stringify({
                stripeTokenId: token.id, //token.id is generated when user clicks the purchase btn after filling out all the info like credit card no etc
                items: items
            })
            // the fetch returns a promise (success or failure) coming from the server
        }).then( function(res) { // for successful
            return res.json()
        }).then( function(data) {
            alert(data.message) // Alert a message to the user
            // After successful remove all the items from cart for a fresh start
            var cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) {
                cartItems.removeChild(cartItems.firstChild)
            }
            updateCartTotal()
        }).catch( function(error) { // for unsuccessful
            console.error(error) // Output in red text
        })


        console.log(token) // view it in the browser under console check for token.id
        // With the id in the token object and our SECRET_KEY we can charge the user with the total amount

    }// this function is called after the user clicks the purchase btn after filling out all the info like credit card no etc
})
// on clicking the purchase btn > calls stripe > stripe checks for validation 
function purchaseClicked() {
    
    var priceElement = document.getElementsByClassName('cart-total-price')[0]
    // parseFloat converts string(a float value) to number 
    var price = parseFloat(priceElement.innerText.replace('$', '')) * 100 // Ex: 12.99 shd be 1299
    // The open function below opens the checkout page(with credit card no etc) with amount equal to total price of the products the user wants to purchase
    stripeHandler.open({
        amount: price
    })
}

function removeCartItem(event) {
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    updateCartTotal()
}

function quantityChanged(event) {
    var input = event.target
    if (isNaN(input.value) || input.value <= 0) {
        input.value = 1
    }
    updateCartTotal()
}

function addToCartClicked(event) {
    var button = event.target
    var shopItem = button.parentElement.parentElement
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
    var id = shopItem.dataset.itemId // obtained from data-item-id in <div class="shop-item" data-item-id="<%= item.id %>"> store.ejs file
    addItemToCart(title, price, imageSrc, id)
    updateCartTotal()
}

function addItemToCart(title, price, imageSrc, id) {
    var cartRow = document.createElement('div')
    cartRow.classList.add('cart-row')
    cartRow.dataset.itemId = id
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('This item is already added to the cart')
            return
        }
    }
    var cartRowContents = `
        <div class="cart-item cart-column">
            <img class="cart-item-image" src="${imageSrc}" width="100" height="100">
            <span class="cart-item-title">${title}</span>
        </div>
        <span class="cart-price cart-column">${price}</span>
        <div class="cart-quantity cart-column">
            <input class="cart-quantity-input" type="number" value="1">
            <button class="btn btn-danger" type="button">REMOVE</button>
        </div>`
    cartRow.innerHTML = cartRowContents
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem)
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged)
}

function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0]
    var cartRows = cartItemContainer.getElementsByClassName('cart-row')
    var total = 0
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var priceElement = cartRow.getElementsByClassName('cart-price')[0]
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
        var price = parseFloat(priceElement.innerText.replace('$', ''))
        var quantity = quantityElement.value
        total = total + (price * quantity)
    }
    total = Math.round(total * 100) / 100
    document.getElementsByClassName('cart-total-price')[0].innerText = '$' + total
}