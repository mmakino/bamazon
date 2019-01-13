/*
----------------------------------------------------------------------------
Bamazon -- Amazon-like storefront app with a command-line interface
           using mySQL in the backend.

Manager View with the following operation options:
 * View Products for Sale
   - list every available item: the item IDs, names, prices, and quantities.
   
 * View Low Inventory
   - list all items with an inventory count lower than five.
   
 * Add to Inventory
   - display a prompt that will let the manager "add more" of any item 
     currently in the store.
     
 * Add New Product
   - allow the manager to add a completely new product to the store.
----------------------------------------------------------------------------
*/
'use strict';

require('console.tablefy');
const printf = require('printf');
const BamazonStore = require('./bamazonStore');   // a base class

//
// A class for Bamazon Store Manager View
//
class BamazonManager extends BamazonStore {
  //
  // Constructor
  // 
  constructor(limit = 5) {
    super();  // initialize the parent class constructor
    this.tblcfg = {cell_pos: 'center', style: 'norc'}
    this.lowInventoryLimit = limit;
  }
  
  //
  // Run the sequence of store purchase processes
  //
  run() {
    if (!this.connectToBamazon()) return;
    return this.managerMenu();
  }

  //
  // Operation options for the manager view
  //
  //  * View Products for Sale
  //    - list every available item: the item IDs, names, prices, and quantities.
  //  
  //  * View Low Inventory
  //    - list all items with an inventory count lower than five.
  //  
  //  * Add to Inventory
  //    - display a prompt that will let the manager "add more" of any item 
  //      currently in the store.
  //    
  //  * Add New Product
  //    - allow the manager to add a completely new product to the store.
  //
  managerMenu() {
    this.inquirer
      .prompt([{
          type: 'list',
          name: 'op',
          message: "Select an option",
          choices: ['View Products for Sale',
                    `View Low Inventory (< ${this.lowInventoryLimit})`,
                    'Add to Inventory',
                    'Add New Product']
        },
      ])
      .then(selected => {
        switch(selected.op) {
          case 'View Products for Sale':
            this.viewProductsForSale()
              .then(result => console.tablefy(result, this.tblcfg));
            this.closeConnection();
            break;
          case `View Low Inventory (< ${this.lowInventoryLimit})`:
            this.viewLowInventory(this.lowInventoryLimit)
              .then(result => {
                if (result.length === 0) {
                  console.log('All products appear to have >',
                              `${this.lowInventoryLimit} items`);
                }
                else {
                  console.tablefy(result, this.tblcfg)
                }
              });
            this.closeConnection();
            break;
          case 'Add to Inventory':
            this.addToInventory();
            break;
          case 'Add New Product':
            this.addNewProduct();
            break;
        }
        // this.managerMenu();
      });
      
    return true;
  }

  //
  // Query products from the "products" table
  //  * View Products for Sale
  //    - list every available item: the item IDs, names, prices, and quantities.
  //
  // RETURN:
  // * Promise -- see the "query" function of this class
  //
  viewProductsForSale() {
    const stmt = `
      SELECT 
        item_id, 
        product_name, 
        price,
        stock_quantity 
      FROM products`;

    return this.query(stmt).then(result => {
      return this.formatForTablefy(result);
    });
  }
 
  //
  // Query products from the "products" table
  //  * View Low Inventory
  //    - list all items with an inventory count lower than five.
  //    - list item: the item IDs, names, prices, and quantities.
  //
  // RETURN:
  // * Promise -- see the "query" function of this class
  //
  viewLowInventory(limit = this.lowInventoryLimit) {
    const stmt = `
      SELECT 
        item_id, 
        product_name, 
        price,
        stock_quantity 
      FROM products
      WHERE stock_quantity < ?
      `;

    return this.query(stmt, limit).then(result => {
      return this.formatForTablefy(result);
    });
  }

  //
  // Format tabular data for tablefy column right-align
  //
  formatForTablefy(tblData) {
    return tblData.map(row => {
      row.product_name = printf("%-45s", row.product_name);
      row.price = printf("%7.2f", row.price);
      row.stock_quantity = printf("%5d", row.stock_quantity);
      return row;
    });
  }

  //
  // Add more product items into inventory
  //  * Add to Inventory
  //    - display a prompt that will let the manager "add more" of any item 
  //      currently in the store.
  //
  addToInventory() {
    this.viewProductsForSale()
      .then((result, error) => {
        const products = result.map(
          p => printf("%2d) %-51s$%7.2f %20d", ...Object.values(p))
        );
        this.inquirer
          .prompt([{
              type: 'list',
              name: 'id',
              message: "Select a product ID to add more items",
              choices: products
            },
            {
              type: 'input',
              name: 'qty',
              message: "How many items to add?",
              default: 10
            }
          ])
          .then(answers => {
            answers.id = parseInt(answers.id);
            answers.qty = parseInt(answers.qty);
            this.addMoreOfProduct(answers.id, answers.qty);
          });
      });
  }
  
  //
  // A helper function for addToInventory to add more items for a product
  //
  // PARAMS:
  // * id = product_id
  // * qty = the number of items to add
  //
  addMoreOfProduct(id, numAdd) {
    this.numProductsInStock(id).then((numAvail, error) => {
      if (error) throw error;

      const newQty = numAvail + numAdd;
      this.updateProdQty(id, newQty)
        .then((isSuccess, error) => {
          if (error) throw error;
          if (isSuccess) {
            console.log(`Added ${numAdd} to ${id}`);
          } else {
            console.log('Failed to add more items.')
          }
          this.closeConnection();
        })
        .catch(error => {
          throw error;
        });
    });
  }
  
  //
  // Add a new product item into inventory
  //  * Add New Product
  //    - allow the manager to add a completely new product to the store.
  //
  // RETURN:
  // * Promise -- see the "query" function of this class
  //
  addNewProduct() {
    this.inquirer
      .prompt([{
          type: 'input',
          name: 'product_name',
          message: "What is the product name?"
        },
        {
          type: 'input',
          name: 'price',
          message: "What is the price?"
        },
        {
          type: 'input',
          name: 'stock_quantity',
          message: "How many items?",
        },
        {
          type: 'input',
          name: 'department_name',
          message: "What is the dapartment name for the product?",
          default: null
        }
      ])
      .then(answers => {
        this.insertNewProduct(answers).then((result, error) => {
          if (error) {
            console.log(error);
          }
          else {
            console.log(`The new product added successfully as ID ${result.insertId}`);
          } 
          this.closeConnection();
        }); 
      });
  }
  
}

//
// A driver function for the BamazonManager class
//
function runManagerView() {
  const manager = new BamazonManager;
  manager.run();
}

/*** run the app ***/
runManagerView();
