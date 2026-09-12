import { Product, sequelize } from '../models/index.js';

async function resetStock() {
  try {
    await sequelize.authenticate();
    await Product.update({ stock: 50 }, { where: {} });
    console.log('Successfully reset all product stocks to 50');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset stock:', err);
    process.exit(1);
  }
}

resetStock();
