/*
----------------------------------------------------------------------------
Bamazon -- Amazon-like store front app with a command-line interface
           using mySQL in the backend.
----------------------------------------------------------------------------
*/
'use strict';

require('console.tablefy');
const printf = require('printf');

//
// A class for Bamazon store
//
class BamazonStore {
  //
  // Constructor
  // 
  constructor() {
    this.mysql = require('mysql');            // mysql module variable
    this.inquirer = require('inquirer');      // inquirer binding variable
    this.config = require('./mysql_config');  // MySQL connection parameters
    this.connection = null;                   // MySQL connection
  }
  
  //
  // Run the sequence of store purchase processes
  //
  // NOTE: the "error" variable is shadowed in nested branches
  //
  run() {
    console.log("HERE 1");
    if (!this.connectToBamazon()) return;

    console.log("HERE 2");
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
                    console.log(`Order Total: $${price * answers.qty}`);
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
  // Connect to "bamazon" database
  //
  connectToBamazon() {
    this.connection = this.mysql.createConnection(this.config);

    this.connection.connect(function(err) {
      if (err) {
        console.error('error connecting: ' + err.stack);
        return false;
      }
    });
    
    return true;
  }

  //
  // Generic query function to return result as a Promise
  //
  // RETURN:
  // * Promise
  //     resolve = query results from mysql api
  //     reject  = error msg
  //
  query(stmt, ...placeholders) {
    return new Promise((resolve, reject) => {
      this.connection.query(stmt, placeholders, (error, results, fields) => {
        if (error) reject(error);
        resolve(results);
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
  // * Promise -- see the "query" function of this class
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

  //
  // Returns available quantities for the productID
  //
  // RETURN:
  // * Promise
  //     resolve = query results from mysql api
  //     reject  = error msg
  //
  numProductsInStock(productID) {
    const stmt = `
      SELECT stock_quantity 
      FROM   products
      WHERE  item_id = ?`;

    return new Promise((resolve, reject) => {
      this.query(stmt, productID).then((result, error) => {
        if (error) reject(error);
        resolve(result[0].stock_quantity);
      }).catch(error => reject(error));
    });
  }
  
  //
  // Returns price of a specified productID
  //
  // RETURN:
  // * Promise
  //     resolve = the product price
  //     reject  = error msg
  //
  productPrice(productID) {
    const stmt = `
      SELECT price 
      FROM   products
      WHERE  item_id = ?`;

    return new Promise((resolve, reject) => {
      this.query(stmt, productID).then((result, error) => {
        if (error) reject(error);
        resolve(result[0].price);
      }).catch(error => reject(error));
    });
  }

  //
  // Update the number of available quantities for the productID
  //
  // RETURN:
  // * Promise
  //     resolve = true, if update has been successful
  //               false, otherwise
  //     reject  = error msg
  //
  updateProdQty(productID, newQty) {
    const stmt = `
      UPDATE products
      SET    stock_quantity = ?
      WHERE  item_id = ?`;

    // console.log(stmt, productID, newQty);
    return new Promise((resolve, reject) => {
      this.query(stmt, newQty, productID).then((result, error) => {
        if (error) reject(error);
        resolve(result.changedRows === 1);
      }).catch(error => reject(error));
    });
  }

  //
  // End connection to the bamazon database
  //
  closeConnection() {
    this.connection.end();
  }
}

//
// A driver function for the Bamazon store front
//
// NOTE: the "error" variable is shadowed in nested branches
//
function runStore() {
  const store = new BamazonStore;
  store.run();
}

/*** run the store ***/
runStore();
