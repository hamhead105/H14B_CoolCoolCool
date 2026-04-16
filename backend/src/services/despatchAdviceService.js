import fetch from 'node-fetch';

const DESPATCH_BASE_URL = process.env.DESPATCH_BASE_URL;
const DESPATCH_SESSION_ID = process.env.DESPATCH_SESSION_ID;

export async function createDespatchAdvice(order) {
  const { inputData, orderId } = order;

  const payload = {
    documentID: `DA-${orderId}`,
    senderId: String(inputData.seller?.companyId || 'SUPPLIER'),
    receiverId: String(inputData.buyer?.companyId || inputData.buyerId || 'BUYER'),
    copyIndicator: false,
    issueDate: inputData.order?.issueDate || new Date().toISOString().split('T')[0],
    documentStatusCode: 'Active',
    orderReference: {
      id: orderId,
    },
    despatchAdviceTypeCode: 'delivery',
    note: inputData.order?.note || 'Generated from order creation',
    despatchSupplierParty: {
      customerAssignedAccountId: String(inputData.seller?.companyId || 'SUPPLIER'),
      party: {
        name: inputData.seller?.name || 'Supplier',
        postalAddress: {
          streetName: inputData.seller?.street || '',
          buildingName: inputData.seller?.buildingName || '',
          buildingNumber: inputData.seller?.buildingNumber || '',
          cityName: inputData.seller?.city || '',
          postalZone: inputData.seller?.postalCode || '',
          addressLine: inputData.seller?.addressLine || '',
          countryIdentificationCode: inputData.seller?.countryCode || 'AU',
        },
        contact: {
          name: inputData.seller?.contactName || '',
          telephone: inputData.seller?.contactPhone || '',
          telefax: inputData.seller?.contactFax || '',
          email: inputData.seller?.contactEmail || '',
        },
      },
    },
    deliveryCustomerParty: {
      party: {
        name: inputData.buyer?.name || 'Buyer',
        postalAddress: {
          streetName: inputData.delivery?.street || inputData.buyer?.street || '',
          cityName: inputData.delivery?.city || inputData.buyer?.city || '',
          postalZone: inputData.delivery?.postalCode || inputData.buyer?.postalCode || '',
          countryIdentificationCode:
            inputData.delivery?.countryCode || inputData.buyer?.countryCode || 'AU',
        },
      },
    },
    shipment: {
      id: `SHIP-${orderId}`,
      consignmentId: `CONS-${orderId}`,
      delivery: {
        deliveryAddress: {
          streetName: inputData.delivery?.street || '',
          cityName: inputData.delivery?.city || '',
          postalZone: inputData.delivery?.postalCode || '',
          countryIdentificationCode: inputData.delivery?.countryCode || 'AU',
        },
        requestedDeliveryPeriod: {
          startDate:
            inputData.delivery?.requestedStartDate ||
            inputData.order?.issueDate ||
            new Date().toISOString().split('T')[0],
          endDate:
            inputData.delivery?.requestedEndDate ||
            inputData.order?.issueDate ||
            new Date().toISOString().split('T')[0],
        },
      },
    },
    despatchLines: (inputData.items || []).length > 0
      ? (inputData.items || []).map((item, i) => ({
          id: `LINE-${i + 1}`,
          deliveredQuantity: item.quantity || 1,
          deliveredQuantityUnitCode: item.unitCode || 'EA',
          orderLineReference: {
            lineId: String(i + 1),
            orderReference: {
              id: orderId,
            },
          },
          item: {
            name: item.product?.name || `Item ${i + 1}`,
            description: item.product?.description || '',
          },
        }))
      : [{
          id: 'LINE-1',
          deliveredQuantity: 1,
          deliveredQuantityUnitCode: 'EA',
          orderLineReference: {
            lineId: '1',
            orderReference: {
              id: orderId,
            },
          },
          item: {
            name: 'Order Item',
            description: '',
          },
        }],
  };

  const res = await fetch(`${DESPATCH_BASE_URL}/despatch-advices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'sessionId': DESPATCH_SESSION_ID,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Despatch Advice API error: ${res.status}`);
  }

  return res.json();
}

export async function getDespatchAdvice(despatchAdviceId) {
  const res = await fetch(`${DESPATCH_BASE_URL}/despatch-advices/${despatchAdviceId}`, {
    headers: {
      'Accept': 'application/json',
      'sessionId': DESPATCH_SESSION_ID,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Despatch Advice API error: ${res.status}`);
  }

  throw new Error(err.message || 'Invoice Generation');

  return res.json();
}