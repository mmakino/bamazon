/*
----------------------------------------------------------------------------
Bamazon -- Amazon-like store front app with a command-line interface
           using mySQL in the backend.
----------------------------------------------------------------------------
*/
'use strict';

//
// A base class for Bamazon store
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
    if (!this.connectToBamazon()) return;

    this.listProducts().then((results, error) => {
      if (error) throw error;

      const products = Object.values(results);
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
  // Returns all columns
  //
  // RETURN:
  // * Promise -- see the "query" function of this class
  //
  listProducts(stmt = 'SELECT * FROM products') {
    return this.query(stmt);
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
    let stmt = `
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
  // Insert a new product into inventory
  //
  // PARAMS:
  // * input = { product_name:    <product_name>,
  //             price:           <price>,
  //             stock_quantity:  <stock_quantity>, 
  //             department_name: <department_name>
  //           }
  //
  insertNewProduct(input) {
    let stmt = `INSERT INTO products SET ?`;
    let product = {
      product_name: input.product_name,
      price: parseFloat(input.price),
      stock_quantity: parseInt(input.stock_quantity),
      department_name: input.department_name
    };

    // console.log(JSON.stringify(product));
    return new Promise((resolve, reject) => {
      this.query(stmt, product).then((result, error) => {
        if (error) reject(error);
        resolve(result);
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

module.exports = BamazonStore;
