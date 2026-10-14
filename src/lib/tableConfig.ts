export interface TableSection {
  id: string;
  name: string;
  tables: string[];
}

export const DEFAULT_TABLE_SECTIONS: TableSection[] = [
  { id: "GROUND", name: "Ground Floor", tables: ["1", "2", "3", "4", "5"] },
  { id: "AC_HALL", name: "AC Family Hall", tables: ["6", "7", "8", "9", "10"] },
  { id: "GARDEN", name: "Garden / Terrace", tables: ["11", "12", "13", "14", "15"] }
];

export function extractAllTableNumbers(sections: TableSection[]): string[] {
  if (!Array.isArray(sections) || sections.length === 0) {
    return Array.from({ length: 15 }, (_, i) => String(i + 1));
  }

  const set = new Set<string>();
  sections.forEach(s => {
    if (Array.isArray(s.tables)) {
      s.tables.forEach(t => {
        const clean = String(t).trim();
        if (clean) set.add(clean);
      });
    }
  });

  if (set.size === 0) {
    return Array.from({ length: 15 }, (_, i) => String(i + 1));
  }

  return Array.from(set).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

export function getSectionNameForTable(tableNumber: string, sections: TableSection[]): string {
  const match = sections.find(s => s.tables?.includes(String(tableNumber)));
  return match?.name || "Dine-in Floor";
}
