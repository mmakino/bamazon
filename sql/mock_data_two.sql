
use bamazon;

drop table if exists products;
create table products(
	item_id INT NOT NULL auto_increment PRIMARY KEY,
    product_name varchar(256),
    department_name varchar(128),
    price decimal(6,2),
    stock_quantity int(5)
);

insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Magic Chef Refrigerator',
		'Appliances',
        135.79,
        11
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Toshiba Microwave Oven',
        'Appliances',
        112.69,
        22
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Cuisinart Classic 4-Slice Toaster',
		'Home & Kitchen',
        49.99,
        33
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Mastering the Elements of Good Cooking',
		'Books',
        23.46,
        100
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Becoming by Michelle Obama',
		'Books',
        19.50,
        300
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Organic Broccoli',
		'Bamazon Fresh',
        3.98,
        55
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Yellow Onion, One Large',
		'Bamazon Fresh',
        0.89,
        99
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Organic Broccoli',
		'Bamazon Fresh',
        1.75,
        88
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'Charizard-EX Box Fire Blast Card Game',
		'Toys & Games',
        16.70,
        37
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'TOMY Pokémon Action Figure, Ash-Greninja',
		'Toys & Games',
        14.88,
        29
	)
;
insert into products
	(product_name, department_name, price, stock_quantity)
    values(
		'adidas Mens Adissage Sandal',
		'Clothing, Shoes & Jewelry',
        14.80,
        16
	)
;
