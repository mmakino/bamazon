/*
----------------------------------------------------------------------------
Bamazon -- Amazon-like store front app with a command-line interface
           using mySQL in the backend.
----------------------------------------------------------------------------
*/
'use strict';

const BamazonStore = require('./bamazonStore');
const printf = require('printf');

//
// A class for Bamazon Customer store purchase processing
//
class BamazonCustomer extends BamazonStore {
  //
  // Constructor
  // 
  constructor() {
    super();
  }
  
  //
  // Run the sequence of store purchase processes
  //
  // NOTE: the "error" variable is shadowed in nested branches
  //
  run() {
    if (!this.connectToBamazon()) return;

    this.listProducts().then((results, error) => {
      if (error) throw error;

      const products = Object.values(results);
      this.takeOrder(products).then(answers => {
        const selected = products.filter(p => p.ID === answers.id);

        this.numProductsInStock(answers.id).then((numAvail, error) => {
          if (error) throw error;
          if (numAvail < answers.qty) {
            console.log('Insufficient quantity! ',
                        `Only ${numAvail} left (${answers.qty} asked)`);
            this.closeConnection();
          }
          else {
            // console.log(`the quantity available: ${numAvail} >= ${answers.qty}`);
            const newQty = numAvail - answers.qty;
            this.updateProdQty(answers.id, newQty)
              .then((isSuccess, error) => {
                if (error) throw error;
                if (isSuccess) {
                  this.productPrice(answers.id).then((price, error) => {
                    if (error) throw error4;
                    console.log(`Order Total: $${(price * answers.qty).toFixed(2)}`);
                    this.closeConnection();
                  });
                }
                else {
                  console.log('The order fulfillment failed during update.')
                  this.closeConnection();
                }
              })
              .catch(error => { throw error; });
          }
        })
      });
    });
  }

  //
  // List products from the "products" table
  //
  // Returns only the following columns:
  // 1)ID, 2)Product Name, and 3)Price
  //
  // RETURN:
  // * Promise -- see the "query" function of BamazonStore class
  //
  listProducts() {
    const stmt = `
      SELECT 
        item_id AS ID, 
        product_name AS "Product Name", 
        price AS Price 
      FROM products`;

    return this.query(stmt);
  }

  //
  //  Ask user with two questions 1)product ID, and 2)quantity
  //
  // RETURN:
  // * Promise
  //     resolve = Javascript Object { id: <product_id>, qty: <quantity> }
  //     reject  = error msg
  //
  takeOrder(productList) {
    return new Promise((resolve, reject) => {
      let products = productList.map(p => {
        return printf("%2d) %-51s$%7.2f", ...Object.values(p));
      });

      this.inquirer
        .prompt([{
            type: 'list',
            name: 'id',
            message: "Select a product you want to buy",
            choices: products
          },
          {
            type: 'input',
            name: 'qty',
            message: "How many?",
            default: 1
          }
        ])
        .then(answers => {
          answers.id = parseInt(answers.id);
          answers.qty = parseInt(answers.qty);
          resolve(answers);
        })
        .catch(error => reject(error));
    });
  }
}

//
// A driver function for the Bamazon store front
//
function runStoreFront() {
  const customer = new BamazonCustomer;
  customer.run();
}

/*** run the store ***/
runStoreFront();

