/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции

  const { discount = 0, sale_price = 0, quantity = 0 } = purchase;
  const purchaseDiscount = 1 - discount / 100;
  return sale_price * quantity * purchaseDiscount;
}
/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге

  const profit = seller.profit || 0;

  let bonus = 0;

  if (index === 0) {
    // первый по прибыли
    bonus = profit * 0.15;
  } else if (index === 1 || index === 2) {
    // второй или третий по прибыли
    bonus = profit * 0.1;
  } else if (index === total - 1) {
    // последний по прибыли
    bonus = 0;
  } else {
    // все остальные
    bonus = profit * 0.05;
  }
  
  return +bonus.toFixed(2);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  // @TODO: Проверка наличия опций
  // @TODO: Подготовка промежуточных данных для сбора статистики
  // @TODO: Индексация продавцов и товаров для быстрого доступа
  // @TODO: Расчет выручки и прибыли для каждого продавца
  // @TODO: Сортировка продавцов по прибыли
  // @TODO: Назначение премий на основе ранжирования
  // @TODO: Подготовка итоговой коллекции с нужными полями

  //Проверка входных данных data
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // Проверка опций и функций options
  if (!options) {
    throw new Error("Опции не переданы");
  }

  const { calculateRevenue, calculateBonus } = options;
  if (
    !calculateRevenue ||
    !calculateBonus ||
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Отсутствуют функции расчёта");
  }

  //Промежуточная структура для статистики продавцов
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  const sellerIndex = sellerStats.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const productIndex = data.products.reduce((acc, item) => {
    acc[item.sku] = item;
    return acc;
  }, {});

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return; // на случай, если ID не найден

    seller.sales_count += 1; // увеличиваем количество чеков
    seller.revenue += record.total_amount; // увеличиваем общую выручку чека

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      // себестоимость (purchase_price * quantity)
      const cost = (product.purchase_price ?? 0) * (item.quantity ?? 0);
      // выручка по товару (через функцию из options)
      const itemRevenue = calculateRevenue(item, product);
      // прибыль по товару
      const itemProfit = itemRevenue - cost;

      seller.profit += itemProfit;

      // учёт количества проданных товаров по sku
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // Назначение бонусов и формирование топ-10 товаров
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);

    // формируем массив {sku, quantity} из объекта products_sold
    const topProducts = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity) // по убыванию количества
      .slice(0, 10); // берём топ-10

    seller.top_products = topProducts;
  });

  // Формируем итоговый отчёт
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
