export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REJECTED: "Refusée",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS);

export function orderStatusLabel(status: string | null | undefined) {
  if (!status) return "Statut inconnu";
  return ORDER_STATUS_LABELS[status] ?? "Statut inconnu";
}
