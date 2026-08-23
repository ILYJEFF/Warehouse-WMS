import Link from "next/link";
import { money, stockChip } from "@/lib/utils";

type StockRow = {
  id: string;
  qty: number;
  item: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    reorderPoint: number;
    unitCostCents: number;
  };
};

type LocationStockTableProps = {
  balances: StockRow[];
  emptyMessage?: string;
};

export function LocationStockTable({
  balances,
  emptyMessage = "No stock on hand at this location.",
}: LocationStockTableProps) {
  if (balances.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
        <Link href="/receive" className="btn-primary mt-3 inline-flex">
          Receive stock
        </Link>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((row) => {
            const chip = stockChip(row.qty, row.item.reorderPoint);
            return (
              <tr key={row.id}>
                <td className="sku">
                  <Link href={`/items/${row.item.id}`} className="row-link-target">
                    {row.item.sku}
                  </Link>
                </td>
                <td>
                  <Link href={`/items/${row.item.id}`} className="row-link-target">
                    {row.item.name}
                  </Link>
                </td>
                <td className="font-semibold">{row.qty}</td>
                <td className="text-muted">{row.item.unit}</td>
                <td>{money(row.qty * row.item.unitCostCents)}</td>
                <td>
                  <span className={chip.className}>{chip.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
