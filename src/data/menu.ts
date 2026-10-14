import { IMenu } from "@/types/menu";

export const MENU_DATA: IMenu[] = [
  // Biriyani
  { _id: '1', title: "Kacchi Biriyani", section: "Biriyani", price: 350, image: "/menu/veg-biryani.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '5', title: "Chicken Dum Biriyani", section: "Biriyani", price: 280, image: "/menu/chicken-dum-biryani.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '6', title: "Mutton Handi Biriyani", section: "Biriyani", price: 420, image: "/menu/mutton-biryani.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },

  // Curry
  { _id: '2', title: "Chicken Kosha", section: "Curry", price: 280, image: "/menu/chicken-masala.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '7', title: "Paneer Butter Masala", section: "Curry", price: 240, image: "/menu/paneer-butter-masala.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '8', title: "Mutton Rogan Josh", section: "Curry", price: 380, image: "/menu/mutton-rogan-josh.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },

  // Breads
  { _id: '9', title: "Garlic Naan", section: "Breads", price: 60, image: "/menu/garlic-naan.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '10', title: "Tandoori Roti", section: "Breads", price: 25, image: "/menu/tandoori-roti.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },

  // Snacks
  { _id: '3', title: "Fuchka", section: "Snacks", price: 60, image: "/menu/crispy-corn.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '11', title: "Chicken Tikka", section: "Snacks", price: 220, image: "/menu/chicken-tikka.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '12', title: "Crispy Chilli Babycorn", section: "Snacks", price: 180, image: "/menu/crispy-corn.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },

  // Desserts
  { _id: '13', title: "Gulab Jamun", section: "Desserts", price: 80, image: "/menu/gulab-jamun.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '14', title: "Rasmalai", section: "Desserts", price: 120, image: "/menu/gulab-jamun.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },

  // Drinks
  { _id: '4', title: "Mango Lassi", section: "Drinks", price: 100, image: "/menu/masala-chaas.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '15', title: "Masala Chai", section: "Drinks", price: 30, image: "/menu/masala-chaas.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
  { _id: '16', title: "Fresh Lime Soda", section: "Drinks", price: 70, image: "/menu/masala-chaas.jpg", quantity: 100, merchantId: '', createdAt: new Date(), updatedAt: new Date() },
];
