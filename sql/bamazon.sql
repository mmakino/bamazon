drop database if exists bamazon;
create database bamazon;
use bamazon;

create table products(
	item_id INT NOT NULL auto_increment PRIMARY KEY,
    product_name varchar(256),
    department_name varchar(128),
    price decimal(6,2),
    stock_quantity int(5)
);