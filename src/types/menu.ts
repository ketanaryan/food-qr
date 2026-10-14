export interface IMenu {
  _id: string;
  merchantId: string;
  image: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  section: string;
  isVeg?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
