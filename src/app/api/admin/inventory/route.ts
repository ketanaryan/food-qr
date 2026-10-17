import { NextResponse } from 'next/server';
import { isStaffAuthorized } from '@/lib/staffAuth';
import { isOwnerAuthorized } from '@/lib/ownerAuth';
import { 
  getInventoryStore, 
  saveInventoryStore, 
  recordStockInward, 
  recordStockWastage, 
  recordVendorPayment, 
  recordDailyReconciliation, 
  depleteStockForOrderItems,
  recordPurchaseOrder,
  updatePurchaseOrderStatus,
  recordInternalTransfer,
  updateInternalTransferStatus,
  convertSubRecipeBatch,
  saveMultiStageRecipe,
  InventoryItem,
  RecipeBOM,
  PurchaseOrder,
  SubRecipePrep,
  MultiStageRecipe,
  InternalTransfer
} from '@/lib/inventoryStore';

export async function GET(req: Request) {
  try {
    const authorized = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized staff session required' }, { status: 401 });
    }

    const store = getInventoryStore();

    // Calculate executive KPIs
    const totalValuation = store.items.reduce((acc, i) => acc + (i.currentStock * i.costPerUnit), 0);
    const totalInwardMonth = store.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalPendingUdhar = store.vendors.reduce((acc, v) => acc + v.pendingDue, 0);
    const lowStockItems = store.items.filter(i => i.currentStock <= i.minAlertStock);
    const totalWastageLoss = store.logs
      .filter(l => l.type === 'WASTAGE')
      .reduce((acc, l) => acc + l.cost, 0);

    return NextResponse.json({
      success: true,
      store,
      stats: {
        totalValuation: Number(totalValuation.toFixed(2)),
        totalInwardMonth: Number(totalInwardMonth.toFixed(2)),
        totalPendingUdhar: Number(totalPendingUdhar.toFixed(2)),
        totalAccountsPayable: Number(totalPendingUdhar.toFixed(2)),
        lowStockCount: lowStockItems.length,
        lowStockItems,
        totalWastageLoss: Number(totalWastageLoss.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Inventory GET API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authorized = (await isStaffAuthorized(req)) || (await isOwnerAuthorized(req));
    if (!authorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized staff session required' }, { status: 401 });
    }

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ success: false, message: 'Missing action field' }, { status: 400 });
    }

    const store = getInventoryStore();

    switch (action) {
      case 'ADD_ITEM': {
        const item: InventoryItem = {
          id: payload.id || 'inv-' + Date.now(),
          name: payload.name.trim(),
          category: payload.category || 'Grocery',
          currentStock: Number(payload.currentStock) || 0,
          unit: payload.unit || 'kg',
          minAlertStock: Number(payload.minAlertStock) || 2,
          costPerUnit: Number(payload.costPerUnit) || 100,
          vendorName: payload.vendorName || 'Direct Market',
          vendorPhone: payload.vendorPhone || '9822334455',
          lastUpdated: 'Just now'
        };
        store.items.unshift(item);
        saveInventoryStore(store);
        return NextResponse.json({ success: true, message: `${item.name} added to inventory`, item });
      }

      case 'UPDATE_ITEM': {
        const index = store.items.findIndex(i => i.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
        }
        store.items[index] = {
          ...store.items[index],
          ...payload,
          lastUpdated: 'Just now'
        };
        saveInventoryStore(store);
        return NextResponse.json({ success: true, message: 'Item updated successfully', item: store.items[index] });
      }

      case 'DELETE_ITEM': {
        store.items = store.items.filter(i => i.id !== payload.id);
        saveInventoryStore(store);
        return NextResponse.json({ success: true, message: 'Item removed from inventory' });
      }

      case 'STOCK_INWARD': {
        const result = recordStockInward(payload);
        return NextResponse.json({ success: true, message: 'Stock inward recorded successfully', result });
      }

      case 'LOG_WASTAGE': {
        const result = recordStockWastage(payload);
        return NextResponse.json({ success: true, message: 'Wastage recorded successfully', result });
      }

      case 'SETTLE_VENDOR_PAYMENT': {
        const result = recordVendorPayment(payload.vendorId, payload.amount, payload.paymentMethod);
        return NextResponse.json({ success: true, message: `₹${result.paidAmount} payment recorded to ${result.vendor.name}`, result });
      }

      case 'SAVE_RECONCILIATION': {
        const reconciliations = recordDailyReconciliation(payload.reconciliations);
        return NextResponse.json({ success: true, message: 'Daily physical reconciliation saved', reconciliations });
      }

      case 'UPDATE_RECIPE': {
        const index = store.recipes.findIndex(r => r.menuItem.toLowerCase() === payload.menuItem.toLowerCase());
        if (index !== -1) {
          store.recipes[index] = payload as RecipeBOM;
        } else {
          store.recipes.push(payload as RecipeBOM);
        }
        saveInventoryStore(store);
        return NextResponse.json({ success: true, message: 'Recipe BOM updated successfully' });
      }

      case 'DEPLETE_ORDER': {
        const result = depleteStockForOrderItems(payload.orderNumber, payload.items);
        return NextResponse.json({ success: true, message: 'Stock depleted for order', result });
      }

      case 'RAISE_PURCHASE_ORDER': {
        const po = recordPurchaseOrder(payload);
        return NextResponse.json({ success: true, message: `PO #${po.poNumber} created for ${po.itemName}`, po });
      }

      case 'UPDATE_PO_STATUS': {
        const po = updatePurchaseOrderStatus(payload.poId, payload.status);
        return NextResponse.json({ success: true, message: `PO #${po.poNumber} marked as ${po.status}`, po });
      }

      case 'CREATE_INTERNAL_TRANSFER': {
        const transfer = recordInternalTransfer(payload);
        return NextResponse.json({ success: true, message: `Transfer #${transfer.reqNo} to ${transfer.toOutlet} requested`, transfer });
      }

      case 'UPDATE_TRANSFER_STATUS': {
        const transfer = updateInternalTransferStatus(payload.transferId, payload.status);
        return NextResponse.json({ success: true, message: `Transfer #${transfer.reqNo} marked as ${transfer.status}`, transfer });
      }

      case 'CONVERT_SUB_RECIPE_BATCH': {
        const result = convertSubRecipeBatch(payload.subRecipeId, payload.batchMultiplier || 1);
        return NextResponse.json({ success: true, message: `Prepped ${result.batchYield}g of ${result.subRecipe.name}`, result });
      }

      case 'SAVE_MULTI_STAGE_RECIPE': {
        const recipes = saveMultiStageRecipe(payload.recipe);
        return NextResponse.json({ success: true, message: 'Multi-stage recipe saved', recipes });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Inventory POST API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
