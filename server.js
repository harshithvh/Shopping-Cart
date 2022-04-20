// visit stipe.com > Dashboard > Developers > API Keys - Publishable Key and Secret Key
// Dev-dependency-package: It's only installed when your working in the development environment but it won't be installed on production

// Load environment variable
// Check if running in production or development environment
// NODE_ENV: Variable set by node itself to verify on which environment your running on
if (process.env.NODE_ENV !== 'production') { // since we have downloaded .env on development environment
    require('dotenv').config()  // going to load all variables in .env file and put them inside process.env variable on the server
}


const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

console.log(stripeSecretKey, stripePublicKey)

const express = require('express')
const fs = require('fs')
// we need to pass our stripeSecretKey In order to activate the stripe api
const stripe = require('stripe')(stripeSecretKey)

const app = express()

app.set('view-engine', 'ejs')

app.use(express.json())
app.use(express.static('public'))

// The server has control of what items are being used on the frontend and items a user purchases
app.get('/store', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', (req, res) => {
    fs.readFile('items.json', (error, data) => {
        if (error) {
            res.status(500).end()
        } else {
            console.log('purchase')
            // We can charge the user using the token(token.id) as well as the items we sent to server
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            // Since we have two properties music and merch in the items.json we are gonna create a single array for finding the different items based on 
            // the users purchase
            let total = 0 
            // req.body.items is coming from the fetch API in store.js
            req.body.items.forEach(item => {
                const itemJson = itemsArray.find(i => {
                    return i.id == item.id // so we can access the price of that item from the itemsArray through the id
                })
                total = total + itemJson.price * item.quantity // increment the total by the no of quantity * price of each item
            })

            console.log(total, req.body.stripeTokenId)

            // we need to create a stripe variable for accessing the stripe api
            stripe.charges.create({
                amount: total, // stripe accepts only pennies intead of dollar formatted
                source: req.body.stripeTokenId, // req.body.stripeTokenId is coming from the fetch API in store.js
                currency: 'inr'
                // Now we need to handle what if the charge comes back successfully or failure from stripe
                // the create returns a promise (success or failure)
            }).then( function() { // for successful
                console.log('Charge Successful')
                res.json({ message: 'Successfully purchased items'}) // respond back to the user with message
            }).catch( function() { // for error
                console.log('Charge Fail')
                res.status(500).end()
            })
        }
    })
})

app.listen(3000, () => console.log('Server running on port 3000'))