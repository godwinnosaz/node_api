import products from '../data/products.json' assert { type: 'json' };
import { v4 as uuidv4 } from 'uuid';
import { writeDataToFile } from '../utils.js';

export function findAll() {
    return new Promise((resolve) => {
        resolve(products);
    });
}

export function findById(id) {
    return new Promise((resolve) => {
        const product = products.find((p) => p.id === id);
        resolve(product);
    });
}

export function create(product) {
    return new Promise((resolve) => {
        const newProduct = { id: uuidv4(), ...product };
        products.push(newProduct);
        if (process.env.NODE_ENV !== 'test') {
            writeDataToFile('./data/products.json', products);
        }
        resolve(newProduct);
    });
}

export function update(id, product) {
    return new Promise((resolve, reject) => {
        const index = products.findIndex((p) => p.id === id);
        if (index !== -1) {
            products[index] = { id, ...product };
            if (process.env.NODE_ENV !== 'test') {
                writeDataToFile('./data/products.json', products);
            }
            resolve(products[index]);
        } else {
            reject(new Error('Product not found'));
        }
    });
}

export function remove(id) {
    return new Promise((resolve, reject) => {
        const filteredProducts = products.filter((p) => p.id !== id);
        if (filteredProducts.length !== products.length) {
            if (process.env.NODE_ENV !== 'test') {
                writeDataToFile('./data/products.json', filteredProducts);
            }
            resolve();
        } else {
            reject(new Error('Product not found'));
        }
    });
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
};
